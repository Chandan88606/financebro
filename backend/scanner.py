"""
scanner.py - NSE Market Scanner, Yahoo Finance Data Pipeline & Consensus Engine
"""

import time
import datetime
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd
import yfinance as yf

from modules import evaluate_stock_consensus, sanitize_dataframe
from state import state
from paper_trading import execute_order

MASTER_NSE_STOCKS = [
    {"ticker": "RELIANCE", "symbol": "RELIANCE.NS", "name": "Reliance Industries", "sector": "Energy / Retail"},
    {"ticker": "TCS", "symbol": "TCS.NS", "name": "Tata Consultancy Services", "sector": "IT Services"},
    {"ticker": "HDFCBANK", "symbol": "HDFCBANK.NS", "name": "HDFC Bank Ltd.", "sector": "Banking"},
    {"ticker": "ICICIBANK", "symbol": "ICICIBANK.NS", "name": "ICICI Bank Ltd.", "sector": "Banking"},
    {"ticker": "INFY", "symbol": "INFY.NS", "name": "Infosys Ltd.", "sector": "IT Services"},
    {"ticker": "BHARTIARTL", "symbol": "BHARTIARTL.NS", "name": "Bharti Airtel Ltd.", "sector": "Telecom"},
    {"ticker": "ITC", "symbol": "ITC.NS", "name": "ITC Ltd.", "sector": "FMCG"},
    {"ticker": "SBIN", "symbol": "SBIN.NS", "name": "State Bank of India", "sector": "Banking"},
    {"ticker": "LT", "symbol": "LT.NS", "name": "Larsen & Toubro", "sector": "Infrastructure"},
    {"ticker": "HINDUNILVR", "symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever", "sector": "FMCG"},
    {"ticker": "KOTAKBANK", "symbol": "KOTAKBANK.NS", "name": "Kotak Mahindra Bank", "sector": "Banking"},
    {"ticker": "AXISBANK", "symbol": "AXISBANK.NS", "name": "Axis Bank Ltd.", "sector": "Banking"},
    {"ticker": "TATAMOTORS", "symbol": "TATAMOTORS.NS", "name": "Tata Motors Ltd.", "sector": "Automotive"},
    {"ticker": "MARUTI", "symbol": "MARUTI.NS", "name": "Maruti Suzuki India", "sector": "Automotive"},
    {"ticker": "SUNPHARMA", "symbol": "SUNPHARMA.NS", "name": "Sun Pharma Industries", "sector": "Pharma"},
    {"ticker": "TITAN", "symbol": "TITAN.NS", "name": "Titan Company Ltd.", "sector": "Consumer Goods"},
    {"ticker": "BAJFINANCE", "symbol": "BAJFINANCE.NS", "name": "Bajaj Finance Ltd.", "sector": "NBFC"},
    {"ticker": "TATASTEEL", "symbol": "TATASTEEL.NS", "name": "Tata Steel Ltd.", "sector": "Metals"},
    {"ticker": "NTPC", "symbol": "NTPC.NS", "name": "NTPC Ltd.", "sector": "Power / Utilities"},
    {"ticker": "POWERGRID", "symbol": "POWERGRID.NS", "name": "Power Grid Corp", "sector": "Power / Utilities"},
    {"ticker": "M&M", "symbol": "M&M.NS", "name": "Mahindra & Mahindra", "sector": "Automotive"},
    {"ticker": "ADANIENT", "symbol": "ADANIENT.NS", "name": "Adani Enterprises", "sector": "Conglomerate"},
    {"ticker": "ADANIPORTS", "symbol": "ADANIPORTS.NS", "name": "Adani Ports & SEZ", "sector": "Ports & Infra"},
    {"ticker": "COALINDIA", "symbol": "COALINDIA.NS", "name": "Coal India Ltd.", "sector": "Mining"},
    {"ticker": "ONGC", "symbol": "ONGC.NS", "name": "Oil & Natural Gas Corp", "sector": "Energy"},
    {"ticker": "WIPRO", "symbol": "WIPRO.NS", "name": "Wipro Ltd.", "sector": "IT Services"},
    {"ticker": "HCLTECH", "symbol": "HCLTECH.NS", "name": "HCL Technologies", "sector": "IT Services"},
    {"ticker": "ASIANPAINT", "symbol": "ASIANPAINT.NS", "name": "Asian Paints Ltd.", "sector": "Consumer Paints"},
    {"ticker": "BAJAJFINSV", "symbol": "BAJAJFINSV.NS", "name": "Bajaj Finserv Ltd.", "sector": "Financials"},
    {"ticker": "ULTRACEMCO", "symbol": "ULTRACEMCO.NS", "name": "UltraTech Cement", "sector": "Cement"},
    {"ticker": "ZOMATO", "symbol": "ZOMATO.NS", "name": "Zomato Ltd.", "sector": "Consumer Tech"},
    {"ticker": "JIOFIN", "symbol": "JIOFIN.NS", "name": "Jio Financial Services", "sector": "Financials"},
    {"ticker": "HAL", "symbol": "HAL.NS", "name": "Hindustan Aeronautics", "sector": "Defense / Aerospace"},
    {"ticker": "BEL", "symbol": "BEL.NS", "name": "Bharat Electronics", "sector": "Defense"},
    {"ticker": "TRENT", "symbol": "TRENT.NS", "name": "Trent Ltd.", "sector": "Retail"},
    {"ticker": "IRFC", "symbol": "IRFC.NS", "name": "Indian Railway Finance", "sector": "Railways / NBFC"},
    {"ticker": "CIPLA", "symbol": "CIPLA.NS", "name": "Cipla Ltd.", "sector": "Pharma"},
    {"ticker": "DRREDDY", "symbol": "DRREDDY.NS", "name": "Dr. Reddy's Labs", "sector": "Pharma"},
    {"ticker": "NIFTY50", "symbol": "^NSEI", "name": "NIFTY 50 Benchmark Index", "sector": "Index"},
]

