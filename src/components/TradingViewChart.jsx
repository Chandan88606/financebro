import React, { useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';

export default function TradingViewChart({ symbol, height = 480, refreshKey }) {
  const containerRef = useRef(null);

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
              interval: "D",
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
  }, [tvSymbol, height, refreshKey]);

  return (
    <div style={{
      width: '100%',
      height: `${height}px`,
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid var(--border-subtle)',
      background: '#070c18',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        top: 10,
        right: 12,
        zIndex: 5,
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem'
      }}>
        <a
          href={`https://in.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Open chart on TradingView"
          style={{
            fontSize: '0.68rem',
            color: 'var(--accent-cyan)',
            background: 'rgba(7, 12, 24, 0.9)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '0.2rem 0.5rem',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}
        >
          <span>{tvSymbol}</span>
          <ExternalLink size={11} />
        </a>
      </div>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
