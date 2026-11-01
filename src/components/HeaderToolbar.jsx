import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  TrendingUp, 
  Wallet, 
  SlidersHorizontal, 
  RefreshCw, 
  ShieldCheck,
  BarChart3,
  Zap,
  Scale
} from 'lucide-react';

import { IS_STANDALONE } from '../api';

export default function HeaderToolbar({
  currentScreen,
  onSelectScreen,
  walletBalance,
  onResetWallet,
  filterAffordable,
  onToggleAffordable,
  autoExit,
  onToggleAutoExit,
  onOpenRules,
  onRefreshStocks,
  loadingStocks,
  wsConnected,
  foPositionsCount = 0
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [editingWallet, setEditingWallet] = useState(false);
  const [inputWallet, setInputWallet] = useState(walletBalance);

  // Derive active screen from route or props
  const isDerivativesRoute = location.pathname.includes('/derivatives') || location.pathname.includes('/options') || currentScreen === 'OPTIONS';
  const activeScreen = isDerivativesRoute ? 'OPTIONS' : 'EQUITY';

  const handleWalletSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(inputWallet);
    if (!isNaN(val) && val > 0) {
      onResetWallet(val);
      setEditingWallet(false);
    }
  };

  const handleNav = (targetScreen) => {
    if (onSelectScreen) onSelectScreen(targetScreen);
    if (targetScreen === 'OPTIONS') {
      navigate('/derivatives');
    } else {
      navigate('/equity');
    }
  };

  const isOnline = wsConnected || IS_STANDALONE;
  const statusLabel = IS_STANDALONE ? 'LIVE FEED (ACTIVE)' : (wsConnected ? 'LIVE FEED ACTIVE' : 'CONNECTING...');

  return (
    <header className="header-bar">
      {/* Brand & Terminal Navigation Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div className="logo-box">
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #0284c7 0%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)'
          }}>
            <TrendingUp size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <h1 className="logo-title" style={{ fontSize: '1.35rem' }}>FinanceBro</h1>
              <span className="badge-tag badge-cyan">NSE Institutional</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: 1 }}>
              <span className={isOnline ? 'live-pulse' : ''} style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: isOnline ? 'var(--accent-emerald)' : 'var(--text-dim)',
                display: 'inline-block'
              }} />
              <span style={{ fontSize: '0.7rem', color: isOnline ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Screen Tabs with HashRouter Navigation */}
        <nav style={{
          display: 'flex',
          background: 'rgba(30, 41, 59, 0.7)',
          padding: 3,
          borderRadius: 10,
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => handleNav('EQUITY')}
            className="btn"
            style={{
              background: activeScreen === 'EQUITY' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
              color: activeScreen === 'EQUITY' ? '#ffffff' : 'var(--text-muted)',
              padding: '0.4rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              boxShadow: activeScreen === 'EQUITY' ? '0 2px 8px rgba(2, 132, 199, 0.35)' : 'none'
            }}
          >
            <BarChart3 size={14} />
            <span>Cash Equity (10 Modules)</span>
          </button>

          <button
            onClick={() => handleNav('OPTIONS')}
            className="btn"
            style={{
              background: activeScreen === 'OPTIONS' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'transparent',
              color: activeScreen === 'OPTIONS' ? '#ffffff' : 'var(--text-muted)',
              padding: '0.4rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              boxShadow: activeScreen === 'OPTIONS' ? '0 2px 8px rgba(5, 150, 105, 0.35)' : 'none'
            }}
          >
            <Zap size={14} />
            <span>Derivatives Strategy (10 Spreads)</span>
            {foPositionsCount > 0 && (
              <span className="badge-tag badge-amber" style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>
                {foPositionsCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Center Controls: Capital / Margin & Toggles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Wallet Capital Card */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 10,
          padding: '0.35rem 0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Wallet size={15} color="var(--accent-emerald)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Capital:
            </span>
          </div>

          {editingWallet ? (
            <form onSubmit={handleWalletSubmit} style={{ display: 'flex', gap: '0.35rem' }}>
              <input
                type="number"
                step="1000"
                value={inputWallet}
                onChange={(e) => setInputWallet(e.target.value)}
                className="input-dark mono"
                style={{ width: 110, padding: '0.2rem 0.4rem', fontSize: '0.82rem' }}
                autoFocus
              />
              <button type="submit" className="btn btn-emerald" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}>
                Set
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <button 
                onClick={() => { setInputWallet(walletBalance); setEditingWallet(true); }}
                title="Edit initial wallet capital"
                style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '0.7rem' }}
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Equity specific filter: Only <= Wallet */}
        {activeScreen === 'EQUITY' && (
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            background: filterAffordable ? 'rgba(16, 185, 129, 0.12)' : 'rgba(30, 41, 59, 0.5)',
            border: `1px solid ${filterAffordable ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
            padding: '0.35rem 0.65rem',
            borderRadius: 8,
            fontSize: '0.78rem',
            color: filterAffordable ? 'var(--accent-emerald)' : 'var(--text-muted)',
            transition: 'all 0.2s'
          }}>
            <input 
              type="checkbox" 
              checked={filterAffordable} 
              onChange={(e) => onToggleAffordable(e.target.checked)}
              style={{ accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
            />
            <span>Budget ≤ Wallet</span>
          </label>
        )}

        {/* Global Auto-Exit Guard */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          cursor: 'pointer',
          background: autoExit ? 'rgba(244, 63, 94, 0.12)' : 'rgba(30, 41, 59, 0.5)',
          border: `1px solid ${autoExit ? 'rgba(244, 63, 94, 0.4)' : 'var(--border-subtle)'}`,
          padding: '0.35rem 0.65rem',
          borderRadius: 8,
          fontSize: '0.78rem',
          color: autoExit ? 'var(--accent-rose)' : 'var(--text-muted)',
          transition: 'all 0.2s'
        }}>
          <input 
            type="checkbox" 
            checked={autoExit} 
            onChange={(e) => onToggleAutoExit(e.target.checked)}
            style={{ accentColor: 'var(--accent-rose)', cursor: 'pointer' }}
          />
          <ShieldCheck size={13} />
          <span>Auto-Exit Active</span>
        </label>
      </div>

      {/* Right Controls: Scan & Strategy Configuration */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {activeScreen === 'EQUITY' ? (
          <>
            <button
              onClick={onRefreshStocks}
              disabled={loadingStocks}
              className="btn btn-primary"
              style={{ padding: '0.45rem 0.85rem' }}
            >
              <RefreshCw size={14} style={{
                animation: loadingStocks ? 'spin 1s linear infinite' : 'none'
              }} />
              <span>Scan Stocks</span>
            </button>

            <button
              onClick={onOpenRules}
              className="btn btn-outline"
              style={{ padding: '0.45rem 0.8rem' }}
            >
              <SlidersHorizontal size={14} color="var(--accent-cyan)" />
              <span>Equity Rules</span>
            </button>
          </>
        ) : (
          <button
            onClick={onOpenRules}
            className="btn btn-outline"
            style={{ padding: '0.45rem 0.8rem' }}
          >
            <SlidersHorizontal size={14} color="var(--accent-cyan)" />
            <span>F&O Auto-Exit Rules</span>
          </button>
        )}
      </div>
    </header>
  );
}
