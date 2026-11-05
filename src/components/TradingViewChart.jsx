import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, TrendingUp, BarChart2 } from 'lucide-react';

/**
 * TradingViewChart - Official TradingView Advanced Real-Time Chart
 * Embeds authentic candlestick chart for Indian equities (BSE dual-listing feed).
 */
export default function TradingViewChart({ symbol, height = 480, refreshKey }) {
  const containerRef = useRef(null);
  const [tvInterval, setTvInterval] = useState('D'); // 'D', 'W', 'M'

  // Standardize Indian stock symbol for TradingView
  let cleanSym = (symbol || 'RELIANCE').replace('.NS', '').replace('.BO', '');
  let tvSymbol = cleanSym;
  if (cleanSym === '^NSEI' || cleanSym === 'NIFTY50' || cleanSym === 'NIFTY') {
    tvSymbol = 'BSE:SENSEX';
  } else if (cleanSym === '^NSEBANK' || cleanSym === 'BANKNIFTY') {
    tvSymbol = 'BSE:BANK';
  } else if (cleanSym === 'FINNIFTY' || cleanSym === 'NIFTY_FIN_SERVICE') {
    tvSymbol = 'BSE:SENSEX';
  } else if (cleanSym === 'M&M') {
    tvSymbol = 'BSE:M_M';
  } else if (!cleanSym.includes(':')) {
    tvSymbol = `BSE:${cleanSym}`;
  }

  // Official TradingView Advanced Chart script embed
  useEffect(() => {
    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    currentContainer.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = `${height - 48}px`;
    widgetDiv.style.width = '100%';
    currentContainer.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: tvInterval,
      timezone: 'Asia/Kolkata',
      theme: 'dark',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: true,
      hide_side_toolbar: false,
      calendar: false,
      studies: [
        'MASimple@tv-basicstudies',
        'RSI@tv-basicstudies',
        'Volume@tv-basicstudies'
      ],
      support_host: 'https://www.tradingview.com'
    });

    currentContainer.appendChild(script);

    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, [tvSymbol, tvInterval, height]);

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
      {/* Top Header Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.45rem 0.85rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(15, 23, 42, 0.9)',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        {/* Left: Indicator & Timeframe */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            <span>Real Chart: {tvSymbol}</span>
          </div>

          <div style={{
            display: 'flex',
            background: 'rgba(7, 12, 24, 0.8)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            overflow: 'hidden',
            padding: '2px'
          }}>
            {[
              { label: '1D (Daily)', value: 'D' },
              { label: '1W (Weekly)', value: 'W' },
              { label: '1M (Monthly)', value: 'M' }
            ].map(tf => (
              <button
                key={tf.value}
                onClick={() => setTvInterval(tf.value)}
                type="button"
                style={{
                  background: tvInterval === tf.value ? 'var(--accent-cyan)' : 'transparent',
                  color: tvInterval === tf.value ? '#050811' : 'var(--text-muted)',
                  fontWeight: tvInterval === tf.value ? 700 : 500,
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
        </div>

        {/* Right: 1-Minute Live Link to TradingView India */}
        <a
          href={`https://in.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}&interval=1`}
          target="_blank"
          rel="noopener noreferrer"
          title="Open live 1-minute streaming chart directly on TradingView"
          style={{
            fontSize: '0.72rem',
            color: 'var(--accent-cyan)',
            background: 'rgba(6, 182, 212, 0.12)',
            border: '1px solid var(--accent-cyan)',
            borderRadius: '6px',
            padding: '0.25rem 0.65rem',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontWeight: 700
          }}
        >
          <span>⚡ Live 1m Stream on TradingView ↗</span>
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Official TradingView Chart Container */}
      <div 
        ref={containerRef} 
        className="tradingview-widget-container" 
        style={{ width: '100%', height: `${height - 48}px`, background: '#070c18' }} 
      />
    </div>
  );
}
