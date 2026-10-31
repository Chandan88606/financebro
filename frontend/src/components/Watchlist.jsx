import React, { useState } from 'react';
import { Search, ChevronRight, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

export default function Watchlist({
  stocks,
  selectedTicker,
  onSelectStock,
  walletBalance,
  filterAffordable
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStocks = stocks.filter(stock => {
    // Budget filter
    if (filterAffordable && stock.current_price > walletBalance) {
      return false;
    }
    // Search query filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        stock.ticker.toLowerCase().includes(q) ||
        stock.name.toLowerCase().includes(q) ||
        stock.sector.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Search Header */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>NSE Watchlist</span>
            <span className="badge-tag badge-cyan">{filteredStocks.length}</span>
          </h3>
          {filterAffordable && (
            <span className="badge-tag badge-emerald" style={{ fontSize: '0.65rem' }}>
              Budget Mode ≤ ₹{Math.round(walletBalance).toLocaleString('en-IN')}
            </span>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 10 }} />
          <input
            type="text"
            placeholder="Search stock (e.g. RELIANCE, ITC)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-dark"
            style={{ width: '100%', paddingLeft: '2rem' }}
          />
        </div>
      </div>

      {/* Stocks Scrollable List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingRight: '0.2rem' }}>
        {filteredStocks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            <AlertCircle size={28} color="var(--accent-amber)" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ fontSize: '0.85rem' }}>No stocks matched your budget or search filter.</p>
            {filterAffordable && (
              <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Try unchecking "Only ≤ Wallet" in the header to view higher-priced stocks.
              </p>
            )}
          </div>
        ) : (
          filteredStocks.map(stock => {
            const isSelected = selectedTicker === stock.ticker;
            const isPositive = stock.change_pct >= 0;
            const isAffordable = stock.current_price <= walletBalance;
            const isBullish = stock.consensus_score >= 6;

            return (
              <div
                key={stock.ticker}
                onClick={() => onSelectStock(stock.ticker)}
                style={{
                  background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(30, 41, 59, 0.45)',
                  border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                  borderRadius: 10,
                  padding: '0.75rem 0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                {/* Top Row: Ticker & Price */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                      {stock.ticker}
                    </span>
                    {stock.buy_signal && (
                      <span className="badge-tag badge-emerald" style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}>
                        BUY
                      </span>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className="mono" style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      ₹{stock.current_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="mono" style={{
                      display: 'block',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: isPositive ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                    }}>
                      {isPositive ? '+' : ''}{stock.change_pct}%
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Sector & Consensus Score Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>{stock.sector}</span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="mono" style={{
                      fontWeight: 700,
                      color: isBullish ? 'var(--accent-emerald)' : 'var(--accent-amber)'
                    }}>
                      {stock.consensus_score}/10
                    </span>
                    {/* Visual Progress bar */}
                    <div style={{ width: 44, height: 5, background: 'rgba(15, 23, 42, 0.8)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${(stock.consensus_score / 10) * 100}%`,
                        height: '100%',
                        background: isBullish ? 'var(--accent-emerald)' : 'var(--accent-amber)'
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
