"""
paper_trading.py - Paper Trading Execution Engine & Indian Regulatory Fee Model
"""

import datetime
from typing import Dict, Any, Tuple, List, Optional
from state import state

def calculate_charges(turnover: float) -> Tuple[float, Dict[str, float]]:
    """
    Computes statutory Indian regulatory charges for equity delivery / intraday:
    - Brokerage: flat ₹20 or 0.03%
    - STT (Securities Transaction Tax): 0.1% on delivery
    - Exchange Transaction Fee: 0.00345%
    - GST: 18% on (Brokerage + Exchange Fee)
    - Stamp Duty: 0.015% (Buy only, standard delivery)
    - SEBI Turnover Fee: 0.0001%
    """
    turnover = max(0.0, turnover)
    brokerage = min(20.0, turnover * 0.0003) if turnover < 66666 else 20.0
    stt = turnover * 0.001
    exchange_fee = turnover * 0.0000345
    gst = (brokerage + exchange_fee) * 0.18
    stamp_duty = turnover * 0.00015
    sebi_fee = turnover * 0.000001

    total_charges = round(brokerage + stt + exchange_fee + gst + stamp_duty + sebi_fee, 2)
    breakdown = {
        "brokerage": round(brokerage, 2),
        "stt": round(stt, 2),
        "gst": round(gst, 2),
        "exchange_fee": round(exchange_fee, 2),
        "stamp_duty": round(stamp_duty, 2),
        "sebi_fee": round(sebi_fee, 2),
        "total": total_charges
    }
    return total_charges, breakdown

def execute_order(ticker: str, action: str, qty: int, price: float, consensus_score: int = 0) -> Dict[str, Any]:
    """
    Executes a simulated BUY or SELL order.
    Returns status dict with trade details or error.
    """
    action = action.upper()
    if qty <= 0:
        return {"success": False, "error": "Quantity must be greater than 0"}
    if price <= 0:
        return {"success": False, "error": "Price must be greater than 0"}

    turnover = round(qty * price, 2)
    charges, breakdown = calculate_charges(turnover)
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if action == "BUY":
        total_required = turnover + charges
        if total_required > state.wallet_balance:
            return {
                "success": False,
                "error": f"Insufficient funds. Required: ₹{total_required:,.2f} (Turnover: ₹{turnover:,.2f} + Taxes: ₹{charges:,.2f}), Available: ₹{state.wallet_balance:,.2f}"
            }

        # Deduct wallet
        state.wallet_balance = round(state.wallet_balance - total_required, 2)

        # Update position
        if ticker in state.active_positions:
            pos = state.active_positions[ticker]
            new_qty = pos["qty"] + qty
            new_avg = round(((pos["avg_price"] * pos["qty"]) + turnover) / new_qty, 2)
            pos["qty"] = new_qty
            pos["avg_price"] = new_avg
            pos["invested"] = round(new_qty * new_avg, 2)
            pos["last_updated"] = now_str
        else:
            state.active_positions[ticker] = {
                "ticker": ticker,
                "qty": qty,
                "avg_price": price,
                "invested": turnover,
                "opened_at": now_str,
                "consensus_score": consensus_score
            }

        trade_record = {
            "id": f"TRD-{int(datetime.datetime.now().timestamp() * 1000)}",
            "timestamp": now_str,
            "ticker": ticker,
            "action": "BUY",
            "qty": qty,
            "price": price,
            "turnover": turnover,
            "charges": charges,
            "breakdown": breakdown,
            "pnl": 0.0,
            "consensus_score": consensus_score
        }
        state.trade_history.insert(0, trade_record)
        state.add_log(f"🟢 [BUY ORDER] {qty}x {ticker} @ ₹{price:,.2f} | Turnover: ₹{turnover:,.2f} | Fees: ₹{charges:,.2f} | Remaining Cash: ₹{state.wallet_balance:,.2f}")
        state.save_state()
        return {"success": True, "trade": trade_record}

    elif action == "SELL":
        if ticker not in state.active_positions:
            return {"success": False, "error": f"No open position for {ticker} to sell"}

        pos = state.active_positions[ticker]
        if qty > pos["qty"]:
            return {"success": False, "error": f"Cannot sell {qty} shares. Current holding: {pos['qty']}"}

        net_proceeds = round(turnover - charges, 2)
        cost_basis = round(qty * pos["avg_price"], 2)
        realized_pnl = round(net_proceeds - cost_basis, 2)

        # Add proceeds to wallet
        state.wallet_balance = round(state.wallet_balance + net_proceeds, 2)

        # Update or remove position
        remaining_qty = pos["qty"] - qty
        if remaining_qty == 0:
            del state.active_positions[ticker]
        else:
            pos["qty"] = remaining_qty
            pos["invested"] = round(remaining_qty * pos["avg_price"], 2)
            pos["last_updated"] = now_str

        trade_record = {
            "id": f"TRD-{int(datetime.datetime.now().timestamp() * 1000)}",
            "timestamp": now_str,
            "ticker": ticker,
            "action": "SELL",
            "qty": qty,
            "price": price,
            "turnover": turnover,
            "charges": charges,
            "breakdown": breakdown,
            "pnl": realized_pnl,
            "consensus_score": consensus_score
        }
        state.trade_history.insert(0, trade_record)
        pnl_symbol = "🟢" if realized_pnl >= 0 else "🔴"
        state.add_log(f"{pnl_symbol} [SELL ORDER] {qty}x {ticker} @ ₹{price:,.2f} | P&L: ₹{realized_pnl:,.2f} | Fees: ₹{charges:,.2f} | Wallet: ₹{state.wallet_balance:,.2f}")
        state.save_state()
        return {"success": True, "trade": trade_record}

    return {"success": False, "error": "Invalid action"}

