import React, { useEffect, useRef } from 'react';

export default function TradingViewChart({ symbol, height = 480, refreshKey }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!symbol) return;

    // Standardize symbol for TradingView Indian Market (NSE priority)
    let cleanSym = symbol.replace('.NS', '').replace('.BO', '');
    let tvSymbol = cleanSym;
    if (cleanSym === '^NSEI' || cleanSym === 'NIFTY50' || cleanSym === 'NIFTY') {
      tvSymbol = 'NSE:NIFTY';
    } else if (cleanSym === '^NSEBANK' || cleanSym === 'BANKNIFTY') {
      tvSymbol = 'NSE:BANKNIFTY';
    } else if (cleanSym === 'FINNIFTY' || cleanSym === 'NIFTY_FIN_SERVICE') {
      tvSymbol = 'NSE:FINNIFTY';
    } else if (!cleanSym.includes(':')) {
      tvSymbol = `NSE:${cleanSym}`;
    }

    const containerId = `tv_chart_${Math.random().toString(36).substring(7)}`;

    if (containerRef.current) {
      containerRef.current.innerHTML = `<div id="${containerId}" style="height:${height}px;width:100%;"></div>`;

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
    }
  }, [symbol, height, refreshKey]);

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
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
