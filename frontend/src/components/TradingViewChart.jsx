import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';

export default function TradingViewChart({ symbol, height = 480, refreshKey }) {
  const containerRef = useRef(null);
  const [interval, setIntervalState] = useState('1'); // Default to 1-minute candles

  // Standardize symbol for TradingView Indian Market
  // Note: NSE blocks third-party widget embedding with "This symbol is only available on TradingView".
  // BSE is fully licensed & unblocked for embedded widgets, sharing identical Indian market pricing.
  let cleanSym = (symbol || 'RELIANCE').replace('.NS', '').replace('.BO', '');
  let tvSymbol = cleanSym;
  if (cleanSym === '^NSEI' || cleanSym === 'NIFTY50' || cleanSym === 'NIFTY') {
    tvSymbol = 'BSE:SENSEX';
  } else if (cleanSym === '^NSEBANK' || cleanSym === 'BANKNIFTY') {
    tvSymbol = 'BSE:BANKBEES';
  } else if (cleanSym === 'FINNIFTY' || cleanSym === 'NIFTY_FIN_SERVICE') {
    tvSymbol = 'BSE:SENSEX';
  } else if (!cleanSym.includes(':')) {
    tvSymbol = `BSE:${cleanSym}`;
  }

  useEffect(() => {
    if (!symbol) return;

    const containerId = `tv_chart_${Math.random().toString(36).substring(7)}`;

    if (containerRef.current) {
      containerRef.current.innerHTML = `<div id="${containerId}" style="height:${height}px;width:100%;"></div>`;

      const initWidget = () => {
        if (window.TradingView) {
          try {
            new window.TradingView.widget({
              autosize: true,
              symbol: tvSymbol,
              interval: interval, // 1-minute default ("1"), or 5m, 15m, 60, D
              timezone: "Asia/Kolkata",
              theme: "dark",
              style: "1",
              locale: "en",
              toolbar_bg: "#070c18",
              enable_publishing: false,
              hide_side_toolbar: false,
              allow_symbol_change: true,
              container_id: containerId,
              studies: [
                "MASimple@tv-basicstudies",
                "RSI@tv-basicstudies",
                "Volume@tv-basicstudies"
              ]
            });
          } catch (e) {
            console.warn("TradingView widget init error:", e);
          }
        }
      };

      if (window.TradingView) {
        initWidget();
      } else {
        const timer = setInterval(() => {
          if (window.TradingView) {
            clearInterval(timer);
            initWidget();
          }
        }, 150);
        setTimeout(() => clearInterval(timer), 6000);
      }
    }
  }, [tvSymbol, height, refreshKey, interval]);

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid var(--border-subtle)',
      background: '#070c18'
    }}>
      {/* Header bar with Timeframe controls & Direct Link */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.45rem 0.85rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(15, 23, 42, 0.7)',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Interval:
          </span>
          <div style={{
            display: 'flex',
            background: 'rgba(7, 12, 24, 0.8)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            overflow: 'hidden',
            padding: '2px'
          }}>
            {[
              { label: '1m', value: '1' },
              { label: '5m', value: '5' },
              { label: '15m', value: '15' },
              { label: '1h', value: '60' },
              { label: '1D', value: 'D' }
            ].map(tf => (
              <button
                key={tf.value}
                onClick={() => setIntervalState(tf.value)}
                type="button"
                style={{
                  background: interval === tf.value ? 'var(--accent-cyan)' : 'transparent',
                  color: interval === tf.value ? '#050811' : 'var(--text-muted)',
                  fontWeight: interval === tf.value ? 700 : 500,
                  fontSize: '0.7rem',
                  border: 'none',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tf.label}
              </button>
            ))}
          </div>
          {interval === '1' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              1-Minute Real-Time Candles
            </span>
          )}
        </div>

        <a
          href={`https://in.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}&interval=${interval}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Open full chart on TradingView"
          style={{
            fontSize: '0.7rem',
            color: 'var(--accent-cyan)',
            background: 'rgba(7, 12, 24, 0.8)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '0.2rem 0.55rem',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <span>{tvSymbol}</span>
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Chart container */}
      <div ref={containerRef} style={{ height: `${height}px`, width: '100%' }} />
    </div>
  );
}
