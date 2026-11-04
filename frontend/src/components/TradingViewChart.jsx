import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ExternalLink, TrendingUp, BarChart2, RefreshCw } from 'lucide-react';

/**
 * Native Canvas-based 1-Minute Live Intraday Candlestick Chart
 * Connects directly to NSE 1-minute OHLCV data feed (via Yahoo Finance API / Vite Proxy)
 */
function NativeIntradayChart({ symbol, height = 440, refreshKey }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoverData, setHoverData] = useState(null);
  const [intradayTf, setIntradayTf] = useState('1m'); // 1m, 5m, 15m

  // Format clean ticker for Indian NSE markets
  let cleanTicker = (symbol || 'RELIANCE').replace('.NS', '').replace('.BO', '');
  let ySymbol = cleanTicker;
  if (cleanTicker === '^NSEI' || cleanTicker === 'NIFTY' || cleanTicker === 'NIFTY50') {
    ySymbol = '%5ENSEI';
  } else if (cleanTicker === '^NSEBANK' || cleanTicker === 'BANKNIFTY') {
    ySymbol = '%5ENSEBANK';
  } else if (cleanTicker === 'FINNIFTY' || cleanTicker === 'NIFTY_FIN_SERVICE') {
    ySymbol = '%5ENSEI';
  } else if (!cleanTicker.startsWith('^')) {
    ySymbol = `${cleanTicker}.NS`;
  }

  // Fetch 1m/5m/15m OHLCV bars
  const loadCandles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const range = intradayTf === '1m' ? '1d' : '5d';
      let res = null;

      // 1. Vite proxy endpoint
      try {
        res = await fetch(`/api/yahoo/v8/finance/chart/${encodeURIComponent(ySymbol)}?interval=${intradayTf}&range=${range}`);
      } catch (e) {}

      // 2. Direct fallback
      if (!res || !res.ok) {
        try {
          res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySymbol)}?interval=${intradayTf}&range=${range}`);
        } catch (e) {}
      }

      if (!res || !res.ok) {
        throw new Error('Failed to retrieve real-time candle data');
      }

      const json = await res.json();
      const result = json?.chart?.result?.[0];
      if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
        throw new Error('No candle records available for this ticker');
      }

      const ts = result.timestamp;
      const q = result.indicators.quote[0];
      const parsed = [];

      for (let i = 0; i < ts.length; i++) {
        if (q.open[i] != null && q.close[i] != null && q.high[i] != null && q.low[i] != null) {
          parsed.push({
            time: ts[i] * 1000,
            open: Math.round(q.open[i] * 100) / 100,
            high: Math.round(q.high[i] * 100) / 100,
            low: Math.round(q.low[i] * 100) / 100,
            close: Math.round(q.close[i] * 100) / 100,
            volume: q.volume[i] || 0
          });
        }
      }

      setCandles(parsed);
      setLoading(false);
    } catch (err) {
      console.warn('NativeIntradayChart fetch error:', err);
      setError(err.message || 'Error loading live candles');
      setLoading(false);
    }
  }, [ySymbol, intradayTf]);

  useEffect(() => {
    loadCandles();
  }, [loadCandles, refreshKey]);

  // Render chart on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !candles.length) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Layout dimensions
    const padTop = 28;
    const padBottom = 32;
    const padLeft = 12;
    const padRight = 68;

    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;
    const priceH = plotH * 0.74; // top 74% for candles
    const volH = plotH * 0.22;   // bottom 22% for volume
    const volTop = padTop + plotH - volH;

    // Background
    ctx.fillStyle = '#070c18';
    ctx.fillRect(0, 0, width, height);

    // Calculate price extremes
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVol = 1;

    for (const c of candles) {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    }

    // Add 2% padding to price bounds
    const priceRange = (maxPrice - minPrice) || 1;
    const pMin = minPrice - priceRange * 0.02;
    const pMax = maxPrice + priceRange * 0.02;
    const pRange = pMax - pMin;

    const getY = (price) => padTop + (1 - (price - pMin) / pRange) * priceH;

    // Draw horizontal grid lines & price ticks
    ctx.lineWidth = 1;
    ctx.font = '10px "JetBrains Mono", monospace';
    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const p = pMin + (pRange * i) / gridSteps;
      const y = getY(p);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'left';
      ctx.fillText(`₹${p.toFixed(2)}`, width - padRight + 6, y + 3);
    }

    // Draw volume separator
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(padLeft, volTop);
    ctx.lineTo(width - padRight, volTop);
    ctx.stroke();

    // Draw Candles & Volume
    const n = candles.length;
    const candleW = Math.max(1.5, Math.min(12, (plotW / n) * 0.72));
    const stepX = plotW / n;

    candles.forEach((c, idx) => {
      const cx = padLeft + idx * stepX + stepX / 2;
      const isUp = c.close >= c.open;
      const color = isUp ? '#10b981' : '#ef4444';

      // 1. Volume Bar
      const vHeight = Math.max(2, (c.volume / maxVol) * volH);
      const vy = height - padBottom - vHeight;
      ctx.fillStyle = isUp ? 'rgba(16, 185, 129, 0.28)' : 'rgba(239, 68, 68, 0.28)';
      ctx.fillRect(cx - candleW / 2, vy, candleW, vHeight);

      // 2. Candle Wick
      const yHigh = getY(c.high);
      const yLow = getY(c.low);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, yHigh);
      ctx.lineTo(cx, yLow);
      ctx.stroke();

      // 3. Candle Body
      const yOpen = getY(c.open);
      const yClose = getY(c.close);
      const bodyTop = Math.min(yOpen, yClose);
      const bodyH = Math.max(1.5, Math.abs(yClose - yOpen));

      ctx.fillStyle = color;
      ctx.fillRect(cx - candleW / 2, bodyTop, candleW, bodyH);
    });

    // Time Axis labels (every ~10% of items)
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    const timeStep = Math.max(1, Math.floor(n / 6));
    for (let i = 0; i < n; i += timeStep) {
      const cx = padLeft + i * stepX + stepX / 2;
      const d = new Date(candles[i].time);
      const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      ctx.fillText(timeStr, cx, height - 10);
    }

    // Latest price horizontal line
    const last = candles[candles.length - 1];
    if (last) {
      const lastY = getY(last.close);
      ctx.strokeStyle = last.close >= last.open ? '#10b981' : '#ef4444';
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(padLeft, lastY);
      ctx.lineTo(width - padRight, lastY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Latest price badge
      ctx.fillStyle = last.close >= last.open ? '#10b981' : '#ef4444';
      ctx.fillRect(width - padRight + 2, lastY - 9, 62, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`₹${last.close.toFixed(2)}`, width - padRight + 33, lastY + 3.5);
    }

    // Hover crosshair and tooltip
    if (hoverData) {
      const hx = padLeft + hoverData.idx * stepX + stepX / 2;
      const hy = getY(hoverData.candle.close);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.setLineDash([3, 3]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(hx, padTop);
      ctx.lineTo(hx, height - padBottom);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(padLeft, hy);
      ctx.lineTo(width - padRight, hy);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [candles, hoverData]);

  // Handle mouse move for interactive inspection
  const handleMouseMove = (e) => {
    if (!candles.length || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padLeft = 12;
    const padRight = 68;
    const plotW = rect.width - padLeft - padRight;
    const stepX = plotW / candles.length;

    const idx = Math.floor((x - padLeft) / stepX);
    if (idx >= 0 && idx < candles.length) {
      setHoverData({ idx, candle: candles[idx] });
    } else {
      setHoverData(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  const activeCandle = hoverData?.candle || (candles.length ? candles[candles.length - 1] : null);

  return (
    <div ref={containerRef} style={{ width: '100%', height: `${height}px`, position: 'relative', background: '#070c18', display: 'flex', flexDirection: 'column' }}>
      {/* Top HUD with real-time stats and timeframe selector */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.4rem 0.8rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(15, 23, 42, 0.8)',
        flexWrap: 'wrap',
        gap: '0.4rem'
      }}>
        {/* Intraday timeframes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{
            display: 'flex',
            background: 'rgba(7, 12, 24, 0.9)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            overflow: 'hidden',
            padding: '2px'
          }}>
            {[
              { label: '1m', value: '1m' },
              { label: '5m', value: '5m' },
              { label: '15m', value: '15m' }
            ].map(tf => (
              <button
                key={tf.value}
                onClick={() => setIntradayTf(tf.value)}
                style={{
                  background: intradayTf === tf.value ? 'var(--accent-cyan)' : 'transparent',
                  color: intradayTf === tf.value ? '#050811' : 'var(--text-muted)',
                  fontWeight: intradayTf === tf.value ? 700 : 500,
                  fontSize: '0.68rem',
                  border: 'none',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            NSE Live Feed ({candles.length} bars)
          </span>
        </div>

        {/* OHLCV readout */}
        {activeCandle && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <span><strong style={{ color: '#fff' }}>T:</strong> {new Date(activeCandle.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span><strong style={{ color: '#fff' }}>O:</strong> ₹{activeCandle.open}</span>
            <span><strong style={{ color: '#10b981' }}>H:</strong> ₹{activeCandle.high}</span>
            <span><strong style={{ color: '#ef4444' }}>L:</strong> ₹{activeCandle.low}</span>
            <span><strong style={{ color: activeCandle.close >= activeCandle.open ? '#10b981' : '#ef4444' }}>C:</strong> ₹{activeCandle.close}</span>
            <span><strong style={{ color: '#fff' }}>Vol:</strong> {activeCandle.volume.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Main Canvas Chart Area */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(7, 12, 24, 0.7)', zIndex: 10 }}>
            <RefreshCw size={24} className="spin" style={{ color: 'var(--accent-cyan)' }} />
            <span style={{ marginLeft: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading 1-minute real-time candles...</span>
          </div>
        )}

        {error && !candles.length && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ef4444', padding: '1rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{error}</span>
            <button onClick={loadCandles} style={{ marginTop: '0.6rem', padding: '0.3rem 0.8rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '0.75rem' }}>
              Retry
            </button>
          </div>
        )}

        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
        />
      </div>
    </div>
  );
}

/**
 * Main Chart Component with Tab Toggle:
 * 1. ⚡ 1-Min Live Intraday (NSE) - Real-time 1m OHLCV Canvas
 * 2. 📈 TradingView (Daily / Multi-Day) - Full TradingView Widget on BSE feed
 */
export default function TradingViewChart({ symbol, height = 480, refreshKey }) {
  const [chartMode, setChartMode] = useState('live1m'); // 'live1m' | 'tradingview'
  const [tvInterval, setTvInterval] = useState('D'); // 'D', 'W', 'M'
  const containerRef = useRef(null);

  // Standardize symbol for TradingView Indian Market
  // BSE is fully unblocked for embedded widgets on Daily/Weekly/Monthly intervals
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

  // TradingView widget loader (only active when chartMode === 'tradingview')
  useEffect(() => {
    if (chartMode !== 'tradingview' || !symbol) return;

    const containerId = `tv_chart_${Math.random().toString(36).substring(7)}`;

    if (containerRef.current) {
      containerRef.current.innerHTML = `<div id="${containerId}" style="height:${height - 48}px;width:100%;"></div>`;

      const initWidget = () => {
        if (window.TradingView) {
          try {
            new window.TradingView.widget({
              autosize: true,
              symbol: tvSymbol,
              interval: tvInterval, // 'D', 'W', or 'M'
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
  }, [chartMode, tvSymbol, height, refreshKey, tvInterval]);

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
      {/* Top Header Mode Selector */}
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
        {/* Left: Mode Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            onClick={() => setChartMode('live1m')}
            type="button"
            style={{
              background: chartMode === 'live1m' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              color: chartMode === 'live1m' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              border: chartMode === 'live1m' ? '1px solid var(--accent-cyan)' : '1px solid transparent',
              borderRadius: '6px',
              padding: '0.25rem 0.65rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer'
            }}
          >
            <TrendingUp size={13} />
            <span>1-Min Live Candlestick (NSE)</span>
          </button>

          <button
            onClick={() => setChartMode('tradingview')}
            type="button"
            style={{
              background: chartMode === 'tradingview' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              color: chartMode === 'tradingview' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              border: chartMode === 'tradingview' ? '1px solid var(--accent-cyan)' : '1px solid transparent',
              borderRadius: '6px',
              padding: '0.25rem 0.65rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer'
            }}
          >
            <BarChart2 size={13} />
            <span>TradingView (Daily / Multi-Day)</span>
          </button>
        </div>

        {/* Right: TradingView Timeframes or External Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {chartMode === 'tradingview' && (
            <div style={{
              display: 'flex',
              background: 'rgba(7, 12, 24, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              overflow: 'hidden',
              padding: '2px'
            }}>
              {[
                { label: '1D', value: 'D' },
                { label: '1W', value: 'W' },
                { label: '1M', value: 'M' }
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
                    padding: '2px 7px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          )}

          <a
            href={`https://in.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open on TradingView.com for full workspace"
            style={{
              fontSize: '0.7rem',
              color: 'var(--accent-cyan)',
              background: 'rgba(7, 12, 24, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '0.22rem 0.55rem',
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
      </div>

      {/* Chart Viewport */}
      {chartMode === 'live1m' ? (
        <NativeIntradayChart symbol={symbol} height={height} refreshKey={refreshKey} />
      ) : (
        <div style={{ position: 'relative', height: `${height}px`, width: '100%' }}>
          <div style={{ padding: '0.3rem 0.8rem', background: 'rgba(234, 179, 8, 0.08)', borderBottom: '1px solid rgba(234, 179, 8, 0.2)', fontSize: '0.68rem', color: '#facc15' }}>
            ℹ️ Free TradingView embeds are licensed by Indian exchanges for <strong>1D, 1W, and 1M</strong> intervals. For live 1-minute candles, use the <strong>1-Min Live Candlestick</strong> tab above.
          </div>
          <div ref={containerRef} style={{ height: `${height - 30}px`, width: '100%' }} />
        </div>
      )}
    </div>
  );
}
