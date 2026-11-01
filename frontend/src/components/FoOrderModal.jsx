import React, { useState } from 'react';
import { X, Check, ShieldCheck, Zap, AlertTriangle, Layers } from 'lucide-react';
import { calculateFoCharges } from '../api';

export default function FoOrderModal({
  isOpen,
  onClose,
  strategyInstance,
  walletBalance,
  onExecute
}) {
  const [lots, setLots] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !strategyInstance) return null;

  const totalLots = Math.max(1, parseInt(lots, 10) || 1);
  const totalMargin = Math.round(strategyInstance.requiredMarginPerLot * totalLots);
  const premiumTurnover = Math.round(strategyInstance.totalCashEffectPerLot * totalLots);
  const charges = calculateFoCharges(strategyInstance.legs.length, premiumTurnover, totalLots);

  const cashRequired = strategyInstance.isCredit
    ? charges.total
    : Math.round((premiumTurnover + charges.total) * 100) / 100;

  const maxLotsAffordable = strategyInstance.isCredit
    ? Math.max(1, Math.floor(walletBalance / (strategyInstance.requiredMarginPerLot || 1)))
    : Math.max(1, Math.floor(walletBalance / (strategyInstance.totalCashEffectPerLot + 50)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (strategyInstance.isCredit && totalMargin > walletBalance) {
      setErrorMsg(`Insufficient margin balance. Required: ₹${totalMargin.toLocaleString('en-IN')}, Available: ₹${walletBalance.toLocaleString('en-IN')}`);
      return;
    }
    if (!strategyInstance.isCredit && cashRequired > walletBalance) {
      setErrorMsg(`Insufficient cash. Required: ₹${cashRequired.toLocaleString('en-IN')}, Available: ₹${walletBalance.toLocaleString('en-IN')}`);
      return;
    }

    setLoading(true);
    try {
      await onExecute({
        strategyInstance,
        lots: totalLots
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Failed to execute F&O strategy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={20} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Deploy {strategyInstance.strategyName}</h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {strategyInstance.underlyingName} ({strategyInstance.underlyingTicker}) · Spot ₹{strategyInstance.spotPrice.toLocaleString('en-IN')}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Strategy Summary Badge */}
        <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {strategyInstance.alias}
            </span>
            <span className={`badge-tag ${strategyInstance.isCredit ? 'badge-emerald' : 'badge-cyan'}`}>
              {strategyInstance.isCredit ? 'NET CREDIT' : 'NET DEBIT'}
            </span>
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            {strategyInstance.idealFor}
          </p>
        </div>

        {/* Legs Table */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
            Multi-Leg Basket ({strategyInstance.legs.length} Legs)
          </span>
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden' }}>
            {strategyInstance.legs.map((leg, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                borderBottom: i < strategyInstance.legs.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                background: leg.action === 'BUY' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(244, 63, 94, 0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span className={`badge-tag ${leg.action === 'BUY' ? 'badge-emerald' : 'badge-rose'}`} style={{ fontSize: '0.65rem' }}>
                    {leg.action} {leg.qtyRatio > 1 ? `${leg.qtyRatio}x` : ''}
                  </span>
                  <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                    {strategyInstance.underlyingTicker} {leg.strike} {leg.optionType}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="mono" style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                    ₹{leg.premium.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                    {leg.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lots Selector & Presets */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lot Multiplier (Lot Size: {strategyInstance.lotSize})</label>
              <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                Total Qty: {totalLots * strategyInstance.lotSize} shares
              </span>
            </div>
            <input
              type="number"
              min="1"
              max={maxLotsAffordable}
              value={lots}
              onChange={(e) => setLots(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="input-dark mono"
              style={{ width: '100%', fontSize: '1.1rem', fontWeight: 700 }}
            />
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
              {[1, 2, 5, 10].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setLots(n)}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '0.25rem', fontSize: '0.72rem' }}
                >
                  {n} {n === 1 ? 'Lot' : 'Lots'}
                </button>
              ))}
            </div>
          </div>

          {/* Institutional Margin & Charges Calculation */}
          <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: 10, padding: '0.75rem', marginBottom: '1.25rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>SEBI Span Margin (With Spread Relief):</span>
              <span className="mono" style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
                ₹{totalMargin.toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Net Premium ({strategyInstance.isCredit ? 'Credit' : 'Debit'}):</span>
              <span className="mono" style={{ color: strategyInstance.isCredit ? 'var(--accent-emerald)' : 'var(--accent-cyan)', fontWeight: 700 }}>
                {strategyInstance.isCredit ? '+' : '-'}₹{premiumTurnover.toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Statutory Brokerage & Taxes:</span>
              <span className="mono" style={{ color: 'var(--accent-amber)' }}>
                ₹{charges.total.toFixed(2)} (₹20/leg + STT + GST)
              </span>
            </div>
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.45rem', marginTop: '0.45rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
              <span>Total Available Wallet:</span>
              <span className="mono" style={{ color: walletBalance >= totalMargin ? 'var(--text-main)' : 'var(--accent-rose)' }}>
                ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {errorMsg && (
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', padding: '0.5rem', borderRadius: 8, fontSize: '0.75rem', marginBottom: '1rem' }}>
              {errorMsg}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ flex: 2 }}
            >
              <Check size={16} />
              <span>{loading ? 'Transmitting Basket...' : `Confirm Deployment (${totalLots} Lots)`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
