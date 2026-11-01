import React from 'react';
import { X, Clock, Play, Pause, AlertCircle, CheckCircle2, TrendingUp, Info, HelpCircle } from 'lucide-react';

export default function MarketStatusModal({
  isOpen,
  onClose,
  marketStatus,
  simulationPaused,
  onToggleSimulation
}) {
  if (!isOpen) return null;

  const { isOpen: isNseOpen, isWeekend, istTimeString, dayName, statusText } = marketStatus || {};

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 1100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="card-panel" style={{
        maxWidth: 620,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: '#0b1329',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85)',
        padding: '1.75rem'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: isNseOpen ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
              border: `1px solid ${isNseOpen ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={20} color={isNseOpen ? 'var(--accent-emerald)' : 'var(--accent-rose)'} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
                NSE Market Hours & Live Simulator
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                National Stock Exchange (NSE) Schedule & Paper Trading Engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '0.4rem', borderRadius: 8 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Market Status Banner */}
        <div style={{
          background: isNseOpen ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
          border: `1px solid ${isNseOpen ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
          borderRadius: 12,
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: isNseOpen ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                display: 'inline-block',
                boxShadow: `0 0 10px ${isNseOpen ? '#10b981' : '#f43f5e'}`
              }} />
              <span style={{
                fontSize: '0.95rem',
                fontWeight: 800,
                color: isNseOpen ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                letterSpacing: '0.5px'
              }}>
                {statusText || (isNseOpen ? 'NSE LIVE' : 'NSE CLOSED')}
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Official Exchange Hours: <strong style={{ color: 'var(--text-main)' }}>Mon–Fri, 09:15 AM to 03:30 PM IST</strong>
            </p>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '0.4rem 0.85rem',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Indian Standard Time (IST)</div>
            <div className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {dayName ? `${dayName}, ` : ''}{istTimeString || '--:--'}
            </div>
          </div>
        </div>

        {/* Question 1 Explanation: Why are stocks moving? */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.45)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 10,
          padding: '1rem 1.15rem',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <HelpCircle size={16} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              Why do stock prices tick up & down when the market is closed?
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.45', marginBottom: '0.5rem' }}>
            FinanceBro is designed for <strong>zero-risk paper trading, algorithmic consensus scanning, and F&O backtesting</strong>. If prices froze completely after Friday 3:30 PM IST, traders could not test paper orders, observe 10-module consensus shifts, test auto-exit triggers, or simulate options spreads over the weekend.
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
            When the real NSE is closed, FinanceBro's <strong>Autonomous Tick Engine</strong> generates small, continuous micro-fluctuations (±0.1% to 0.4%) around realistic benchmark closing prices to provide a 24/7 active training sandbox.
          </p>
        </div>

        {/* Question 2 Explanation: Reliance Price Calibration */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.45)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 10,
          padding: '1rem 1.15rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <TrendingUp size={16} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
              Reliance Industries (RELIANCE) Stock Price: Calibrated to ₹1,164.90
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.45', marginBottom: '0.5rem' }}>
            Reliance Industries executed a landmark <strong>1:1 bonus issue</strong> in late October 2024, which adjusted its pre-bonus ₹2,700 share price down to ~₹1,330–₹1,350. The starter dataset had a historical base price recorded during that post-bonus window (~₹1,285.50), which drifted with simulator ticks to ~₹1,316.35.
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
            <CheckCircle2 size={13} color="var(--accent-emerald)" style={{ display: 'inline', marginRight: 4 }} />
            The baseline for <strong>RELIANCE has now been calibrated directly to ₹1,164.90</strong> across Cash Equity and F&O Derivatives modules to reflect prevailing actual market levels.
          </p>
        </div>

        {/* Simulator Control Action */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: 12,
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
              Weekend Tick Generator Control
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {simulationPaused
                ? 'Ticks are currently FROZEN. All stock prices remain fixed at static closing levels.'
                : 'Ticks are currently ACTIVE. Stocks fluctuate continuously for 24/7 paper trading practice.'}
            </div>
          </div>

          <button
            onClick={onToggleSimulation}
            className={`btn ${simulationPaused ? 'btn-emerald' : 'btn-outline'}`}
            style={{
              padding: '0.5rem 1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontWeight: 700,
              fontSize: '0.82rem'
            }}
          >
            {simulationPaused ? (
              <>
                <Play size={15} />
                <span>Resume Simulator Ticks</span>
              </>
            ) : (
              <>
                <Pause size={15} color="var(--accent-rose)" />
                <span style={{ color: 'var(--accent-rose)' }}>Freeze Ticks (Hold Prices)</span>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1.4rem', fontSize: '0.85rem' }}
          >
            Got it, Return to Terminal
          </button>
        </div>
      </div>
    </div>
  );
}
