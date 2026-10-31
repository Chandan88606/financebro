import React, { useState } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  SlidersHorizontal, 
  RefreshCw, 
  ShieldCheck, 
  Radio, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function HeaderToolbar({
  walletBalance,
  onResetWallet,
  filterAffordable,
  onToggleAffordable,
  autoExit,
  onToggleAutoExit,
  onOpenRules,
  onRefreshStocks,
  loadingStocks,
  wsConnected
}) {
  const [editingWallet, setEditingWallet] = useState(false);
  const [inputWallet, setInputWallet] = useState(walletBalance);

  const handleWalletSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(inputWallet);
    if (!isNaN(val) && val > 0) {
      onResetWallet(val);
      setEditingWallet(false);
    }
  };

  return (
    <header className="header-bar">
      {/* Brand & Live Connection Indicator */}
      <div className="logo-box">
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #0284c7 0%, #10b981 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)'
        }}>
          <TrendingUp size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 className="logo-title">FinanceBro</h1>
            <span className="badge-tag badge-cyan">NSE Institutional</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: 2 }}>
            <span className={wsConnected ? 'live-pulse' : ''} style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: wsConnected ? 'var(--accent-emerald)' : 'var(--text-dim)',
              display: 'inline-block'
            }} />
            <span style={{ fontSize: '0.72rem', color: wsConnected ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
              {wsConnected ? 'LIVE FEED ACTIVE' : 'CONNECTING...'}
            </span>
          </div>
        </div>
      </div>

      {/* Center Controls: Wallet & Toggles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Wallet Capital Card */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 10,
          padding: '0.4rem 0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Wallet size={16} color="var(--accent-emerald)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Wallet:
            </span>
          </div>

          {editingWallet ? (
            <form onSubmit={handleWalletSubmit} style={{ display: 'flex', gap: '0.4rem' }}>
              <input
                type="number"
                step="100"
                value={inputWallet}
                onChange={(e) => setInputWallet(e.target.value)}
                className="input-dark mono"
                style={{ width: 100, padding: '0.2rem 0.4rem', fontSize: '0.85rem' }}
                autoFocus
              />
              <button type="submit" className="btn btn-emerald" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>
                Set
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <button 
                onClick={() => { setInputWallet(walletBalance); setEditingWallet(true); }}
                title="Edit initial wallet budget"
                style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '0.72rem' }}
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Filter Affordable Only Switch */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          background: filterAffordable ? 'rgba(16, 185, 129, 0.12)' : 'rgba(30, 41, 59, 0.5)',
          border: `1px solid ${filterAffordable ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
          padding: '0.4rem 0.75rem',
          borderRadius: 8,
          fontSize: '0.8rem',
          color: filterAffordable ? 'var(--accent-emerald)' : 'var(--text-muted)',
          transition: 'all 0.2s'
        }}>
          <input 
            type="checkbox" 
            checked={filterAffordable} 
            onChange={(e) => onToggleAffordable(e.target.checked)}
            style={{ accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
          />
          <span>Only ≤ Wallet (₹{Math.round(walletBalance).toLocaleString('en-IN')})</span>
        </label>

        {/* Auto-Exit Protection Switch */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          background: autoExit ? 'rgba(244, 63, 94, 0.12)' : 'rgba(30, 41, 59, 0.5)',
          border: `1px solid ${autoExit ? 'rgba(244, 63, 94, 0.4)' : 'var(--border-subtle)'}`,
          padding: '0.4rem 0.75rem',
          borderRadius: 8,
          fontSize: '0.8rem',
          color: autoExit ? 'var(--accent-rose)' : 'var(--text-muted)',
          transition: 'all 0.2s'
        }}>
          <input 
            type="checkbox" 
            checked={autoExit} 
            onChange={(e) => onToggleAutoExit(e.target.checked)}
            style={{ accentColor: 'var(--accent-rose)', cursor: 'pointer' }}
          />
          <ShieldCheck size={14} />
          <span>Auto-Exit (&lt;6 Bearish)</span>
        </label>
      </div>

      {/* Right Controls: Scan & Strategy Modal Trigger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={onRefreshStocks}
          disabled={loadingStocks}
          className="btn btn-primary"
          style={{ padding: '0.5rem 1rem' }}
        >
          <RefreshCw size={15} className={loadingStocks ? 'animate-spin' : ''} style={{
            animation: loadingStocks ? 'spin 1s linear infinite' : 'none'
          }} />
          <span>Scan 40+ Stocks</span>
        </button>

        <button
          onClick={onOpenRules}
          className="btn btn-outline"
          style={{ padding: '0.5rem 0.9rem' }}
        >
          <SlidersHorizontal size={15} color="var(--accent-cyan)" />
          <span>Strategy Rules</span>
        </button>
      </div>
    </header>
  );
}
