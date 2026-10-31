import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, CheckCircle2, Sliders, ToggleLeft } from 'lucide-react';

export default function RulesModal({ isOpen, onClose, rules, onSave, onReset }) {
  const [activeTab, setActiveTab] = useState('consensus');
  const [localRules, setLocalRules] = useState(rules);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (rules) {
      setLocalRules(JSON.parse(JSON.stringify(rules)));
    }
  }, [rules, isOpen]);

  if (!isOpen || !localRules) return null;

  const handleConsensusChange = (key, value) => {
    setLocalRules(prev => ({
      ...prev,
      consensus: {
        ...prev.consensus,
        [key]: parseInt(value, 10)
      }
    }));
  };

  const handleParamChange = (section, key, value) => {
    setLocalRules(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: parseFloat(value)
      }
    }));
  };

  const handleToggleModule = (moduleKey, enabled) => {
    setLocalRules(prev => ({
      ...prev,
      toggles: {
        ...prev.toggles,
        [moduleKey]: enabled
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(localRules);
      onClose();
    } catch (e) {
      alert("Error saving rules: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm("Reset all strategy parameters & consensus thresholds to factory defaults?")) {
      await onReset();
      onClose();
    }
  };

  const MODULE_NAMES = [
    { key: "m1_rsi_rangeshift", name: "Module 1: RSI Range-Shift (>40)" },
    { key: "m2_ema_cross", name: "Module 2: EMA Crossover (20 > 50)" },
    { key: "m3_volume_spike", name: "Module 3: Volume Spike (>2x 20-MA)" },
    { key: "m4_vwap_momentum", name: "Module 4: VWAP Momentum (Price > VWAP)" },
    { key: "m5_bollinger_breakout", name: "Module 5: Bollinger Band Breakout (Upper)" },
    { key: "m6_macd_crossover", name: "Module 6: MACD Bullish Crossover" },
    { key: "m7_supertrend_reversal", name: "Module 7: SuperTrend (ATR Volatility)" },
    { key: "m8_stochastic_crossover", name: "Module 8: Stochastic RSI Oversold" },
    { key: "m9_adx_trend_strength", name: "Module 9: ADX Trend Strength (>25)" },
    { key: "m10_support_resistance_bounce", name: "Module 10: 20-Day Support Bounce" }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sliders size={20} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Strategy & Consensus Parameters</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
          {[
            { id: 'consensus', label: '1. Consensus Engine' },
            { id: 'params', label: '2. Technical Indicators' },
            { id: 'toggles', label: '3. Module Toggles' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="btn"
              style={{
                background: activeTab === tab.id ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                borderColor: activeTab === tab.id ? 'var(--accent-cyan)' : 'transparent',
                color: activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--text-muted)',
                padding: '0.4rem 0.85rem',
                fontSize: '0.82rem'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Consensus Engine */}
        {activeTab === 'consensus' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                🟢 Consensus Buy Signal Threshold ({localRules.consensus?.consensus_buy_threshold || 6}/10 modules)
              </label>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Minimum number of bullish modules required to flag a verified "BUY SIGNAL".
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input
                  type="range"
                  min="4"
                  max="10"
                  value={localRules.consensus?.consensus_buy_threshold || 6}
                  onChange={(e) => handleConsensusChange('consensus_buy_threshold', e.target.value)}
                  style={{ flex: 1, accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
                />
                <span className="mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-emerald)', minWidth: 40, textAlign: 'center' }}>
                  {localRules.consensus?.consensus_buy_threshold || 6}
                </span>
              </div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                🔴 Auto-Sell Exit Threshold (&lt; {localRules.consensus?.auto_sell_exit_threshold || 5}/10 modules)
              </label>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                When active positions drop below this score, automated paper exit is executed to protect capital.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input
                  type="range"
                  min="2"
                  max="7"
                  value={localRules.consensus?.auto_sell_exit_threshold || 5}
                  onChange={(e) => handleConsensusChange('auto_sell_exit_threshold', e.target.value)}
                  style={{ flex: 1, accentColor: 'var(--accent-rose)', cursor: 'pointer' }}
                />
                <span className="mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-rose)', minWidth: 40, textAlign: 'center' }}>
                  {localRules.consensus?.auto_sell_exit_threshold || 5}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Technical Parameters */}
        {activeTab === 'params' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '0.85rem', borderRadius: 8 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>RSI Configuration</span>
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Window Period:</label>
                <input
                  type="number"
                  value={localRules.rsi?.window || 14}
                  onChange={(e) => handleParamChange('rsi', 'window', e.target.value)}
                  className="input-dark mono"
                />
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bounce Floor:</label>
                <input
                  type="number"
                  value={localRules.rsi?.bounce_floor || 40}
                  onChange={(e) => handleParamChange('rsi', 'bounce_floor', e.target.value)}
                  className="input-dark mono"
                />
              </div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '0.85rem', borderRadius: 8 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>EMA Moving Averages</span>
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fast EMA Span:</label>
                <input
                  type="number"
                  value={localRules.ema?.fast_span || 20}
                  onChange={(e) => handleParamChange('ema', 'fast_span', e.target.value)}
                  className="input-dark mono"
                />
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Slow EMA Span:</label>
                <input
                  type="number"
                  value={localRules.ema?.slow_span || 50}
                  onChange={(e) => handleParamChange('ema', 'slow_span', e.target.value)}
                  className="input-dark mono"
                />
              </div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '0.85rem', borderRadius: 8 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>Bollinger Bands</span>
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Window:</label>
                <input
                  type="number"
                  value={localRules.bollinger?.window || 20}
                  onChange={(e) => handleParamChange('bollinger', 'window', e.target.value)}
                  className="input-dark mono"
                />
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Std Dev:</label>
                <input
                  type="number"
                  step="0.1"
                  value={localRules.bollinger?.dev || 2.0}
                  onChange={(e) => handleParamChange('bollinger', 'dev', e.target.value)}
                  className="input-dark mono"
                />
              </div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '0.85rem', borderRadius: 8 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>ADX & Volume Multipliers</span>
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ADX Threshold:</label>
                <input
                  type="number"
                  value={localRules.adx?.threshold || 25}
                  onChange={(e) => handleParamChange('adx', 'threshold', e.target.value)}
                  className="input-dark mono"
                />
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Volume Spike Mult:</label>
                <input
                  type="number"
                  step="0.1"
                  value={localRules.volume?.multiplier || 2.0}
                  onChange={(e) => handleParamChange('volume', 'multiplier', e.target.value)}
                  className="input-dark mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Module Toggles */}
        {activeTab === 'toggles' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Disable any module to exclude it from the consensus score calculation.
            </p>
            {MODULE_NAMES.map(m => {
              const isEnabled = localRules.toggles ? localRules.toggles[m.key] !== false : true;
              return (
                <label
                  key={m.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.9rem',
                    background: isEnabled ? 'rgba(16, 185, 129, 0.08)' : 'rgba(30, 41, 59, 0.4)',
                    border: `1px solid ${isEnabled ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '0.82rem', color: isEnabled ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    {m.name}
                  </span>
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => handleToggleModule(m.key, e.target.checked)}
                    style={{ accentColor: 'var(--accent-emerald)', width: 16, height: 16, cursor: 'pointer' }}
                  />
                </label>
              );
            })}
          </div>
        )}

        {/* Modal Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={handleReset}
            className="btn btn-outline"
            style={{ fontSize: '0.78rem', color: 'var(--accent-rose)' }}
          >
            <RotateCcw size={14} />
            <span>Factory Reset</span>
          </button>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="btn btn-emerald">
              <Save size={15} />
              <span>{saving ? "Saving..." : "Save & Apply Changes"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
