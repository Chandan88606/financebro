import React, { useState } from 'react';
import { Briefcase, ArrowUpRight, ArrowDownRight, History, RotateCcw, Zap, HelpCircle, ShieldCheck } from 'lucide-react';

export default function PortfolioLedger({
  portfolio,
  autoExit = true,
  onOpenTrade,
  onResetPortfolio,
  onSeedDemo
}) {
  const [activeTab, setActiveTab] = useState('positions'); // 'positions' or 'history'

  if (!portfolio) return null;

  const {
    wallet_balance = 0,
    current_portfolio_value = 0,
    total_equity = 0,
    unrealized_pnl = 0,
    realized_pnl = 0,
    net_pnl = 0,
    roi_pct = 0,
    total_charges_paid = 0,
    positions = [],
    history = []
  } = portfolio;

  const isNetPositive = net_pnl >= 0;

  return (
    <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* KPI Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        {/* Total Equity */}
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '0.75rem 1rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Real Closing Balance (Total Equity)</span>
          <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
            ₹{total_equity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Available Cash: ₹{wallet_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Holdings Value */}
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '0.75rem 1rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Holdings Value</span>
          <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.2rem' }}>
            ₹{current_portfolio_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {positions.length} Open Positions
          </span>
        </div>

        {/* Net P&L & ROI */}
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '0.75rem 1rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Return (ROI)</span>
          <div className="mono" style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: isNetPositive ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            marginTop: '0.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            {isNetPositive ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
            ₹{net_pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({roi_pct}%)
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Unrealized: ₹{unrealized_pnl.toFixed(2)} | Realized: ₹{realized_pnl.toFixed(2)}
          </span>
        </div>

        {/* Regulatory Fees Paid */}
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '0.75rem 1rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Statutory Taxes & Brokerage</span>
          <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '0.2rem' }}>
            ₹{total_charges_paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Brokerage, STT, GST, Stamp Duty
          </span>
        </div>
      </div>

      {/* Tabs & Table Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('positions')}
            className="btn"
            style={{
              background: activeTab === 'positions' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              borderColor: activeTab === 'positions' ? 'var(--accent-cyan)' : 'transparent',
              color: activeTab === 'positions' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              padding: '0.35rem 0.8rem',
              fontSize: '0.8rem'
            }}
          >
            <Briefcase size={14} />
            <span>Open Holdings ({positions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className="btn"
            style={{
              background: activeTab === 'history' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              borderColor: activeTab === 'history' ? 'var(--accent-cyan)' : 'transparent',
              color: activeTab === 'history' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              padding: '0.35rem 0.8rem',
              fontSize: '0.8rem'
            }}
          >
            <History size={14} />
            <span>Trade Ledger ({history.length})</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {onSeedDemo && (
            <button
              onClick={() => {
                if (confirm("Load realistic Institutional Demo Portfolio (4 Equity Holdings + F&O Spreads + Ledger History)?")) {
                  onSeedDemo();
                }
              }}
              className="btn btn-outline"
              title="Load sample paper trades & holdings"
              style={{
                fontSize: '0.72rem',
                padding: '0.25rem 0.6rem',
                borderColor: 'rgba(56, 189, 248, 0.4)',
                color: 'var(--accent-cyan)',
                background: 'rgba(56, 189, 248, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <Zap size={12} color="var(--accent-cyan)" />
              <span>Load Demo Data</span>
            </button>
          )}

          <button
            onClick={() => {
              if (confirm("Reset paper trading portfolio and trade history?")) {
                onResetPortfolio();
              }
            }}
            className="btn btn-outline"
            style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', color: 'var(--text-muted)' }}
          >
            <RotateCcw size={12} />
            <span>Reset Ledger</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div style={{ maxHeight: 260, overflowY: 'auto' }}>
        {activeTab === 'positions' ? (
          positions.length === 0 ? (
            <div style={{
              background: 'rgba(30, 41, 59, 0.35)',
              border: '1px dashed var(--border-subtle)',
              borderRadius: 12,
              padding: '1.25rem 1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.6rem' }}>
                <Briefcase size={20} color="var(--accent-cyan)" />
              </div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                No Active Holdings Currently Open
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto 0.9rem', lineHeight: 1.5 }}>
                {autoExit ? (
                  <span>
                    💡 <strong>Where did bought stocks go?</strong> If 'Auto-Exit Active' is ON, positions that hit Stop-Loss (-3%), Take-Profit (+10%), or severe breakdown are automatically closed into cash. Check the <strong>Trade Ledger</strong> tab to review closed trades.
                  </span>
                ) : (
                  <span>Select any stock from the watchlist to execute a paper buy order.</span>
                )}
              </p>
              {onSeedDemo && (
                <button
                  onClick={onSeedDemo}
                  className="btn btn-emerald"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <Zap size={14} />
                  <span>⚡ Load Demo Portfolio (RELIANCE, INFY, TATASTEEL, HDFCBANK)</span>
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: 500 }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Ticker</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Qty</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Avg Price</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Current Price</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Unrealized P&L</th>
                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map(pos => {
                    const isPos = pos.unrealized_pnl >= 0;
                    return (
                      <tr key={pos.ticker} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>{pos.ticker}</td>
                        <td className="mono" style={{ padding: '0.5rem 0.75rem' }}>{pos.qty}</td>
                        <td className="mono" style={{ padding: '0.5rem 0.75rem' }}>₹{pos.avg_price.toFixed(2)}</td>
                        <td className="mono" style={{ padding: '0.5rem 0.75rem' }}>₹{pos.current_price.toFixed(2)}</td>
                        <td className="mono" style={{ padding: '0.5rem 0.75rem', color: isPos ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 700 }}>
                          {isPos ? '+' : ''}₹{pos.unrealized_pnl.toFixed(2)} ({pos.unrealized_pnl_pct}%)
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                          <button
                            onClick={() => onOpenTrade(pos.ticker, pos.current_price, 'SELL', pos.qty)}
                            className="btn btn-rose"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                          >
                            Exit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No trades executed yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: 650 }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Time</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Type</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Ticker</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Qty</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Price</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Turnover</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Fees</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>P&L</th>
                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Closing Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(t => {
                    const isBuy = t.action === 'BUY';
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                          {t.timestamp.split(' ')[1] || t.timestamp}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span className={`badge-tag ${isBuy ? 'badge-emerald' : 'badge-rose'}`} style={{ fontSize: '0.65rem' }}>
                              {t.action}
                            </span>
                            {t.exitReason && (
                              <span style={{ fontSize: '0.62rem', color: t.autoExited ? 'var(--accent-rose)' : 'var(--text-muted)' }} title={t.exitReason}>
                                {t.autoExited ? '⚡ Auto-Exit' : 'Manual'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>
                          <div>{t.ticker}</div>
                          {t.exitReason && (
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t.exitReason}>
                              {t.exitReason}
                            </div>
                          )}
                        </td>
                        <td className="mono" style={{ padding: '0.5rem 0.75rem' }}>{t.qty}</td>
                        <td className="mono" style={{ padding: '0.5rem 0.75rem' }}>₹{t.price.toFixed(2)}</td>
                        <td className="mono" style={{ padding: '0.5rem 0.75rem' }}>₹{t.turnover.toFixed(2)}</td>
                        <td className="mono" style={{ padding: '0.5rem 0.75rem', color: 'var(--accent-amber)' }}>₹{t.charges.toFixed(2)}</td>
                        <td className="mono" style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: t.pnl >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                          {!isBuy ? `${t.pnl >= 0 ? '+' : ''}₹${t.pnl.toFixed(2)}` : '-'}
                        </td>
                        <td className="mono" style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-main)' }}>
                          ₹{(t.closing_balance ?? wallet_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
