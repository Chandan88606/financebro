import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, LineChart, BarChart3, ShoppingBag, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import TradingViewChart from './TradingViewChart';

export default function ConsensusInspector({
  stockDetail,
  onOpenTrade,
  walletBalance,
  refreshKey,
  isWatchlistCollapsed,
  onToggleWatchlist
}) {
  const [viewTab, setViewTab] = useState('chart');
  const [chartHeight, setChartHeight] = useState(800); // Generous 800px default height
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

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

  // Calculate dynamic fullscreen height
  const activeHeight = isFullscreen
    ? (typeof window !== 'undefined' ? window.innerHeight - 85 : 920)
    : chartHeight;

  return (
    <div
      className={isFullscreen ? '' : 'card-panel'}
      style={isFullscreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        background: '#070c18',
        padding: '0.75rem 1.25rem',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      } : {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}
    >
      {/* Stock Header & Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: isFullscreen ? '0.5rem' : '0.85rem'
      }}>
        {/* Left: Ticker, Name, LTP */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: isFullscreen ? '1.35rem' : '1.45rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              {ticker}
            </h2>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {name}
            </span>
            <span className="badge-tag badge-cyan">
              {sector}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
              ₹{current_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', background: 'rgba(30, 41, 59, 0.8)', padding: '0.15rem 0.45rem', borderRadius: 6, border: '1px solid var(--border-subtle)', fontWeight: 600 }}>
              Official NSE LTP
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

        {/* Right: Height controls, Fullscreen Button, Wide Mode & Trade Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Tab Switcher: Chart vs 10 Modules */}
          <div style={{ display: 'flex', background: 'rgba(30, 41, 59, 0.6)', padding: 3, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setViewTab('chart')}
              className="btn"
              type="button"
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
              type="button"
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

          {/* Height Presets (Only visible when not in fullscreen and tab is chart) */}
          {viewTab === 'chart' && !isFullscreen && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              background: 'rgba(30, 41, 59, 0.6)',
              padding: '2px 4px',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)'
            }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', padding: '0 4px', fontWeight: 600 }}>
                Size:
              </span>
              {[
                { label: '650px', val: 650 },
                { label: '800px (Large)', val: 800 },
                { label: '950px (Huge)', val: 950 }
              ].map(sz => (
                <button
                  key={sz.val}
                  onClick={() => setChartHeight(sz.val)}
                  type="button"
                  style={{
                    background: chartHeight === sz.val ? 'var(--accent-cyan)' : 'transparent',
                    color: chartHeight === sz.val ? '#050811' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: 5,
                    padding: '2px 7px',
                    fontSize: '0.72rem',
                    fontWeight: chartHeight === sz.val ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {sz.label}
                </button>
              ))}
            </div>
          )}

          {/* Fullscreen Monitor Mode Toggle Button */}
          {viewTab === 'chart' && (
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              type="button"
              className="btn"
              title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Expand Chart to Full Screen Monitor (100vw x 100vh)'}
              style={{
                background: isFullscreen ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                borderColor: isFullscreen ? '#ef4444' : 'var(--accent-cyan)',
                color: isFullscreen ? '#fca5a5' : 'var(--accent-cyan)',
                padding: '0.4rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer'
              }}
            >
              {isFullscreen ? <Minimize2 size={15} color="#ef4444" /> : <Maximize2 size={15} />}
              <span>{isFullscreen ? '✕ Exit Fullscreen (Esc)' : '⛶ Fullscreen Monitor'}</span>
            </button>
          )}

          {/* Full-Width / Hide Watchlist Quick Toggle */}
          {!isFullscreen && onToggleWatchlist && (
            <button
              onClick={onToggleWatchlist}
              type="button"
              className="btn"
              title="Toggle Watchlist sidebar to give chart 100% desktop width"
              style={{
                background: isWatchlistCollapsed ? 'rgba(56, 189, 248, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                borderColor: isWatchlistCollapsed ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                color: isWatchlistCollapsed ? 'var(--accent-cyan)' : 'var(--text-muted)',
                padding: '0.4rem 0.8rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>{isWatchlistCollapsed ? '⇤ Show Watchlist' : '⇥ Full-Width View'}</span>
            </button>
          )}

          {/* Paper Buy Button */}
          <button
            onClick={() => onOpenTrade(ticker, current_price, 'BUY')}
            disabled={!isAffordable}
            className="btn btn-emerald"
            type="button"
            style={{ padding: '0.45rem 1rem' }}
          >
            <ShoppingBag size={15} />
            <span>{isAffordable ? `Paper Buy (Max ${maxAffordableQty})` : 'Over Budget'}</span>
          </button>
        </div>
      </div>

      {/* Main View: Real TradingView Chart or 10-Module Diagnosis */}
      {viewTab === 'chart' ? (
        <TradingViewChart
          symbol={symbol || `${ticker}.NS`}
          height={activeHeight}
          refreshKey={refreshKey}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', minHeight: 420 }}>
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