NSE_DICT = {item["ticker"]: item for item in MASTER_NSE_STOCKS}

# In-memory OHLCV cache
CACHE_DF: Dict[str, pd.DataFrame] = {}
CACHE_TIMESTAMP: Dict[str, float] = {}
CACHE_TTL_SECONDS = 300  # 5 minutes

def generate_fallback_data(ticker: str, days: int = 120) -> pd.DataFrame:
    """
    High-fidelity synthetic stock market simulation for offline resilience or rate-limits.
    """
    np.random.seed(abs(hash(ticker)) % (2**31))
    base_price = (abs(hash(ticker)) % 3000) + 120.0
    dates = pd.date_range(end=pd.Timestamp.now(), periods=days, freq="B")
    returns = np.random.normal(0.0008, 0.018, size=days)
    price_series = base_price * np.exp(np.cumsum(returns))
    
    highs = price_series * (1 + np.abs(np.random.normal(0.005, 0.005, size=days)))
    lows = price_series * (1 - np.abs(np.random.normal(0.005, 0.005, size=days)))
    opens = lows + (highs - lows) * np.random.uniform(0.2, 0.8, size=days)
    closes = price_series
    volumes = np.random.randint(500000, 8000000, size=days)

    df = pd.DataFrame({
        "Open": opens,
        "High": highs,
        "Low": lows,
        "Close": closes,
        "Volume": volumes
    }, index=dates)
    return df

def fetch_stock_data(symbol: str, ticker: str, period: str = "6mo", interval: str = "1d") -> pd.DataFrame:
    """
    Fetches real-time / historical OHLCV data from yfinance with fallback.
    """
    now = time.time()
    cache_key = f"{ticker}_{period}_{interval}"
    if cache_key in CACHE_DF and (now - CACHE_TIMESTAMP.get(cache_key, 0) < CACHE_TTL_SECONDS):
        return CACHE_DF[cache_key]

    try:
        yf_ticker = yf.Ticker(symbol)
        df = yf_ticker.history(period=period, interval=interval)
        if df is not None and not df.empty and len(df) >= 30:
            df = sanitize_dataframe(df)
            CACHE_DF[cache_key] = df
            CACHE_TIMESTAMP[cache_key] = now
            return df
    except Exception as e:
        print(f"yfinance fetch error for {symbol}: {e}")

    # Fallback synthetic data
    df = generate_fallback_data(ticker)
    CACHE_DF[cache_key] = df
    CACHE_TIMESTAMP[cache_key] = now
    return df

