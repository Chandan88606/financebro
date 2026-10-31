import React, { useState } from 'react';
import { CheckCircle2, XCircle, TrendingUp, BarChart3, LineChart, ShoppingBag, ShieldAlert } from 'lucide-react';
import TradingViewChart from './TradingViewChart';

export default function ConsensusInspector({
  stockDetail,
  onOpenTrade,
  walletBalance
}) {
  const [viewTab, setViewTab] = useState('chart'); // 'chart' or 'diagnosis'

  if (!stockDetail) {
    return (
      <div className="card-panel" style={{ height: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Select a stock from the watchlist to view technical consensus & candlestick charts.
      </div>
    );
  }

  const {
    ticker,
    name,
    sector,
    symbol,
    current_price,
    change_pct,
    consensus_score,
    passed_modules = [],
    failed_modules = [],
    module_details = {},
    buy_signal
  } = stockDetail;

  const isPositive = change_pct >= 0;
  const isAffordable = current_price <= walletBalance;
  const maxAffordableQty = isAffordable && current_price > 0 ? Math.floor(walletBalance / current_price) : 0;

  return (
    <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Stock Header & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {ticker}
            </h2>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {name}
            </span>
            <span className="badge-tag badge-cyan">
              {sector}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem' }}>
            <span className="mono" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
              ₹{current_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="mono" style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              color: isPositive ? 'var(--accent-emerald)' : 'var(--accent-rose)'
            }}>
              {isPositive ? '+' : ''}{change_pct}%
            </span>
            {buy_signal && (
              <span className="badge-tag badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={12} />
                STRONG BUY CONSENSUS ({consensus_score}/10)
              </span>
            )}
          </div>
        </div>

        {/* Action Controls & Tab Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', background: 'rgba(30, 41, 59, 0.6)', padding: 3, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setViewTab('chart')}
              className="btn"
              style={{
                background: viewTab === 'chart' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                borderColor: viewTab === 'chart' ? 'var(--accent-cyan)' : 'transparent',
                color: viewTab === 'chart' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem'
              }}
            >
              <LineChart size={14} />
              <span>Chart</span>
            </button>
            <button
              onClick={() => setViewTab('diagnosis')}
              className="btn"
              style={{
                background: viewTab === 'diagnosis' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                borderColor: viewTab === 'diagnosis' ? 'var(--accent-cyan)' : 'transparent',
                color: viewTab === 'diagnosis' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem'
              }}
            >
              <BarChart3 size={14} />
              <span>10 Modules ({passed_modules.length}P / {failed_modules.length}F)</span>
            </button>
          </div>

          <button
            onClick={() => onOpenTrade(ticker, current_price, 'BUY')}
            disabled={!isAffordable}
            className="btn btn-emerald"
            style={{ padding: '0.45rem 1rem' }}
          >
            <ShoppingBag size={15} />
            <span>{isAffordable ? `Paper Buy (Max ${maxAffordableQty})` : 'Over Budget'}</span>
          </button>
        </div>
      </div>

      {/* Main View: Chart or 10-Module Diagnosis */}
      {viewTab === 'chart' ? (
        <TradingViewChart symbol={symbol || `${ticker}.NS`} height={420} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', minHeight: 420 }}>
          {/* Passed Modules */}
          <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 12, padding: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <CheckCircle2 size={16} />
              <span>PASSED MODULES ({passed_modules.length})</span>
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 360, overflowY: 'auto' }}>
              {passed_modules.length === 0 ? (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No bullish signals triggered.</span>
              ) : (
                passed_modules.map(modKey => {
                  const info = module_details[modKey] || {};
                  return (
                    <div key={modKey} style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 8, padding: '0.65rem 0.85rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                        {info.name || modKey}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {info.description || 'Condition verified bullish.'}
                      </div>
                      {info.value_str && (
                        <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', marginTop: '0.25rem' }}>
                          Value: {info.value_str}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Failed Modules */}
          <div style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: 12, padding: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <XCircle size={16} />
              <span>FAILED / NEUTRAL MODULES ({failed_modules.length})</span>
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 360, overflowY: 'auto' }}>
              {failed_modules.length === 0 ? (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>All 10 modules passed! Complete consensus!</span>
              ) : (
                failed_modules.map(modKey => {
                  const info = module_details[modKey] || {};
                  return (
                    <div key={modKey} style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: 8, padding: '0.65rem 0.85rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                        {info.name || modKey}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {info.description || 'Did not meet bullish threshold.'}
                      </div>
                      {info.value_str && (
                        <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--accent-rose)', marginTop: '0.25rem' }}>
                          Value: {info.value_str}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
