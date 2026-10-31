import React, { useState, useEffect } from 'react';
import { X, Check, ShoppingBag, ShieldCheck, Calculator } from 'lucide-react';

export default function OrderModal({
  isOpen,
  onClose,
  ticker,
  currentPrice,
  defaultAction = 'BUY',
  walletBalance,
  currentHolding = 0,
  onExecute
}) {
  const [action, setAction] = useState(defaultAction);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setAction(defaultAction);
    setQty(1);
    setErrorMsg('');
  }, [isOpen, defaultAction, ticker]);

  if (!isOpen) return null;

  const turnover = Math.round(qty * currentPrice * 100) / 100;

  // Indian statutory fee calculator (matching backend)
  const brokerage = turnover > 0 ? (turnover < 66666 ? Math.min(20, turnover * 0.0003) : 20.0) : 0;
  const stt = turnover * 0.001;
  const exchangeFee = turnover * 0.0000345;
  const gst = (brokerage + exchangeFee) * 0.18;
  const stampDuty = turnover * 0.00015;
  const sebiFee = turnover * 0.000001;
  const totalCharges = Math.round((brokerage + stt + exchangeFee + gst + stampDuty + sebiFee) * 100) / 100;

  const totalRequired = Math.round((turnover + totalCharges) * 100) / 100;
  const netProceeds = Math.max(0, Math.round((turnover - totalCharges) * 100) / 100);

  const maxAffordableQty = currentPrice > 0 ? Math.max(0, Math.floor((walletBalance - 25) / currentPrice)) : 0;

  const handlePreset = (fraction) => {
    if (action === 'BUY') {
      const q = Math.max(1, Math.floor(maxAffordableQty * fraction));
      setQty(q);
    } else {
      const q = Math.max(1, Math.floor(currentHolding * fraction));
      setQty(q);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (qty <= 0) {
      setErrorMsg("Quantity must be at least 1.");
      return;
    }
    if (action === 'BUY' && totalRequired > walletBalance) {
      setErrorMsg(`Insufficient wallet capital (Required: ₹${totalRequired.toFixed(2)}, Available: ₹${walletBalance.toFixed(2)})`);
      return;
    }
    if (action === 'SELL' && qty > currentHolding) {
      setErrorMsg(`Cannot sell ${qty} shares. Current holding is ${currentHolding}.`);
      return;
    }

    setLoading(true);
    try {
      await onExecute({
        ticker,
        action,
        qty: parseInt(qty, 10),
        price: currentPrice
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Order execution failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingBag size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Execute Order: {ticker}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Buy / Sell Toggle Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => setAction('BUY')}
            className="btn"
            style={{
              background: action === 'BUY' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'rgba(30, 41, 59, 0.5)',
              color: 'white',
              border: action === 'BUY' ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)'
            }}
          >
            BUY (DELIVERY)
          </button>
          <button
            type="button"
            onClick={() => setAction('SELL')}
            disabled={currentHolding <= 0}
            className="btn"
            style={{
              background: action === 'SELL' ? 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)' : 'rgba(30, 41, 59, 0.5)',
              color: 'white',
              opacity: currentHolding <= 0 ? 0.4 : 1,
              border: action === 'SELL' ? '1px solid var(--accent-rose)' : '1px solid var(--border-subtle)'
            }}
          >
            SELL (HOLDING: {currentHolding})
          </button>
        </div>

        {/* Quantity & Presets */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Order Quantity</label>
              <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                Price: ₹{currentPrice.toFixed(2)}
              </span>
            </div>
            <input
              type="number"
              min="1"
              max={action === 'BUY' ? Math.max(1, maxAffordableQty) : currentHolding}
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="input-dark mono"
              style={{ width: '100%', fontSize: '1.1rem', fontWeight: 700 }}
            />

            {/* Preset Buttons */}
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
              {action === 'BUY' ? (
                <>
                  <button type="button" onClick={() => setQty(1)} className="btn btn-outline" style={{ flex: 1, padding: '0.25rem', fontSize: '0.72rem' }}>1 Qty</button>
                  <button type="button" onClick={() => handlePreset(0.25)} className="btn btn-outline" style={{ flex: 1, padding: '0.25rem', fontSize: '0.72rem' }}>25%</button>
                  <button type="button" onClick={() => handlePreset(0.5)} className="btn btn-outline" style={{ flex: 1, padding: '0.25rem', fontSize: '0.72rem' }}>50%</button>
                  <button type="button" onClick={() => handlePreset(1.0)} className="btn btn-outline" style={{ flex: 1, padding: '0.25rem', fontSize: '0.72rem' }}>Max ({maxAffordableQty})</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => handlePreset(0.25)} className="btn btn-outline" style={{ flex: 1, padding: '0.25rem', fontSize: '0.72rem' }}>25%</button>
                  <button type="button" onClick={() => handlePreset(0.5)} className="btn btn-outline" style={{ flex: 1, padding: '0.25rem', fontSize: '0.72rem' }}>50%</button>
                  <button type="button" onClick={() => handlePreset(1.0)} className="btn btn-outline" style={{ flex: 1, padding: '0.25rem', fontSize: '0.72rem' }}>100% ({currentHolding})</button>
                </>
              )}
            </div>
          </div>

          {/* Indian Regulatory Fee Breakdown Table */}
          <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: 10, padding: '0.75rem', marginBottom: '1.25rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calculator size={12} />
              <span>Statutory Cost & Tax Estimation</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Trade Turnover:</span>
              <span className="mono">₹{turnover.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Brokerage (Flat):</span>
              <span className="mono">₹{brokerage.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>STT + GST + Stamp Duty:</span>
              <span className="mono">₹{(totalCharges - brokerage).toFixed(2)}</span>
            </div>
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.4rem', marginTop: '0.4rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
              <span>{action === 'BUY' ? 'Total Required:' : 'Net Proceeds:'}</span>
              <span className="mono" style={{ color: action === 'BUY' ? 'var(--accent-emerald)' : 'var(--accent-cyan)' }}>
                ₹{action === 'BUY' ? totalRequired.toFixed(2) : netProceeds.toFixed(2)}
              </span>
            </div>
          </div>

          {errorMsg && (
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', padding: '0.5rem', borderRadius: 8, fontSize: '0.75rem', marginBottom: '1rem' }}>
              {errorMsg}
            </div>
          )}

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={action === 'BUY' ? 'btn btn-emerald' : 'btn btn-rose'}
              style={{ flex: 2 }}
            >
              <Check size={16} />
              <span>{loading ? 'Executing...' : `Confirm ${action} (${qty} Shares)`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
