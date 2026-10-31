import React, { useState } from 'react';
import { Briefcase, ArrowUpRight, ArrowDownRight, History, DollarSign, RotateCcw } from 'lucide-react';

export default function PortfolioLedger({
  portfolio,
  onOpenTrade,
  onResetPortfolio
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
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Portfolio Equity</span>
          <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
            ₹{total_equity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Cash: ₹{wallet_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
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

      {/* Table Content */}
      <div style={{ maxHeight: 240, overflowY: 'auto' }}>
        {activeTab === 'positions' ? (
          positions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No active holdings yet. Select any stock from the watchlist and execute a paper buy order.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
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
          )
        ) : (
          history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No trades executed yet.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Time</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Type</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Ticker</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Qty</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Price</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Turnover</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Fees</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>P&L</th>
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
                        <span className={`badge-tag ${isBuy ? 'badge-emerald' : 'badge-rose'}`} style={{ fontSize: '0.65rem' }}>
                          {t.action}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>{t.ticker}</td>
                      <td className="mono" style={{ padding: '0.5rem 0.75rem' }}>{t.qty}</td>
                      <td className="mono" style={{ padding: '0.5rem 0.75rem' }}>₹{t.price.toFixed(2)}</td>
                      <td className="mono" style={{ padding: '0.5rem 0.75rem' }}>₹{t.turnover.toFixed(2)}</td>
                      <td className="mono" style={{ padding: '0.5rem 0.75rem', color: 'var(--accent-amber)' }}>₹{t.charges.toFixed(2)}</td>
                      <td className="mono" style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 700, color: t.pnl >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                        {!isBuy ? `${t.pnl >= 0 ? '+' : ''}₹${t.pnl.toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}
