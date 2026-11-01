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
  Percent, 
  Scale, 
  AlertCircle, 
  HelpCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Info,
  Clock,
  ChevronRight,
  X
} from 'lucide-react';

import PayoffChart from './PayoffChart';
import FoOrderModal from './FoOrderModal';
import { FO_UNDERLYINGS, FO_STRATEGY_DEFINITIONS, buildStrategyInstance } from '../data/optionsData';
import { api } from '../api';

export default function DerivativesDashboard({
  walletBalance,
  onRefreshWallet,
  onAddLog
}) {
  // Strategy & Underlying selection
  const [selectedStrategyDefId, setSelectedStrategyDefId] = useState('BULL_PUT_SPREAD');
  const [selectedUnderlyingTicker, setSelectedUnderlyingTicker] = useState('NIFTY');
  const [activeStrategyInstance, setActiveStrategyInstance] = useState(null);
  
  // Phase filter & search
  const [activePhaseFilter, setActivePhaseFilter] = useState('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [dte, setDte] = useState(4); // Days to expiry (weekly)

  // Modals & Ledgers
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [positions, setPositions] = useState([]);
  const [foRules, setFoRules] = useState({
    take_profit_target_pct: 50.0,
    stop_loss_limit_pct: 100.0,
    expiry_auto_squareoff: true,
    auto_exit_enabled: true
  });
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState('inspector'); // 'inspector' or 'matrix'

  // Build current strategy instance on selection change
  useEffect(() => {
    const stratDef = FO_STRATEGY_DEFINITIONS.find(s => s.id === selectedStrategyDefId) || FO_STRATEGY_DEFINITIONS[0];
    const underlying = FO_UNDERLYINGS.find(u => u.ticker === selectedUnderlyingTicker) || FO_UNDERLYINGS[0];
    const instance = buildStrategyInstance(stratDef, underlying, dte);
    setActiveStrategyInstance(instance);
  }, [selectedStrategyDefId, selectedUnderlyingTicker, dte]);

  // Load active F&O positions
  useEffect(() => {
    loadPositionsAndRules();
  }, []);

  const loadPositionsAndRules = async () => {
    try {
      const activePos = await api.getFoPositions();
      setPositions(activePos || []);
      const rules = await api.getFoRules();
      if (rules) setFoRules(rules);
    } catch (e) {
      console.error("Error loading positions:", e);
    }
  };

  // Filter strategies list
  const filteredStrategies = FO_STRATEGY_DEFINITIONS.filter(s => {
    if (activePhaseFilter === 'PHASE_1' && !s.phase.includes('Phase 1')) return false;
    if (activePhaseFilter === 'PHASE_2' && !s.phase.includes('Phase 2')) return false;
    if (activePhaseFilter === 'PHASE_3' && !s.phase.includes('Phase 3')) return false;

    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.alias.toLowerCase().includes(q) ||
        s.idealFor.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExecuteStrategy = async ({ strategyInstance, lots }) => {
    const res = await api.executeFoStrategy({ strategyInstance, lots });
    await loadPositionsAndRules();
    if (onRefreshWallet) await onRefreshWallet();
    return res;
  };

  const handleSquareoff = async (posId) => {
    if (confirm("Square off this multi-leg F&O position at current market valuation?")) {
      await api.exitFoStrategy(posId, "MANUAL_SQUAREOFF");
      await loadPositionsAndRules();
      if (onRefreshWallet) await onRefreshWallet();
    }
  };

  const handleSaveRules = async (e) => {
    e.preventDefault();
    await api.updateFoRules(foRules);
    setIsRulesModalOpen(false);
  };

  // Helper for quick underlying change when choosing strategy
  const handleSelectStrategy = (stratId) => {
    setSelectedStrategyDefId(stratId);
    // Auto-pick ideal underlying based on strategy character
    if (stratId === 'BULL_CALL_SPREAD') setSelectedUnderlyingTicker('HDFCBANK');
    else if (stratId === 'BULL_PUT_SPREAD') setSelectedUnderlyingTicker('NIFTY');
    else if (stratId === 'CALL_RATIO_BACKSPREAD') setSelectedUnderlyingTicker('TATAMOTORS');
    else if (stratId === 'BEAR_PUT_SPREAD') setSelectedUnderlyingTicker('TCS');
    else if (stratId === 'BEAR_CALL_SPREAD') setSelectedUnderlyingTicker('INFY');
    else if (stratId === 'PROTECTIVE_COLLAR') setSelectedUnderlyingTicker('RELIANCE');
    else if (stratId === 'IRON_CONDOR') setSelectedUnderlyingTicker('BANKNIFTY');
    else if (stratId === 'SHORT_IRON_BUTTERFLY') setSelectedUnderlyingTicker('FINNIFTY');
    else if (stratId === 'HEDGED_STRADDLE_STRANGLE') setSelectedUnderlyingTicker('NIFTY');
    else if (stratId === 'LONG_STRADDLE_STRANGLE') setSelectedUnderlyingTicker('RELIANCE');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Header & Macro Index Ribbon */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '0.85rem'
      }}>
        {FO_UNDERLYINGS.slice(0, 4).map(idx => {
          const isSelected = selectedUnderlyingTicker === idx.ticker;
          return (
            <div
              key={idx.ticker}
              onClick={() => setSelectedUnderlyingTicker(idx.ticker)}
              style={{
                background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.75)',
                border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                borderRadius: 12,
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {idx.ticker}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {idx.weeklyExpiryDay}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
                <span className="mono" style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                  ₹{idx.spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
                  IV {idx.iv}%
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.7rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  IVP: <strong>{idx.ivPercentile}%</strong>
                </span>
                <span style={{
                  color: idx.marketBias.includes('BULL') ? 'var(--accent-emerald)' : (idx.marketBias.includes('BEAR') ? 'var(--accent-rose)' : 'var(--accent-cyan)'),
                  fontWeight: 700
                }}>
                  {idx.marketBias}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Strategy Selector Bar (Horizontal Quick Switcher for all 10 Strategies) */}
      <div className="card-panel" style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Derivatives Strategy Selector</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              (10 Master Institutional F&O Setups)
            </span>
          </div>

          {/* Underlying Asset Switcher Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Underlying:</span>
            <select
              value={selectedUnderlyingTicker}
              onChange={(e) => setSelectedUnderlyingTicker(e.target.value)}
              className="input-dark mono"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.82rem', fontWeight: 700 }}
            >
              {FO_UNDERLYINGS.map(u => (
                <option key={u.ticker} value={u.ticker}>
                  {u.ticker} ({u.name}) · Spot ₹{u.spotPrice}
                </option>
              ))}
            </select>

            <button
              onClick={() => setIsRulesModalOpen(true)}
              className="btn btn-outline"
              style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
            >
              <Sliders size={13} color="var(--accent-cyan)" />
              <span>Auto-Exit Rules</span>
            </button>
          </div>
        </div>

        {/* 10 Strategy Chips grouped by Phase */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
          {FO_STRATEGY_DEFINITIONS.map((s, idx) => {
            const isSelected = selectedStrategyDefId === s.id;
            let phaseColor = 'var(--accent-cyan)';
            if (s.phase.includes('Phase 1')) phaseColor = 'var(--accent-emerald)';
            else if (s.phase.includes('Phase 2')) phaseColor = 'var(--accent-rose)';
            else phaseColor = 'var(--accent-indigo)';

            return (
              <button
                key={s.id}
                onClick={() => handleSelectStrategy(s.id)}
                style={{
                  background: isSelected ? 'rgba(56, 189, 248, 0.18)' : 'rgba(30, 41, 59, 0.5)',
                  border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                  color: isSelected ? 'var(--text-main)' : 'var(--text-muted)',
                  borderRadius: 8,
                  padding: '0.45rem 0.75rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: isSelected ? 800 : 600,
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: phaseColor }} />
                <span>{idx + 1}. {s.name}</span>
                <span style={{ fontSize: '0.62rem', opacity: 0.75 }}>
                  {s.type}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Workspace: Risk-to-Reward Profile & Inspector */}
      {activeStrategyInstance && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem' }}>
          {/* Left Column: Strategy Deep-Dive & Payoff */}
          <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Title & Deploy Action */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{activeStrategyInstance.strategyName}</h2>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({activeStrategyInstance.alias})</span>
                  <span className="badge-tag badge-cyan">{activeStrategyInstance.phase}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                  <span className="mono" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    {activeStrategyInstance.underlyingName} ({activeStrategyInstance.underlyingTicker})
                  </span>
                  <span className="mono" style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
                    Spot: ₹{activeStrategyInstance.spotPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="badge-tag badge-emerald">
                    Lot Size: {activeStrategyInstance.lotSize}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsOrderModalOpen(true)}
                className="btn btn-primary"
                style={{ padding: '0.55rem 1.25rem' }}
              >
                <Zap size={16} />
                <span>Deploy Strategy</span>
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
                <span>Indian Market Application & Strategic Rationale</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                {activeStrategyInstance.indianMarketApplication}
              </p>
            </div>

            {/* Multi-Leg Construction Table */}
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                Basket Architecture ({activeStrategyInstance.legs.length} Legs)
              </span>
              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden' }}>
                {activeStrategyInstance.legs.map((leg, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.85rem',
                    borderBottom: i < activeStrategyInstance.legs.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    background: leg.action === 'BUY' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(244, 63, 94, 0.05)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className={`badge-tag ${leg.action === 'BUY' ? 'badge-emerald' : 'badge-rose'}`} style={{ fontSize: '0.65rem' }}>
                        {leg.action} {leg.qtyRatio > 1 ? `${leg.qtyRatio}x` : ''}
                      </span>
                      <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                        {activeStrategyInstance.underlyingTicker} {leg.strike} {leg.optionType}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                        Premium: ₹{leg.premium.toFixed(1)}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                        {leg.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payoff Curve Visualizer */}
            <PayoffChart
              payoffCurve={activeStrategyInstance.payoffCurve}
              breakevens={activeStrategyInstance.breakevens}
              currentSpot={activeStrategyInstance.spotPrice}
              height={220}
            />
          </div>

          {/* Right Column: Institutional Risk-to-Reward Profile Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <Scale size={18} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Risk-to-Reward Profile</h3>
              </div>

              {/* R:R Ratio Card */}
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '0.85rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Risk : Reward Ratio
                </span>
                <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.2rem' }}>
                  {activeStrategyInstance.riskRewardRatio}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  {activeStrategyInstance.riskProfileCategory}
                </span>
              </div>

              {/* Visual Risk vs Reward Bar */}
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  <span>Max Risk: -₹{activeStrategyInstance.maxLossPerLot.toLocaleString('en-IN')}</span>
                  <span>Max Profit: {typeof activeStrategyInstance.maxProfitPerLot === 'number' ? `+₹${activeStrategyInstance.maxProfitPerLot.toLocaleString('en-IN')}` : 'UNLIMITED'}</span>
                </div>
                <div style={{ width: '100%', height: 10, background: 'rgba(15, 23, 42, 0.8)', borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
                  <div style={{
                    width: typeof activeStrategyInstance.maxProfitPerLot === 'number'
                      ? `${Math.max(15, Math.min(85, (activeStrategyInstance.maxLossPerLot / (activeStrategyInstance.maxLossPerLot + activeStrategyInstance.maxProfitPerLot)) * 100))}%`
                      : '25%',
                    background: 'var(--accent-rose)',
                    height: '100%'
                  }} title="Max Risk" />
                  <div style={{
                    flex: 1,
                    background: 'var(--accent-emerald)',
                    height: '100%'
                  }} title="Max Potential Reward" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginTop: '0.35rem' }}>
                  <span style={{ color: 'var(--accent-rose)' }}>Capital at Risk</span>
                  <span style={{ color: 'var(--accent-emerald)' }}>Reward Horizon</span>
                </div>
              </div>

              {/* Probability of Profit (PoP %) Gauge */}
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Probability of Profit (PoP)
                  </span>
                  <span className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: activeStrategyInstance.popPct >= 60 ? 'var(--accent-emerald)' : 'var(--accent-cyan)' }}>
                    {activeStrategyInstance.popPct}%
                  </span>
                </div>
                <div style={{ width: '100%', height: 6, background: 'rgba(15, 23, 42, 0.8)', borderRadius: 4, overflow: 'hidden', marginTop: '0.4rem' }}>
                  <div style={{ width: `${activeStrategyInstance.popPct}%`, height: '100%', background: activeStrategyInstance.popPct >= 60 ? 'var(--accent-emerald)' : 'var(--accent-cyan)' }} />
                </div>
              </div>

              {/* Financial Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.78rem' }}>
                <div style={{ background: 'rgba(30, 41, 59, 0.35)', padding: '0.6rem', borderRadius: 8 }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>Return on Risk:</span>
                  <strong className="mono" style={{ color: 'var(--accent-emerald)' }}>
                    {activeStrategyInstance.returnOnRiskPct}
                  </strong>
                </div>
                <div style={{ background: 'rgba(30, 41, 59, 0.35)', padding: '0.6rem', borderRadius: 8 }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>Margin ROI:</span>
                  <strong className="mono" style={{ color: 'var(--accent-cyan)' }}>
                    {activeStrategyInstance.returnOnMarginPct}
                  </strong>
                </div>
                <div style={{ background: 'rgba(30, 41, 59, 0.35)', padding: '0.6rem', borderRadius: 8 }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>SEBI Margin:</span>
                  <strong className="mono">
                    ₹{activeStrategyInstance.requiredMarginPerLot.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div style={{ background: 'rgba(30, 41, 59, 0.35)', padding: '0.6rem', borderRadius: 8 }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>Daily Theta:</span>
                  <strong className="mono" style={{ color: activeStrategyInstance.isCredit ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                    {activeStrategyInstance.greeks.theta}
                  </strong>
                </div>
              </div>

              {/* Breakeven Thresholds */}
              <div style={{ background: 'rgba(30, 41, 59, 0.35)', padding: '0.6rem', borderRadius: 8 }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', marginBottom: '0.2rem' }}>
                  Breakeven Strike Horizon:
                </span>
                <span className="mono" style={{ color: 'var(--accent-amber)', fontWeight: 700, fontSize: '0.85rem' }}>
                  {activeStrategyInstance.breakevens.map(b => `₹${b}`).join('  |  ')}
                </span>
              </div>
            </div>

            {/* Quick Deploy CTA */}
            <button
              onClick={() => setIsOrderModalOpen(true)}
              className="btn btn-emerald"
              style={{ padding: '0.75rem', fontSize: '0.9rem', width: '100%' }}
            >
              <Zap size={16} />
              <span>Deploy 1-Lot ({activeStrategyInstance.isCredit ? `Credit +₹${activeStrategyInstance.totalCashEffectPerLot}` : `Debit -₹${activeStrategyInstance.totalCashEffectPerLot}`})</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Active F&O Spreads Ledger */}
      <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={16} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Active Derivatives Spreads ({positions.length})</h3>
          </div>

          {foRules.auto_exit_enabled && (
            <span className="badge-tag badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.65rem' }}>
              <ShieldCheck size={12} />
              Auto-Exit Active (TP {foRules.take_profit_target_pct}% | SL {foRules.stop_loss_limit_pct}%)
            </span>
          )}
        </div>

        <div style={{ maxHeight: 220, overflowY: 'auto' }}>
          {positions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              <p style={{ marginBottom: '0.75rem' }}>No active F&O spreads or hedges deployed. Select any strategy above and click "Deploy Strategy".</p>
              <button
                onClick={async () => {
                  await api.seedDemoPortfolio();
                  await loadPositionsAndRules();
                  if (onRefreshWallet) await onRefreshWallet();
                }}
                className="btn btn-emerald"
                style={{ fontSize: '0.78rem', padding: '0.4rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Zap size={13} />
                <span>⚡ Load Sample F&O Spreads (NIFTY Iron Condor & BANKNIFTY Spread)</span>
              </button>
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

      {/* 5. 1-Click Execution Modal */}
      <FoOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        strategyInstance={activeStrategyInstance}
        walletBalance={walletBalance}
        onExecute={handleExecuteStrategy}
      />

      {/* 6. Auto-Exit Rules Modal */}
      {isRulesModalOpen && (
        <div className="modal-overlay" onClick={() => setIsRulesModalOpen(false)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="var(--accent-emerald)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>F&O Auto-Exit Risk Rules</h3>
              </div>
              <button onClick={() => setIsRulesModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRules}>
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
                    Auto-exit credit spreads when 50% max profit is captured to mitigate late-cycle gamma spikes.
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
                    🛡️ Stop-Loss Limit ({foRules.stop_loss_limit_pct}% of Risk Threshold)
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
