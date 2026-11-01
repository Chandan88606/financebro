import React from 'react';

export default function PayoffChart({ payoffCurve = [], breakevens = [], currentSpot = 0, height = 240 }) {
  if (!payoffCurve || payoffCurve.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No payoff data available
      </div>
    );
  }

  const spots = payoffCurve.map(p => p.spot);
  const pnls = payoffCurve.map(p => p.pnlPerLot);

  const minSpot = Math.min(...spots);
  const maxSpot = Math.max(...spots);
  const minPnl = Math.min(...pnls, 0);
  const maxPnl = Math.max(...pnls, 0);

  const pnlRange = (maxPnl - minPnl) || 100;
  const spotRange = (maxSpot - minSpot) || 100;

  const width = 640;
  const paddingX = 50;
  const paddingY = 30;

  const getX = (spot) => paddingX + ((spot - minSpot) / spotRange) * (width - 2 * paddingX);
  const getY = (pnl) => height - paddingY - ((pnl - minPnl) / pnlRange) * (height - 2 * paddingY);

  const zeroY = getY(0);
  const spotX = getX(currentSpot);

  // Build SVG path
  const points = payoffCurve.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(pt.spot)} ${getY(pt.pnlPerLot)}`).join(' ');

  return (
    <div style={{ width: '100%', background: '#040711', borderRadius: 12, border: '1px solid var(--border-subtle)', padding: '1rem', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
        <span style={{ fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Expiry Payoff Curve & Breakeven Horizon
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-emerald)' }}>
            <span style={{ width: 8, height: 8, background: 'var(--accent-emerald)', borderRadius: '50%' }} /> Profit Zone
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-rose)' }}>
            <span style={{ width: 8, height: 8, background: 'var(--accent-rose)', borderRadius: '50%' }} /> Loss Zone
          </span>
          <span style={{ color: 'var(--accent-cyan)' }}>
            Current Spot: ₹{currentSpot.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="lossGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Zero P&L horizontal reference axis */}
        <line
          x1={paddingX}
          y1={zeroY}
          x2={width - paddingX}
          y2={zeroY}
          stroke="rgba(148, 163, 184, 0.4)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <text x={paddingX - 8} y={zeroY + 4} fill="var(--text-muted)" fontSize="10" textAnchor="end" fontFamily="JetBrains Mono">
          ₹0
        </text>

        {/* Current spot vertical line */}
        {currentSpot >= minSpot && currentSpot <= maxSpot && (
          <g>
            <line
              x1={spotX}
              y1={paddingY}
              x2={spotX}
              y2={height - paddingY}
              stroke="var(--accent-cyan)"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <text x={spotX} y={paddingY - 6} fill="var(--accent-cyan)" fontSize="10" textAnchor="middle" fontFamily="JetBrains Mono" fontWeight="700">
              Spot ₹{currentSpot}
            </text>
          </g>
        )}

        {/* Breakeven points */}
        {breakevens.map((be, i) => {
          if (typeof be !== 'number' || be < minSpot || be > maxSpot) return null;
          const beX = getX(be);
          return (
            <g key={i}>
              <line
                x1={beX}
                y1={zeroY - 12}
                x2={beX}
                y2={zeroY + 12}
                stroke="var(--accent-amber)"
                strokeWidth="2"
              />
              <circle cx={beX} cy={zeroY} r="4" fill="var(--accent-amber)" />
              <text x={beX} y={zeroY + 22} fill="var(--accent-amber)" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono" fontWeight="700">
                BE: ₹{be}
              </text>
            </g>
          );
        })}

        {/* Payoff line */}
        <path
          d={points}
          fill="none"
          stroke="var(--accent-cyan)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Max Profit / Loss labels */}
        <text x={width - paddingX} y={paddingY + 8} fill="var(--accent-emerald)" fontSize="10" textAnchor="end" fontFamily="JetBrains Mono" fontWeight="700">
          Max: {maxPnl > 0 ? `+₹${maxPnl.toLocaleString('en-IN')}` : '0'}
        </text>
        <text x={width - paddingX} y={height - paddingY - 4} fill="var(--accent-rose)" fontSize="10" textAnchor="end" fontFamily="JetBrains Mono" fontWeight="700">
          Min: -₹{Math.abs(minPnl).toLocaleString('en-IN')}
        </text>
      </svg>
    </div>
  );
}