def scan_single_stock(ticker: str) -> Dict[str, Any]:
    meta = NSE_DICT.get(ticker, {
        "ticker": ticker,
        "symbol": f"{ticker}.NS",
        "name": ticker,
        "sector": "NSE Stock"
    })
    
    df = fetch_stock_data(meta["symbol"], ticker)
    consensus_res = evaluate_stock_consensus(df, custom_rules=state.rules)

    current_price = float(df["Close"].iloc[-1]) if (df is not None and not df.empty) else 0.0
    score = consensus_res.get("score", 0)
    matrix = consensus_res.get("matrix", [])
    passed_modules = [m["id"] for m in matrix if m.get("passed")]
    failed_modules = [m["id"] for m in matrix if not m.get("passed")]
    module_details = {m["id"]: m for m in matrix}

    buy_thresh = state.rules.get("consensus", {}).get("consensus_buy_threshold", 6)
    buy_signal = (score >= buy_thresh)

    # Calculate 1-day change
    change_pct = 0.0
    if len(df) >= 2:
        prev_close = float(df["Close"].iloc[-2])
        if prev_close > 0:
            change_pct = round(((current_price - prev_close) / prev_close) * 100, 2)

    return {
        "ticker": ticker,
        "symbol": meta["symbol"],
        "name": meta["name"],
        "sector": meta["sector"],
        "current_price": round(current_price, 2),
        "change_pct": change_pct,
        "consensus_score": score,
        "passed_count": len(passed_modules),
        "failed_count": len(failed_modules),
        "passed_modules": passed_modules,
        "failed_modules": failed_modules,
        "module_details": module_details,
        "buy_signal": buy_signal,
        "fits_wallet": (current_price <= state.wallet_balance and current_price > 0),
        "last_updated": datetime.datetime.now().strftime("%H:%M:%S")
    }

def scan_all_stocks(max_price: Optional[float] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
    results = []
    for item in MASTER_NSE_STOCKS:
        ticker = item["ticker"]
        # Search filter
        if search:
            query = search.strip().upper()
            if query not in ticker and query not in item["name"].upper() and query not in item["sector"].upper():
                continue

        try:
            stock_info = scan_single_stock(ticker)
            if max_price is not None and max_price > 0:
                if stock_info["current_price"] > max_price:
                    continue
            results.append(stock_info)
        except Exception as e:
            print(f"Error scanning {ticker}: {e}")

    # Sort by consensus score descending, then price
    results.sort(key=lambda x: (x["consensus_score"], -x["current_price"]), reverse=True)
    return results

def get_candlestick_data(ticker: str, period: str = "6mo", interval: str = "1d") -> List[Dict[str, Any]]:
    meta = NSE_DICT.get(ticker, {
        "ticker": ticker,
        "symbol": f"{ticker}.NS",
        "name": ticker,
        "sector": "NSE Stock"
    })
    df = fetch_stock_data(meta["symbol"], ticker, period=period, interval=interval)
    candles = []
    
    for idx, row in df.iterrows():
        # Date string formatting YYYY-MM-DD
        if isinstance(idx, pd.Timestamp):
            date_str = idx.strftime("%Y-%m-%d")
        else:
            date_str = str(idx)[:10]

        candles.append({
            "time": date_str,
            "open": round(float(row["Open"]), 2),
            "high": round(float(row["High"]), 2),
            "low": round(float(row["Low"]), 2),
            "close": round(float(row["Close"]), 2),
            "volume": int(row["Volume"])
        })
    return candles

def check_auto_exit_positions(current_prices: Dict[str, float]) -> List[str]:
    """
    Checks active positions against the auto-exit consensus score threshold.
    If consensus score drops below exit threshold, triggers automatic paper sale.
    """
    exit_threshold = state.rules.get("consensus", {}).get("auto_sell_exit_threshold", 5)
    triggered = []

    active_tickers = list(state.active_positions.keys())
    for ticker in active_tickers:
        pos = state.active_positions[ticker]
        stock_info = scan_single_stock(ticker)
        score = stock_info["consensus_score"]
        current_price = stock_info["current_price"]

        if score < exit_threshold:
            qty = pos["qty"]
            res = execute_order(ticker, "SELL", qty, current_price, consensus_score=score)
            if res.get("success"):
                msg = f"⚠️ [AUTO-EXIT TRIGGERED] Sold {qty}x {ticker} @ ₹{current_price:,.2f} because consensus score ({score}/10) fell below exit threshold ({exit_threshold}/10)."
                state.add_log(msg)
                triggered.append(msg)
    return triggered
