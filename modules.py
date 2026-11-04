"""
modules.py - The 10 Master Consensus Modules for FinanceBro
Institutional-grade technical analysis indicators designed for Indian Stock Market (NSE).
Each module takes a cleaned pandas DataFrame (with Open, High, Low, Close, Volume)
and returns a boolean True (Bullish / Confirmed) or False (Bearish / Not confirmed).
"""

from typing import Dict, Any, Tuple
import numpy as np
import pandas as pd

try:
    import ta
    HAS_TA = True
except ImportError:
    HAS_TA = False


def sanitize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans up DataFrame columns, handles MultiIndex columns from yfinance,
    and ensures Open, High, Low, Close, Volume columns exist with float values.
    """
    if df is None or df.empty:
        return pd.DataFrame()
    
    clean_df = df.copy()
    
    # Handle yfinance multi-index columns (Price, Ticker)
    if isinstance(clean_df.columns, pd.MultiIndex):
        clean_df.columns = [col[0] for col in clean_df.columns]
    
    # Standardize column naming
    rename_dict = {}
    for col in clean_df.columns:
        col_str = str(col).strip().capitalize()
        if col_str in ["Open", "High", "Low", "Close", "Volume"]:
            rename_dict[col] = col_str
        elif col_str.lower() in ["adj close", "adj_close"]:
            rename_dict[col] = "Adj_Close"
    
    clean_df.rename(columns=rename_dict, inplace=True)
    
    # Check essential columns
    for req in ["Open", "High", "Low", "Close", "Volume"]:
        if req not in clean_df.columns:
            raise ValueError(f"Missing required column: {req}")
        clean_df[req] = pd.to_numeric(clean_df[req], errors="coerce")
    
    clean_df.dropna(subset=["Open", "High", "Low", "Close", "Volume"], inplace=True)
    return clean_df


# ==========================================
# INDICATOR HELPER FUNCTIONS (TA / PURE PANDAS FALLBACK)
# ==========================================
def calc_rsi(series: pd.Series, window: int = 14) -> pd.Series:
    if HAS_TA:
        try:
            return ta.momentum.rsi(close=series, window=window)
        except Exception:
            pass
    delta = series.diff()
    gain = (delta.where(delta > 0, 0.0)).ewm(alpha=1.0/window, adjust=False).mean()
    loss = (-delta.where(delta < 0, 0.0)).ewm(alpha=1.0/window, adjust=False).mean()
    rs = gain / loss.replace(0, np.nan)
    rsi = 100.0 - (100.0 / (1.0 + rs))
    return rsi.fillna(50.0)


def calc_ema(series: pd.Series, span: int) -> pd.Series:
    if HAS_TA:
        try:
            return ta.trend.ema_indicator(close=series, window=span)
        except Exception:
            pass
    return series.ewm(span=span, adjust=False).mean()


def calc_bollinger_hband(series: pd.Series, window: int = 20, window_dev: int = 2) -> pd.Series:
    if HAS_TA:
        try:
            return ta.volatility.bollinger_hband(close=series, window=window, window_dev=window_dev)
        except Exception:
            pass
    ma = series.rolling(window=window).mean()
    std = series.rolling(window=window).std()
    return ma + (window_dev * std)


def calc_bollinger_lband(series: pd.Series, window: int = 20, window_dev: int = 2) -> pd.Series:
    if HAS_TA:
        try:
            return ta.volatility.bollinger_lband(close=series, window=window, window_dev=window_dev)
        except Exception:
            pass
    ma = series.rolling(window=window).mean()
    std = series.rolling(window=window).std()
    return ma - (window_dev * std)


def calc_macd_diff(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> pd.Series:
    if HAS_TA:
        try:
            return ta.trend.macd_diff(close=series, window_slow=slow, window_fast=fast, window_sign=signal)
        except Exception:
            pass
    ema_fast = calc_ema(series, fast)
    ema_slow = calc_ema(series, slow)
    macd_line = ema_fast - ema_slow
    signal_line = calc_ema(macd_line, signal)
    return macd_line - signal_line


def calc_atr(high: pd.Series, low: pd.Series, close: pd.Series, window: int = 10) -> pd.Series:
    if HAS_TA:
        try:
            return ta.volatility.average_true_range(high=high, low=low, close=close, window=window)
        except Exception:
            pass
    prev_close = close.shift(1)
    tr1 = high - low
    tr2 = (high - prev_close).abs()
    tr3 = (low - prev_close).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    return tr.rolling(window=window).mean().bfill()


# ==========================================
# MODULE 1: RSI Range-Shift (Bouncing Above 40)
# ==========================================
def module_1_rsi_range_shift(df: pd.DataFrame, window: int = 14, floor: float = 40.0, ceiling: float = 75.0) -> bool:
    """
    Module 1: RSI Range-Shift
    Condition: Current RSI > floor, within healthy momentum (RSI <= ceiling), and
    rising with strong slope off the support floor.
    """
    df = sanitize_dataframe(df)
    if len(df) < window + 5:
        return False
    
    rsi_series = calc_rsi(df["Close"], window=window)
    current_rsi = float(rsi_series.iloc[-1])
    prev_rsi = float(rsi_series.iloc[-2])
    min_recent_rsi = float(rsi_series.iloc[-4:].min())
    
    is_above_support = current_rsi >= floor and current_rsi <= ceiling
    is_rising = current_rsi > prev_rsi
    has_bounced = min_recent_rsi <= (floor + 4.0) or prev_rsi <= (floor + 2.0) or is_rising
    
    return bool(is_above_support and has_bounced)


# ==========================================
# MODULE 2: EMA Crossover (20 EMA > 50 EMA)
# ==========================================
def module_2_ema_crossover(df: pd.DataFrame, short_span: int = 20, long_span: int = 50) -> bool:
    """
    Module 2: EMA Crossover
    Bullish momentum confirmation when short-term EMA > medium-term EMA.
    """
    df = sanitize_dataframe(df)
    if len(df) < long_span + 2:
        return False
    
    ema_20 = calc_ema(df["Close"], short_span)
    ema_50 = calc_ema(df["Close"], long_span)
    
    current_ema20 = float(ema_20.iloc[-1])
    current_ema50 = float(ema_50.iloc[-1])
    
    return bool(current_ema20 > current_ema50)


# ==========================================
# MODULE 3: Volume Spike (Current Vol > 2x 20-period Vol MA)
# ==========================================
def module_3_volume_spike(df: pd.DataFrame, window: int = 20, multiplier: float = 2.0) -> bool:
    """
    Module 3: Volume Spike
    Institutional accumulation signature: Current candle volume exceeds multiplier * MA.
    """
    df = sanitize_dataframe(df)
    if len(df) < window + 2:
        return False
    
    vol_ma = df["Volume"].rolling(window=window).mean()
    current_vol = float(df["Volume"].iloc[-1])
    prev_ma = float(vol_ma.iloc[-1])
    
    if prev_ma <= 0:
        return False
    
    return bool(current_vol >= multiplier * prev_ma)


# ==========================================
# MODULE 4: VWAP Momentum (Price > VWAP)
# ==========================================
def module_4_vwap_momentum(df: pd.DataFrame, window: int = 20) -> bool:
    """
    Module 4: VWAP Momentum
    Volume-Weighted Average Price benchmark over rolling session window.
    """
    df = sanitize_dataframe(df)
    if len(df) < 5:
        return False
    
    typical_price = (df["High"] + df["Low"] + df["Close"]) / 3.0
    vol = df["Volume"].replace(0, np.nan).ffill().fillna(1.0)
    
    tp_vol = typical_price * vol
    rolling_window = min(len(df), max(5, window))
    vwap_series = tp_vol.rolling(window=rolling_window).sum() / vol.rolling(window=rolling_window).sum()
    
    current_close = float(df["Close"].iloc[-1])
    current_vwap = float(vwap_series.iloc[-1])
    
    return bool(current_close > current_vwap)


# ==========================================
# MODULE 5: Bollinger Band Breakout (Close > Upper Band)
# ==========================================
def module_5_bollinger_breakout(df: pd.DataFrame, window: int = 20, window_dev: float = 2.0) -> bool:
    """
    Module 5: Bollinger Band Breakout
    Volatility expansion: Close exceeding upper N-std dev band.
    """
    df = sanitize_dataframe(df)
    if len(df) < window + 2:
        return False
    
    upper_band = calc_bollinger_hband(df["Close"], window=window, window_dev=window_dev)
    current_close = float(df["Close"].iloc[-1])
    current_upper = float(upper_band.iloc[-1])
    
    return bool(current_close >= current_upper)


# ==========================================
# MODULE 6: Pivot Point Bounce (Price near Support 1)
# ==========================================
def module_6_pivot_point_bounce(df: pd.DataFrame, tolerance_pct: float = 0.015) -> bool:
    """
    Module 6: Pivot Point Bounce
    Classic Floor Trader Pivot calculation from previous session:
    Pivot (PP) = (High[-2] + Low[-2] + Close[-2]) / 3
    Support 1 (S1) = 2 * PP - High[-2]
    
    Bounce condition:
    The low tested S1 (within tolerance) and price rebounded to close above S1,
    or current close is within 1.5% of S1 showing support absorption.
    """
    df = sanitize_dataframe(df)
    if len(df) < 3:
        return False
    
    prev_high = float(df["High"].iloc[-2])
    prev_low = float(df["Low"].iloc[-2])
    prev_close = float(df["Close"].iloc[-2])
    
    pp = (prev_high + prev_low + prev_close) / 3.0
    s1 = (2.0 * pp) - prev_high
    
    curr_low = float(df["Low"].iloc[-1])
    curr_close = float(df["Close"].iloc[-1])
    curr_open = float(df["Open"].iloc[-1])
    
    low_near_s1 = curr_low <= s1 * (1.0 + tolerance_pct)
    close_above_or_near_s1 = curr_close >= s1 * (1.0 - (tolerance_pct * 0.5))
    green_or_reversal = curr_close >= curr_open or (curr_close - curr_low) > (prev_high - prev_low) * 0.2
    
    return bool(low_near_s1 and close_above_or_near_s1 and green_or_reversal)


# ==========================================
# MODULE 7: MACD Histogram Positive Shift
# ==========================================
def module_7_macd_positive_shift(df: pd.DataFrame, fast: int = 12, slow: int = 26, signal_span: int = 9) -> bool:
    """
    Module 7: MACD Histogram Positive Shift
    MACD Histogram = MACD Line - Signal Line.
    Signal triggers when histogram is positive (>0) and expands upward
    or flips from negative into positive territory.
    """
    df = sanitize_dataframe(df)
    if len(df) < slow + signal_span + 2:
        return False
    
    macd_diff = calc_macd_diff(df["Close"], fast=fast, slow=slow, signal=signal_span)
    curr_hist = float(macd_diff.iloc[-1])
    prev_hist = float(macd_diff.iloc[-2])
    
    is_positive = curr_hist > 0
    is_accelerating = curr_hist >= prev_hist
    is_flip = curr_hist > 0 and prev_hist <= 0
    
    return bool(is_positive and (is_accelerating or is_flip))


# ==========================================
# MODULE 8: Supertrend Bullish (Supertrend Green)
# ==========================================
def compute_supertrend(df: pd.DataFrame, period: int = 10, multiplier: float = 3.0) -> Tuple[pd.Series, pd.Series]:
    """
    Classic ATR Supertrend indicator.
    Returns (supertrend_values, direction_series)
    direction: 1 for Green (Bullish), -1 for Red (Bearish)
    """
    high = df["High"].values
    low = df["Low"].values
    close = df["Close"].values
    n = len(df)
    
    atr = calc_atr(df["High"], df["Low"], df["Close"], window=period).values
    
    hl2 = (high + low) / 2.0
    basic_ub = hl2 + (multiplier * atr)
    basic_lb = hl2 - (multiplier * atr)
    
    final_ub = np.zeros(n)
    final_lb = np.zeros(n)
    supertrend = np.zeros(n)
    direction = np.zeros(n)
    
    for i in range(1, n):
        # Final Upper Band
        if basic_ub[i] < final_ub[i - 1] or close[i - 1] > final_ub[i - 1]:
            final_ub[i] = basic_ub[i]
        else:
            final_ub[i] = final_ub[i - 1]
            
        # Final Lower Band
        if basic_lb[i] > final_lb[i - 1] or close[i - 1] < final_lb[i - 1]:
            final_lb[i] = basic_lb[i]
        else:
            final_lb[i] = final_lb[i - 1]
            
        # Direction & Supertrend
        if i == 1:
            direction[i] = 1 if close[i] > final_ub[i] else -1
        else:
            if direction[i - 1] == 1:
                direction[i] = -1 if close[i] < final_lb[i] else 1
            else:
                direction[i] = 1 if close[i] > final_ub[i] else -1
                
        supertrend[i] = final_lb[i] if direction[i] == 1 else final_ub[i]
        
    return pd.Series(supertrend, index=df.index), pd.Series(direction, index=df.index)


def module_8_supertrend_bullish(df: pd.DataFrame, period: int = 10, multiplier: float = 3.0) -> bool:
    """
    Module 8: Supertrend Bullish
    Returns True if Supertrend is currently GREEN (direction = 1).
    """
    df = sanitize_dataframe(df)
    if len(df) < period + 5:
        return False
    
    _, direction = compute_supertrend(df, period=period, multiplier=multiplier)
    curr_dir = int(direction.iloc[-1])
    
    return curr_dir == 1


# ==========================================
# MODULE 9: Fibonacci Golden Pocket Retracement
# ==========================================
def module_9_fibonacci_golden_pocket(df: pd.DataFrame, lookback: int = 30) -> bool:
    """
    Module 9: Fibonacci Golden Pocket Retracement Check
    Golden Pocket Zone: [High - 0.65 * Range, High - 0.50 * Range]
    Returns True if current price is holding / bouncing out of the Golden Pocket zone.
    """
    df = sanitize_dataframe(df)
    if len(df) < lookback:
        lookback = max(5, len(df))
    
    recent_df = df.iloc[-lookback:]
    swing_high = float(recent_df["High"].max())
    swing_low = float(recent_df["Low"].min())
    swing_range = swing_high - swing_low
    
    if swing_range <= 0:
        return False
    
    fib_50 = swing_high - (0.50 * swing_range)
    fib_65 = swing_high - (0.65 * swing_range)
    
    curr_close = float(df["Close"].iloc[-1])
    curr_low = float(df["Low"].iloc[-1])
    
    tested_pocket = curr_low <= fib_50 and curr_low >= fib_65 * 0.985
    holding_above = curr_close >= fib_65
    
    return bool(tested_pocket and holding_above)


# ==========================================
# MODULE 10: Opening Range / Price Action Breakout
# ==========================================
def module_10_opening_range_breakout(df: pd.DataFrame, lookback: int = 15) -> bool:
    """
    Module 10: Opening Range / Price Action Breakout Filter
    Detects when current price creates a confirmed breakout above the
    highest high of the prior N periods with strong green candle close.
    """
    df = sanitize_dataframe(df)
    if len(df) < lookback + 2:
        return False
    
    prior_highs = df["High"].iloc[-(lookback + 1):-1]
    prior_max = float(prior_highs.max())
    
    curr_close = float(df["Close"].iloc[-1])
    curr_open = float(df["Open"].iloc[-1])
    
    is_breakout = curr_close > prior_max
    is_bullish_candle = curr_close > curr_open
    
    return bool(is_breakout and is_bullish_candle)


# ==========================================
# CONSENSUS ENGINE: MASTER EVALUATOR
# ==========================================
# ==========================================
# DEFAULT STRATEGY & MODULE CONFIGURATION
# ==========================================
DEFAULT_RULES = {
    # Consensus Decision Thresholds
    "buy_threshold": 6,
    "exit_threshold": 6,
    
    # Module 1: RSI Range-Shift
    "rsi_window": 14,
    "rsi_floor": 40.0,
    "rsi_ceiling": 75.0,
    
    # Module 2: EMA Crossover
    "ema_fast": 20,
    "ema_slow": 50,
    
    # Module 3: Volume Spike
    "vol_window": 20,
    "vol_multiplier": 2.0,
    
    # Module 4: VWAP Momentum
    "vwap_window": 20,
    
    # Module 5: Bollinger Band Breakout
    "bb_window": 20,
    "bb_dev": 2.0,
    
    # Module 6: Pivot Point Bounce
    "pivot_tolerance": 0.015,
    
    # Module 7: MACD Histogram Shift
    "macd_fast": 12,
    "macd_slow": 26,
    "macd_signal": 9,
    
    # Module 8: Supertrend Bullish
    "supertrend_period": 10,
    "supertrend_mult": 3.0,
    
    # Module 9: Fibonacci Golden Pocket
    "fib_lookback": 30,
    "fib_ratio_low": 0.50,
    "fib_ratio_high": 0.65,
    
    # Module 10: Price Action Breakout
    "breakout_lookback": 15,
    
    # Module Active Toggles
    "enabled_modules": {i: True for i in range(1, 11)},
}


def evaluate_stock_consensus(df: pd.DataFrame, custom_rules: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Evaluates all 10 master consensus modules using user-configured or institutional default rules.
    Returns consensus score, breakdown matrix, weighted confidence, and algorithmic decision.
    """
    rules = DEFAULT_RULES.copy()
    if custom_rules:
        rules.update(custom_rules)
        
    enabled_map = rules.get("enabled_modules", {i: True for i in range(1, 11)})
    
    # Dynamically build modules with configured parameters
    module_definitions = [
        {
            "id": 1,
            "name": "RSI Range-Shift",
            "category": "Momentum",
            "description": f"RSI({rules['rsi_window']}) rebounding above {rules['rsi_floor']:.0f} floor",
            "weight": 1.0,
            "func": lambda d: module_1_rsi_range_shift(
                d, window=rules["rsi_window"], floor=rules["rsi_floor"], ceiling=rules["rsi_ceiling"]
            )
        },
        {
            "id": 2,
            "name": "EMA Crossover",
            "category": "Trend",
            "description": f"{rules['ema_fast']} EMA > {rules['ema_slow']} EMA Structural Uptrend",
            "weight": 1.2,
            "func": lambda d: module_2_ema_crossover(
                d, short_span=rules["ema_fast"], long_span=rules["ema_slow"]
            )
        },
        {
            "id": 3,
            "name": "Volume Spike",
            "category": "Liquidity",
            "description": f"Current Volume > {rules['vol_multiplier']}x {rules['vol_window']}-MA",
            "weight": 1.2,
            "func": lambda d: module_3_volume_spike(
                d, window=rules["vol_window"], multiplier=rules["vol_multiplier"]
            )
        },
        {
            "id": 4,
            "name": "VWAP Momentum",
            "category": "Intraday/Value",
            "description": f"Close > Rolling {rules['vwap_window']}-period VWAP",
            "weight": 1.0,
            "func": lambda d: module_4_vwap_momentum(
                d, window=rules["vwap_window"]
            )
        },
        {
            "id": 5,
            "name": "Bollinger Breakout",
            "category": "Volatility",
            "description": f"Close > Upper {rules['bb_dev']:.1f}σ Band ({rules['bb_window']})",
            "weight": 0.9,
            "func": lambda d: module_5_bollinger_breakout(
                d, window=rules["bb_window"], window_dev=rules["bb_dev"]
            )
        },
        {
            "id": 6,
            "name": "Pivot Point Bounce",
            "category": "Key Levels",
            "description": f"Price testing & bouncing near Support 1 (±{rules['pivot_tolerance']*100:.1f}%)",
            "weight": 0.8,
            "func": lambda d: module_6_pivot_point_bounce(
                d, tolerance_pct=rules["pivot_tolerance"]
            )
        },
        {
            "id": 7,
            "name": "MACD Histogram Shift",
            "category": "Momentum",
            "description": f"MACD({rules['macd_fast']},{rules['macd_slow']},{rules['macd_signal']}) Hist positive & accelerating",
            "weight": 1.0,
            "func": lambda d: module_7_macd_positive_shift(
                d, fast=rules["macd_fast"], slow=rules["macd_slow"], signal_span=rules["macd_signal"]
            )
        },
        {
            "id": 8,
            "name": "Supertrend Bullish",
            "category": "Trend",
            "description": f"ATR Supertrend ({rules['supertrend_period']}, {rules['supertrend_mult']}) GREEN",
            "weight": 1.2,
            "func": lambda d: module_8_supertrend_bullish(
                d, period=rules["supertrend_period"], multiplier=rules["supertrend_mult"]
            )
        },
        {
            "id": 9,
            "name": "Fibonacci Golden Pocket",
            "category": "Key Levels",
            "description": f"Holding {rules['fib_ratio_low']*100:.0f}%-{rules['fib_ratio_high']*100:.0f}% Retracement Corridor",
            "weight": 0.9,
            "func": lambda d: module_9_fibonacci_golden_pocket(
                d, lookback=rules["fib_lookback"]
            )
        },
        {
            "id": 10,
            "name": "Price Action Breakout",
            "category": "Breakout",
            "description": f"Confirmed Breakout above prior {rules['breakout_lookback']}-bar High",
            "weight": 1.0,
            "func": lambda d: module_10_opening_range_breakout(
                d, lookback=rules["breakout_lookback"]
            )
        },
    ]

    results = []
    total_passed = 0
    total_active_modules = 0
    total_weight = 0.0
    passed_weight = 0.0

    for mod in module_definitions:
        mod_id = mod["id"]
        is_enabled = enabled_map.get(mod_id, True)
        
        if not is_enabled:
            results.append({
                "id": mod_id,
                "name": mod["name"],
                "category": mod["category"],
                "description": mod["description"] + " [DISABLED BY USER]",
                "weight": 0.0,
                "status": "DISABLED",
                "passed": False,
            })
            continue

        total_active_modules += 1
        weight = mod["weight"]
        total_weight += weight

        try:
            signal = bool(mod["func"](df))
        except Exception:
            signal = False

        if signal:
            total_passed += 1
            passed_weight += weight

        results.append({
            "id": mod_id,
            "name": mod["name"],
            "category": mod["category"],
            "description": mod["description"],
            "weight": weight,
            "status": "PASS" if signal else "FAIL",
            "passed": signal,
        })

    active_count = max(1, total_active_modules)
    score_pct = (total_passed / active_count) * 100.0
    weighted_pct = (passed_weight / total_weight) * 100.0 if total_weight > 0 else 0.0

    buy_thresh = rules.get("buy_threshold", 6)
    exit_thresh = rules.get("exit_threshold", 6)

    # Dynamic Decision Matrix using user-configured thresholds
    if total_passed >= buy_thresh + 1:
        action = "STRONG BUY"
        bias = "STRONGLY BULLISH"
        color = "#10b981"
    elif total_passed >= buy_thresh:
        action = "BUY / ACCUMULATE"
        bias = "MODERATELY BULLISH"
        color = "#34d399"
    elif total_passed >= exit_thresh:
        action = "NEUTRAL / HOLD"
        bias = "CHOPPY / INDECISIVE"
        color = "#f59e0b"
    else:
        action = "SELL / EXIT TRIGGERED"
        bias = "BEARISH REJECTION"
        color = "#ef4444"

    return {
        "score": total_passed,
        "total_modules": active_count,
        "score_pct": score_pct,
        "weighted_pct": weighted_pct,
        "action": action,
        "bias": bias,
        "color": color,
        "matrix": results,
        "buy_threshold": buy_thresh,
        "exit_threshold": exit_thresh,
    }