def get_portfolio_summary(current_prices: Dict[str, float]) -> Dict[str, Any]:
    """
    Computes portfolio holdings, live market valuation, unrealized & realized P&L,
    and total regulatory charges paid.
    """
    positions = []
    total_invested = 0.0
    current_portfolio_value = 0.0
    total_unrealized_pnl = 0.0

    for ticker, pos in state.active_positions.items():
        qty = pos["qty"]
        avg_price = pos["avg_price"]
        current_price = current_prices.get(ticker, avg_price)
        market_value = round(qty * current_price, 2)
        invested = round(qty * avg_price, 2)
        unrealized_pnl = round(market_value - invested, 2)
        unrealized_pnl_pct = round((unrealized_pnl / invested) * 100, 2) if invested > 0 else 0.0

        total_invested += invested
        current_portfolio_value += market_value
        total_unrealized_pnl += unrealized_pnl

        positions.append({
            "ticker": ticker,
            "qty": qty,
            "avg_price": avg_price,
            "current_price": current_price,
            "invested": invested,
            "market_value": market_value,
            "unrealized_pnl": unrealized_pnl,
            "unrealized_pnl_pct": unrealized_pnl_pct,
            "opened_at": pos.get("opened_at", "-")
        })

    # Calculate realized P&L from trade history
    total_realized_pnl = round(sum(t.get("pnl", 0.0) for t in state.trade_history if t.get("action") == "SELL"), 2)
    total_charges_paid = round(sum(t.get("charges", 0.0) for t in state.trade_history), 2)
    total_equity = round(state.wallet_balance + current_portfolio_value, 2)
    net_pnl = round(total_equity - state.initial_capital, 2)
    roi_pct = round((net_pnl / state.initial_capital) * 100, 2) if state.initial_capital > 0 else 0.0

    return {
        "wallet_balance": state.wallet_balance,
        "initial_capital": state.initial_capital,
        "invested_capital": round(total_invested, 2),
        "current_portfolio_value": round(current_portfolio_value, 2),
        "total_equity": total_equity,
        "unrealized_pnl": round(total_unrealized_pnl, 2),
        "realized_pnl": total_realized_pnl,
        "net_pnl": net_pnl,
        "roi_pct": roi_pct,
        "total_charges_paid": total_charges_paid,
        "positions": positions,
        "total_trades": len(state.trade_history),
        "history": state.trade_history
    }
