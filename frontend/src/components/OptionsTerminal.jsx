import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Sliders, 
  Search, 
  CheckCircle2, 
  Layers, 
  BarChart2, 
  RotateCcw,
  AlertCircle,
  HelpCircle,
  Clock,
  X
} from 'lucide-react';

import PayoffChart from './PayoffChart';
import FoOrderModal from './FoOrderModal';
import { FO_UNDERLYINGS, FO_STRATEGY_DEFINITIONS } from '../data/optionsData';
import { api } from '../api';

export default function OptionsTerminal({
  walletBalance,
  onRefreshWallet,
  onAddLog
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState('BULL_CALL_SPREAD_HDFCBANK');
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [activePhase, setActivePhase] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dte, setDte] = useState(4); // Days to expiry

  const [positions, setPositions] = useState([]);
  const [foRules, setFoRules] = useState({
    take_profit_target_pct: 50.0,
    stop_loss_limit_pct: 100.0,
    expiry_auto_squareoff: true,
    auto_exit_enabled: true
  });
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [strategyToOrder, setStrategyToOrder] = useState(null);
  const [activeLedgerTab, setActiveLedgerTab] = useState('active'); // 'active' or 'history'
  const [foHistory, setFoHistory] = useState([]);

  // Load suggestions and positions
  useEffect(() => {
    loadFoData();
  }, [dte]);

  const loadFoData = async () => {
    try {
      const allSuggestions = await api.getFoSuggestions(dte);
      setSuggestions(allSuggestions);

      const activePos = await api.getFoPositions();
      setPositions(activePos || []);

      const rules = await api.getFoRules();
      if (rules) setFoRules(rules);

      // Select initial strategy if none selected or not found
      if (allSuggestions.length > 0) {
        const found = allSuggestions.find(s => s.id === selectedStrategyId) || allSuggestions[0];
        setSelectedStrategy(found);
        setSelectedStrategyId(found.id);
      }
    } catch (e) {
      console.error("Error loading F&O data:", e);
    }
  };

  // Filter suggestions by phase and search query
  const filteredSuggestions = suggestions.filter(s => {
    if (activePhase === 'PHASE_1' && !s.phase.includes('Phase 1')) return false;
    if (activePhase === 'PHASE_2' && !s.phase.includes('Phase 2')) return false;
    if (activePhase === 'PHASE_3' && !s.phase.includes('Phase 3')) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.strategyName.toLowerCase().includes(q) ||
        s.alias.toLowerCase().includes(q) ||
        s.underlyingTicker.toLowerCase().includes(q) ||
        s.underlyingName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSelectStrategy = (strat) => {
    setSelectedStrategy(strat);
    setSelectedStrategyId(strat.id);
  };

  const handleOpenDeployModal = (strat) => {
    setStrategyToOrder(strat);
    setIsOrderModalOpen(true);
  };

  const handleExecuteStrategy = async ({ strategyInstance, lots }) => {
    const res = await api.executeFoStrategy({ strategyInstance, lots });
    await loadFoData();
    if (onRefreshWallet) await onRefreshWallet();
    return res;
  };

  const handleSquareoff = async (posId) => {
    if (confirm("Square off this multi-leg F&O position at current market valuation?")) {
      await api.exitFoStrategy(posId, "MANUAL_SQUAREOFF");
      await loadFoData();
      if (onRefreshWallet) await onRefreshWallet();
    }
  };

  const handleSaveFoRules = async (e) => {
    e.preventDefault();
    await api.updateFoRules(foRules);
    setIsRulesModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Macro Indices & Market Regime Ribbon */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '0.85rem'
      }}>
        {FO_UNDERLYINGS.slice(0, 4).map(idx => (
          <div key={idx.ticker} style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: '0.75rem 1rem',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {idx.ticker}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Expiry: {idx.weeklyExpiryDay}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
              <span className="mono" style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                ₹{idx.spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                IV: {idx.iv}%
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.72rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                IVP: <strong style={{ color: idx.ivPercentile > 60 ? 'var(--accent-amber)' : 'var(--text-main)' }}>{idx.ivPercentile}%</strong>
              </span>
              <span style={{
                color: idx.marketBias.includes('BULL') ? 'var(--accent-emerald)' : (idx.marketBias.includes('BEAR') ? 'var(--accent-rose)' : 'var(--accent-cyan)'),
                fontWeight: 700
              }}>
                {idx.marketBias}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Main F&O Workspace: Left Suggestions + Right Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.25rem' }}>
        {/* Left Column: 10 Institutional Strategy Scanner */}
        <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 220px)' }}>
          {/* Header & Phase Switcher */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={16} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>F&O Strategies (10 Setups)</h3>
              </div>
              <button
                onClick={() => setIsRulesModalOpen(true)}
                title="Configure F&O Auto-Exit Rules"
                className="btn btn-outline"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
              >
                <Sliders size={12} color="var(--accent-cyan)" />
                <span>Auto-Exit</span>
              </button>
            </div>

            {/* Phase Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: 'All 10' },
                { id: 'PHASE_1', label: 'Phase 1: Bull' },
                { id: 'PHASE_2', label: 'Phase 2: Bear' },
                { id: 'PHASE_3', label: 'Phase 3: Neutral' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActivePhase(tab.id)}
                  style={{
                    background: activePhase === tab.id ? 'rgba(56, 189, 248, 0.18)' : 'rgba(30, 41, 59, 0.5)',
                    border: `1px solid ${activePhase === tab.id ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                    color: activePhase === tab.id ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    padding: '0.25rem 0.55rem',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 9 }} />
              <input
                type="text"
                placeholder="Search F&O strategy or ticker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-dark"
                style={{ width: '100%', paddingLeft: '2rem', fontSize: '0.8rem', padding: '0.4rem 0.5rem 0.4rem 2rem' }}
              />
            </div>
          </div>

          {/* Strategy List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.2rem' }}>
            {filteredSuggestions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <AlertCircle size={24} color="var(--accent-amber)" style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ fontSize: '0.82rem' }}>No strategies matched the active phase or search query.</p>
              </div>
            ) : (
              filteredSuggestions.map(strat => {
                const isSelected = selectedStrategyId === strat.id;
                return (
                  <div
                    key={strat.id}
                    onClick={() => handleSelectStrategy(strat)}
                    style={{
                      background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(30, 41, 59, 0.45)',
                      border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                      borderRadius: 10,
                      padding: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                          {strat.strategyName}
                        </span>
                      </div>
                      <span className={`badge-tag ${strat.isCredit ? 'badge-emerald' : 'badge-cyan'}`} style={{ fontSize: '0.62rem' }}>
                        {strat.isCredit ? 'CREDIT' : 'DEBIT'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                        {strat.underlyingTicker} @ ₹{strat.spotPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="mono" style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
                        Score: {strat.confidenceScore}/10
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', borderTop: '1px solid rgba(148, 163, 184, 0.08)', paddingTop: '0.35rem' }}>
                      <span>SEBI Margin: ₹{strat.requiredMarginPerLot.toLocaleString('en-IN')}</span>
                      <span className="mono" style={{ color: strat.isCredit ? 'var(--accent-emerald)' : 'var(--accent-cyan)' }}>
                        Net {strat.isCredit ? '+' : '-'}₹{Math.abs(strat.totalCashEffectPerLot).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Strategy Inspector, Payoff Diagram & Basket Execution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {selectedStrategy ? (
            <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{selectedStrategy.strategyName}</h2>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({selectedStrategy.alias})</span>
                    <span className="badge-tag badge-cyan">{selectedStrategy.phase}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                    <span className="mono" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                      Underlying: {selectedStrategy.underlyingName} ({selectedStrategy.underlyingTicker})
                    </span>
                    <span className="mono" style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
                      Spot: ₹{selectedStrategy.spotPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="badge-tag badge-emerald">
                      SEBI SPREAD MARGIN: ₹{selectedStrategy.requiredMarginPerLot.toLocaleString('en-IN')} / lot
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenDeployModal(selectedStrategy)}
                  className="btn btn-primary"
                  style={{ padding: '0.55rem 1.25rem' }}
                >
                  <Zap size={16} />
                  <span>Deploy Strategy (1-Click)</span>
                </button>
              </div>

              {/* Indian Market Application Callout */}
              <div style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: 10,
                padding: '0.85rem 1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                  <HelpCircle size={15} />
                  <span>Indian Market Application & Institutional Edge</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                  {selectedStrategy.indianMarketApplication}
                </p>
              </div>

              {/* Legs Breakdown & Greeks Radar Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {/* Multi-Leg Basket */}
                <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: 10, padding: '0.85rem', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                    Multi-Leg Construction ({selectedStrategy.legs.length} Legs)
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {selectedStrategy.legs.map((leg, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.45rem 0.65rem',
                        background: leg.action === 'BUY' ? 'rgba(16, 185, 129, 0.06)' : 'rgba(244, 63, 94, 0.06)',
                        borderRadius: 6,
                        border: `1px solid ${leg.action === 'BUY' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className={`badge-tag ${leg.action === 'BUY' ? 'badge-emerald' : 'badge-rose'}`} style={{ fontSize: '0.62rem' }}>
                            {leg.action} {leg.qtyRatio > 1 ? `${leg.qtyRatio}x` : ''}
                          </span>
                          <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                            {selectedStrategy.underlyingTicker} {leg.strike} {leg.optionType}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                            ₹{leg.premium.toFixed(1)}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>
                            {leg.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Greeks & Risk Parameters */}
                <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: 10, padding: '0.85rem', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                    Risk-Reward & Greek Sensitivities
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.78rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Max Profit:</span>
                      <strong className="mono" style={{ color: 'var(--accent-emerald)' }}>
                        {typeof selectedStrategy.maxProfitPerLot === 'number' ? `+₹${selectedStrategy.maxProfitPerLot.toLocaleString('en-IN')}` : selectedStrategy.maxProfitPerLot}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Max Loss:</span>
                      <strong className="mono" style={{ color: 'var(--accent-rose)' }}>
                        -₹{selectedStrategy.maxLossPerLot.toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Breakeven(s):</span>
                      <strong className="mono" style={{ color: 'var(--accent-amber)' }}>
                        {selectedStrategy.breakevens.map(b => `₹${b}`).join(' | ')}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Net Theta Decay:</span>
                      <strong className="mono" style={{ color: selectedStrategy.isCredit ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                        {selectedStrategy.greeks.theta}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Net Delta Exposure:</span>
                      <strong className="mono" style={{ color: 'var(--text-main)' }}>
                        {selectedStrategy.greeks.delta}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Vega Sensitivity:</span>
                      <strong className="mono" style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                        {selectedStrategy.greeks.vega}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payoff Diagram */}
              <PayoffChart
                payoffCurve={selectedStrategy.payoffCurve}
                breakevens={selectedStrategy.breakevens}
                currentSpot={selectedStrategy.spotPrice}
                height={220}
              />
            </div>
          ) : (
            <div className="card-panel" style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Select an institutional F&O strategy from the left panel to inspect architecture and payoff.
            </div>
          )}

          {/* 3. F&O Positions Ledger & Active Spreads */}
          <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setActiveLedgerTab('active')}
                  className="btn"
                  style={{
                    background: activeLedgerTab === 'active' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    borderColor: activeLedgerTab === 'active' ? 'var(--accent-cyan)' : 'transparent',
                    color: activeLedgerTab === 'active' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    padding: '0.35rem 0.8rem',
                    fontSize: '0.8rem'
                  }}
                >
                  <Activity size={14} />
                  <span>Active F&O Spreads ({positions.length})</span>
                </button>
              </div>

              {foRules.auto_exit_enabled && (
                <span className="badge-tag badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.65rem' }}>
                  <ShieldCheck size={12} />
                  Auto-Exit: TP {foRules.take_profit_target_pct}% | SL {foRules.stop_loss_limit_pct}%
                </span>
              )}
            </div>

            {/* Table of active F&O positions */}
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {positions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  No active F&O spreads or hedges deployed yet. Choose a strategy above and click "Deploy Strategy".
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: 650 }}>
                    <thead>
                      <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Strategy & Underlying</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Lots</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Margin Blocked</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Type</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Unrealized P&L</th>
                        <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Square-Off</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map(pos => {
                        const isPos = pos.unrealizedPnl >= 0;
                        return (
                          <tr key={pos.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-main)', display: 'block' }}>
                                {pos.strategyName}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {pos.underlyingTicker} · {pos.legs.length} Legs
                              </span>
                            </td>
                            <td className="mono" style={{ padding: '0.5rem 0.75rem' }}>
                              {pos.lots} ({pos.lots * pos.lotSize} Qty)
                            </td>
                            <td className="mono" style={{ padding: '0.5rem 0.75rem' }}>
                              ₹{pos.totalMarginRequired.toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <span className={`badge-tag ${pos.isCredit ? 'badge-emerald' : 'badge-cyan'}`} style={{ fontSize: '0.62rem' }}>
                                {pos.isCredit ? 'CREDIT' : 'DEBIT'}
                              </span>
                            </td>
                            <td className="mono" style={{ padding: '0.5rem 0.75rem', color: isPos ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 700 }}>
                              {isPos ? '+' : ''}₹{pos.unrealizedPnl.toFixed(2)} ({pos.unrealizedPnlPct}%)
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                              <button
                                onClick={() => handleSquareoff(pos.id)}
                                className="btn btn-rose"
                                style={{ padding: '0.25rem 0.65rem', fontSize: '0.72rem' }}
                              >
                                Square Off
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Execution Modal */}
      <FoOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        strategyInstance={strategyToOrder}
        walletBalance={walletBalance}
        onExecute={handleExecuteStrategy}
      />

      {/* 5. F&O Auto-Exit Rules Modal */}
      {isRulesModalOpen && (
        <div className="modal-overlay" onClick={() => setIsRulesModalOpen(false)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="var(--accent-emerald)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>F&O Auto-Exit & Risk Engine</h3>
              </div>
              <button onClick={() => setIsRulesModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveFoRules}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'rgba(30, 41, 59, 0.5)', padding: '0.75rem', borderRadius: 8 }}>
                  <input
                    type="checkbox"
                    checked={foRules.auto_exit_enabled}
                    onChange={(e) => setFoRules(r => ({ ...r, auto_exit_enabled: e.target.checked }))}
                    style={{ accentColor: 'var(--accent-emerald)' }}
                  />
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block' }}>
                      Enable Autonomous Auto-Exit Loop
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Continuously evaluates active option spreads and auto-liquidates if safety bounds are breached.
                    </span>
                  </div>
                </label>

                <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '0.75rem', borderRadius: 8 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-emerald)', display: 'block', marginBottom: '0.25rem' }}>
                    🎯 Take-Profit Target ({foRules.take_profit_target_pct}% of Max Profit)
                  </label>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Indian institutional desk rule: Auto-exit credit spreads when 50% max profit is captured to mitigate late-cycle gamma explosions.
                  </p>
                  <input
                    type="range"
                    min="25"
                    max="90"
                    step="5"
                    value={foRules.take_profit_target_pct}
                    onChange={(e) => setFoRules(r => ({ ...r, take_profit_target_pct: parseFloat(e.target.value) }))}
                    style={{ width: '100%', accentColor: 'var(--accent-emerald)' }}
                  />
                  <span className="mono" style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)' }}>
                    Target: {foRules.take_profit_target_pct}%
                  </span>
                </div>

                <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '0.75rem', borderRadius: 8 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-rose)', display: 'block', marginBottom: '0.25rem' }}>
                    🛡️ Stop-Loss Limit ({foRules.stop_loss_limit_pct}% of Premium/Margin)
                  </label>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Auto-squares off if spread loss reaches this percentage of initial premium or margin.
                  </p>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    step="10"
                    value={foRules.stop_loss_limit_pct}
                    onChange={(e) => setFoRules(r => ({ ...r, stop_loss_limit_pct: parseFloat(e.target.value) }))}
                    style={{ width: '100%', accentColor: 'var(--accent-rose)' }}
                  />
                  <span className="mono" style={{ fontSize: '0.85rem', color: 'var(--accent-rose)' }}>
                    Limit: -{foRules.stop_loss_limit_pct}%
                  </span>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'rgba(30, 41, 59, 0.5)', padding: '0.75rem', borderRadius: 8 }}>
                  <input
                    type="checkbox"
                    checked={foRules.expiry_auto_squareoff}
                    onChange={(e) => setFoRules(r => ({ ...r, expiry_auto_squareoff: e.target.checked }))}
                    style={{ accentColor: 'var(--accent-amber)' }}
                  />
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block' }}>
                      SEBI Physical Delivery Expiry Auto-Squareoff
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Auto-liquidates ITM stock options prior to 3:30 PM on expiry day to avoid physical settlement margin penalties.
                    </span>
                  </div>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setIsRulesModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-emerald" style={{ flex: 2 }}>
                  Save F&O Risk Parameters
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
