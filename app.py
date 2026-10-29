"""
app.py - FinanceBro Main Algorithmic Trading Dashboard
Indian Stock Market Multi-Module Consensus & Paper Trading Platform
Header-Driven Layout • Universal Stock Scanner • Interactive Watchlist • Module Pass/Fail Inspector
"""

import datetime
from typing import Dict, Any, Optional, Tuple, List

import numpy as np
import pandas as pd
import streamlit as st
import streamlit.components.v1 as components
import yfinance as yf
import plotly.graph_objects as go
from plotly.subplots import make_subplots

from modules import evaluate_stock_consensus, sanitize_dataframe, calc_ema, calc_bollinger_hband, calc_bollinger_lband, DEFAULT_RULES

# ==========================================
# STREAMLIT PAGE CONFIG & SIDEBAR REMOVAL
# ==========================================
st.set_page_config(
    page_title="FinanceBro | NSE Multi-Module Consensus & Paper Trading",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# Custom High-Tech Dark Mode CSS (Sidebar completely hidden, sleek header toolbar)
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    code, pre, .mono-font {
        font-family: 'JetBrains Mono', monospace !important;
    }

    /* Completely hide sidebar and collapse toggle */
    [data-testid="stSidebar"], section[data-testid="stSidebar"] {
        display: none !important;
    }
    [data-testid="collapsedControl"] {
        display: none !important;
    }

    /* Main Container Background */
    .stApp {
        background: radial-gradient(circle at top right, #0f172a 0%, #070c18 100%);
        color: #f1f5f9;
    }

    .main .block-container {
        padding-top: 1.2rem;
        padding-bottom: 2.5rem;
        max-width: 98%;
    }

    /* Top Brand Container */
    .brand-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.5rem;
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.9) 100%);
        border: 1px solid rgba(56, 189, 248, 0.25);
        border-radius: 14px;
        backdrop-filter: blur(14px);
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
        margin-bottom: 1rem;
    }

    .brand-title {
        font-size: 1.8rem;
        font-weight: 800;
        background: linear-gradient(135deg, #38bdf8 0%, #10b981 50%, #818cf8 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0;
        letter-spacing: -0.5px;
    }

    .brand-tagline {
        color: #94a3b8;
        font-size: 0.8rem;
        margin-top: 2px;
    }

    /* Header Toolbar */
    .header-toolbar {
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(148, 163, 184, 0.15);
        border-radius: 12px;
        padding: 0.75rem 1.25rem;
        margin-bottom: 1.25rem;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }

    /* Metric Cards */
    .metric-card {
        background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
        border: 1px solid rgba(148, 163, 184, 0.15);
        border-radius: 12px;
        padding: 1rem 1.2rem;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
        transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .metric-card:hover {
        border-color: rgba(56, 189, 248, 0.4);
        transform: translateY(-2px);
    }

    .metric-label {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #94a3b8;
        margin-bottom: 0.35rem;
        font-weight: 600;
    }

    .metric-val {
        font-size: 1.5rem;
        font-weight: 700;
        color: #f8fafc;
        line-height: 1.2;
    }

    .metric-sub {
        font-size: 0.78rem;
        margin-top: 0.3rem;
        font-weight: 500;
    }

    /* Pass / Fail Chip Badges */
    .chip-pass {
        background: rgba(16, 185, 129, 0.18);
        color: #34d399;
        border: 1px solid rgba(16, 185, 129, 0.4);
        padding: 3px 9px;
        border-radius: 6px;
        font-size: 0.72rem;
        font-weight: 700;
        display: inline-block;
        margin: 2px;
    }

    .chip-fail {
        background: rgba(239, 68, 68, 0.18);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.4);
        padding: 3px 9px;
        border-radius: 6px;
        font-size: 0.72rem;
        font-weight: 700;
        display: inline-block;
        margin: 2px;
    }

    /* Terminal Console */
    .terminal-container {
        background: #020617;
        border: 1px solid #1e293b;
        border-radius: 10px;
        padding: 0.85rem;
        height: 220px;
        overflow-y: auto;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.78rem;
        color: #e2e8f0;
        box-shadow: inset 0 2px 8px rgba(0,0,0,0.6);
    }

    .log-line {
        padding: 2px 0;
        border-bottom: 1px dashed rgba(51, 65, 85, 0.4);
    }
    .log-time { color: #64748b; }
    .log-buy { color: #34d399; font-weight: 600; }
    .log-sell { color: #f87171; font-weight: 600; }
    .log-warn { color: #fbbf24; }
    .log-info { color: #38bdf8; }

    /* Stock Card in Watchlist */
    .stock-chip-card {
        background: #111827;
        border: 1px solid #1f2937;
        border-radius: 10px;
        padding: 0.65rem 0.9rem;
        margin-bottom: 0.5rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    .stock-chip-card:hover {
        border-color: #38bdf8;
        background: #1e293b;
    }
</style>
""", unsafe_allow_html=True)


# ==========================================
# EXTENSIVE NSE STOCK DATABASE (NIFTY 50 & LIQUID ASSETS)
# ==========================================
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


# ==========================================
# SESSION STATE INITIALIZATION
# ==========================================
if "wallet_balance" not in st.session_state:
    st.session_state.wallet_balance = 1000.0

if "initial_capital" not in st.session_state:
    st.session_state.initial_capital = 1000.0

if "active_position" not in st.session_state:
    st.session_state.active_position = None

if "trade_history" not in st.session_state:
    st.session_state.trade_history = []

if "simulation_logs" not in st.session_state:
    st.session_state.simulation_logs = [
        f"[{datetime.datetime.now().strftime('%H:%M:%S')}] FinanceBro Universal NSE Watchlist initialized."
    ]

if "selected_ticker" not in st.session_state:
    st.session_state.selected_ticker = "RELIANCE"

if "watchlist_cache" not in st.session_state:
    st.session_state.watchlist_cache = {}

if "custom_rules" not in st.session_state:
    st.session_state.custom_rules = DEFAULT_RULES.copy()

if "filter_affordable_only" not in st.session_state:
    st.session_state.filter_affordable_only = True


def add_log(message: str, level: str = "info"):
    timestamp = datetime.datetime.now().strftime("%H:%M:%S")
    st.session_state.simulation_logs.append(f"[{timestamp}] {message}")
    if len(st.session_state.simulation_logs) > 200:
        st.session_state.simulation_logs.pop(0)


# ==========================================
# FEE & BROKERAGE CALCULATION MODEL
# ==========================================
def calculate_charges(turnover: float) -> Tuple[float, Dict[str, float]]:
    brokerage = 20.0
    stt = turnover * 0.001
    exchange_fee = turnover * 0.0000345
    gst = (brokerage + exchange_fee) * 0.18
    stamp_duty = turnover * 0.00015
    sebi_fee = turnover * 0.000001
    
    total_charges = round(brokerage + stt + exchange_fee + gst + stamp_duty + sebi_fee, 2)
    breakdown = {
        "Brokerage (Flat)": brokerage,
        "STT": round(stt, 2),
        "GST & Exchange Fees": round(gst + exchange_fee, 2),
        "Stamp Duty & SEBI": round(stamp_duty + sebi_fee, 2),
    }
    return total_charges, breakdown


# ==========================================
# ADVANCED CANDLESTICK CHARTING (TRADINGVIEW & PLOTLY)
# ==========================================
def render_tradingview_candlestick(symbol: str, height: int = 460):
    """
    Renders the official TradingView / Groww advanced real-time candlestick terminal widget.
    Features: Live candles, volume, technical indicators, full range zoom/pan, crosshairs.
    """
    tv_symbol = symbol.replace(".NS", "")
    if not (tv_symbol.startswith("NSE:") or tv_symbol.startswith("BSE:")):
        if tv_symbol == "^NSEI":
            tv_symbol = "NSE:NIFTY"
        else:
            tv_symbol = f"NSE:{tv_symbol}"

    widget_html = f"""
    <div class="tradingview-widget-container" style="height:{height}px;width:100%;border-radius:12px;overflow:hidden;border:1px solid #1e293b;">
      <div id="tv_chart_container" style="height:100%;width:100%;"></div>
      <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
      <script type="text/javascript">
      new TradingView.widget({{
        "autosize": true,
        "symbol": "{tv_symbol}",
        "interval": "D",
        "timezone": "Asia/Kolkata",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "toolbar_bg": "#0b0f19",
        "enable_publishing": false,
        "hide_side_toolbar": false,
        "allow_symbol_change": true,
        "save_image": false,
        "studies": [
            "MASimple@tv-basicstudies",
            "RSI@tv-basicstudies",
            "BollingerBands@tv-basicstudies"
        ],
        "container_id": "tv_chart_container"
      }});
      </script>
    </div>
    """
    components.html(widget_html, height=height + 8)


def render_plotly_candlestick(df: pd.DataFrame, ticker: str, active_pos=None, height: int = 460):
    """
    Renders custom high-performance Plotly dark candlestick chart with:
    - Green (#089981) & Red (#f23645) candlestick bodies and wicks
    - Shaded Bollinger Band corridor
    - 20 EMA and 50 EMA lines
    - Volume subplot
    - Position Entry, Stop-Loss, and Target price levels
    """
    df_c = df.tail(60).copy()
    df_c["EMA_20"] = calc_ema(df_c["Close"], 20)
    df_c["EMA_50"] = calc_ema(df_c["Close"], 50)
    df_c["BB_Upper"] = calc_bollinger_hband(df_c["Close"], 20, 2)
    df_c["BB_Lower"] = calc_bollinger_lband(df_c["Close"], 20, 2)

    fig = make_subplots(
        rows=2, cols=1,
        shared_xaxes=True,
        vertical_spacing=0.03,
        row_heights=[0.75, 0.25]
    )

    # 1. Candlestick Trace
    fig.add_trace(
        go.Candlestick(
            x=df_c.index,
            open=df_c["Open"],
            high=df_c["High"],
            low=df_c["Low"],
            close=df_c["Close"],
            name=f"{ticker} OHLC",
            increasing_line_color="#089981",
            decreasing_line_color="#f23645",
            increasing_fillcolor="#089981",
            decreasing_fillcolor="#f23645",
            whiskerwidth=0.8,
        ),
        row=1, col=1
    )

    # 2. Bollinger Bands
    fig.add_trace(
        go.Scatter(
            x=df_c.index, y=df_c["BB_Lower"],
            line=dict(color="rgba(236, 72, 153, 0.4)", width=1, dash="dot"),
            name="Lower BB (2σ)",
            hoverinfo="skip"
        ),
        row=1, col=1
    )
    fig.add_trace(
        go.Scatter(
            x=df_c.index, y=df_c["BB_Upper"],
            line=dict(color="rgba(236, 72, 153, 0.6)", width=1, dash="dot"),
            fill="tonexty",
            fillcolor="rgba(236, 72, 153, 0.08)",
            name="Upper BB (2σ)"
        ),
        row=1, col=1
    )

    # 3. 20 EMA & 50 EMA
    fig.add_trace(
        go.Scatter(
            x=df_c.index, y=df_c["EMA_20"],
            line=dict(color="#38bdf8", width=1.8),
            name="20 EMA"
        ),
        row=1, col=1
    )
    fig.add_trace(
        go.Scatter(
            x=df_c.index, y=df_c["EMA_50"],
            line=dict(color="#fbbf24", width=1.8),
            name="50 EMA"
        ),
        row=1, col=1
    )

    # 4. Position Lines
    if active_pos and active_pos["ticker"] == ticker:
        ep = active_pos["entry_price"]
        sl = active_pos["stop_loss"]
        tp = active_pos["target"]
        fig.add_hline(y=ep, line_dash="dash", line_color="#34d399", line_width=1.5,
                      annotation_text=f"Entry: ₹{ep:,.1f}", annotation_position="top left", row=1, col=1)
        fig.add_hline(y=sl, line_dash="dot", line_color="#ef4444", line_width=1.5,
                      annotation_text=f"Stop: ₹{sl:,.1f}", annotation_position="bottom left", row=1, col=1)
        fig.add_hline(y=tp, line_dash="dot", line_color="#38bdf8", line_width=1.5,
                      annotation_text=f"Target: ₹{tp:,.1f}", annotation_position="top right", row=1, col=1)

    # 5. Volume Subplot
    vol_colors = ["#089981" if c >= o else "#f23645" for c, o in zip(df_c["Close"], df_c["Open"])]
    fig.add_trace(
        go.Bar(
            x=df_c.index,
            y=df_c["Volume"],
            marker_color=vol_colors,
            name="Volume",
            opacity=0.75
        ),
        row=2, col=1
    )

    # 6. Dark Theme Styling
    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="#0c1222",
        plot_bgcolor="#0c1222",
        margin=dict(l=8, r=8, t=8, b=8),
        xaxis=dict(
            rangeslider=dict(visible=False),
            showgrid=True,
            gridcolor="rgba(30, 41, 59, 0.6)"
        ),
        xaxis2=dict(
            showgrid=True,
            gridcolor="rgba(30, 41, 59, 0.4)"
        ),
        yaxis=dict(
            showgrid=True,
            gridcolor="rgba(30, 41, 59, 0.6)",
            side="right",
            title=dict(text="Price (₹)", font=dict(size=11, color="#94a3b8"))
        ),
        yaxis2=dict(
            showgrid=False,
            side="right",
            title=dict(text="Vol", font=dict(size=10, color="#94a3b8"))
        ),
        height=height,
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="left",
            x=0.01,
            font=dict(size=10, color="#cbd5e1"),
            bgcolor="rgba(15, 23, 42, 0.8)"
        ),
        hovermode="x unified"
    )

    st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": True})


# ==========================================
# DATA INGESTION & SCANNER ENGINE
# ==========================================
def generate_fallback_data(symbol: str, period_days: int = 60) -> pd.DataFrame:
    np.random.seed(abs(hash(symbol)) % 100000)
    base_price = 2850.0 if "RELIANCE" in symbol else (4100.0 if "TCS" in symbol else 800.0)
    dates = pd.date_range(end=pd.Timestamp.now(), periods=period_days, freq="B")
    
    returns = np.random.normal(0.0015, 0.016, len(dates))
    price_series = base_price * np.cumprod(1 + returns)
    
    high = price_series * (1 + np.random.uniform(0.002, 0.018, len(dates)))
    low = price_series * (1 - np.random.uniform(0.002, 0.018, len(dates)))
    open_p = low + (high - low) * np.random.uniform(0.2, 0.8, len(dates))
    close = low + (high - low) * np.random.uniform(0.2, 0.8, len(dates))
    vol = np.random.randint(500000, 4500000, len(dates))
    
    # Inject realistic volume surge on last candle
    vol[-1] = int(vol[-20:].mean() * 2.5)
    close[-1] = high[-1] * 0.996
    
    df = pd.DataFrame({
        "Open": open_p,
        "High": high,
        "Low": low,
        "Close": close,
        "Volume": vol
    }, index=dates)
    return df


@st.cache_data(ttl=120, show_spinner=False)
def fetch_stock_data(symbol: str, period: str = "3mo", interval: str = "1d") -> Tuple[pd.DataFrame, bool]:
    is_live = False
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period, interval=interval)
        if df is not None and len(df) >= 20:
            df = sanitize_dataframe(df)
            is_live = True
            return df, is_live
    except Exception:
        pass
    
    # Resilient fallback
    df = generate_fallback_data(symbol)
    return df, False


def scan_single_stock(item: Dict[str, str], timeframe: str, custom_rules: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    ticker = item["ticker"]
    symbol = item["symbol"]
    df, is_live = fetch_stock_data(symbol, period="3mo", interval=timeframe)
    curr_price = float(df["Close"].iloc[-1])
    prev_close = float(df["Close"].iloc[-2])
    chg = curr_price - prev_close
    chg_pct = (chg / prev_close) * 100.0
    
    rules = custom_rules or st.session_state.get("custom_rules", DEFAULT_RULES)
    consensus = evaluate_stock_consensus(df, custom_rules=rules)
    
    passed_names = [m["name"] for m in consensus["matrix"] if m["passed"]]
    failed_names = [m["name"] for m in consensus["matrix"] if not m["passed"]]
    
    return {
        "ticker": ticker,
        "symbol": symbol,
        "name": item["name"],
        "sector": item["sector"],
        "price": curr_price,
        "change": chg,
        "change_pct": chg_pct,
        "score": consensus["score"],
        "score_pct": consensus["score_pct"],
        "total_modules": consensus["total_modules"],
        "action": consensus["action"],
        "bias": consensus["bias"],
        "color": consensus["color"],
        "matrix": consensus["matrix"],
        "passed_modules": passed_names,
        "failed_modules": failed_names,
        "is_live": is_live,
        "df": df
    }


# ==========================================
# 1. TOP BRAND HEADER
# ==========================================
st.markdown(f"""
<div class="brand-container">
    <div>
        <h1 class="brand-title">FinanceBro</h1>
        <div class="brand-tagline">NSE Universal Technical Consensus Engine & Paper Trading Terminal</div>
    </div>
    <div style="text-align: right; display: flex; gap: 15px; align-items: center;">
        <div style="text-align: right;">
            <div style="font-size: 0.85rem; font-weight: 700; color: #38bdf8;">NSE INDIA MARKET</div>
            <div style="font-size: 0.72rem; color: #94a3b8;">{datetime.datetime.now().strftime('%d %b %Y | %H:%M:%S')}</div>
        </div>
        <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #34d399; 
                    padding: 4px 12px; border-radius: 8px; font-weight: 700; font-size: 0.78rem;">
            🟢 PAPER TRADING ACTIVE
        </div>
    </div>
</div>
""", unsafe_allow_html=True)


# ==========================================
# 2. TOP HEADER TOOLBAR CONTROLS (REPLACED SIDEBAR)
# ==========================================
with st.container():
    col_t1, col_t2, col_t3, col_t4, col_t5, col_t6 = st.columns([1.3, 0.9, 1.2, 1.3, 1.3, 0.9])
    
    with col_t1:
        wallet_cap = st.number_input(
            "Wallet Capital (₹)",
            min_value=100.0,
            max_value=10000000.0,
            value=float(st.session_state.initial_capital),
            step=500.0,
            key="header_wallet_capital"
        )
        if wallet_cap != st.session_state.initial_capital:
            st.session_state.initial_capital = wallet_cap
            if st.session_state.active_position is None and len(st.session_state.trade_history) == 0:
                st.session_state.wallet_balance = wallet_cap
                add_log(f"Wallet balance updated to ₹{wallet_cap:,.2f}", "info")

    with col_t2:
        timeframe = st.selectbox(
            "Timeframe",
            options=["1d", "1h", "15m", "5m"],
            index=0,
            key="header_timeframe"
        )

    with col_t3:
        paper_mode = st.toggle("Paper Mode (Dry Run)", value=True, key="header_paper_mode")

    with col_t4:
        auto_exit = st.toggle("Auto-Exit (<6 Bearish)", value=True, key="header_auto_exit")

    with col_t5:
        st.markdown("<div style='height: 28px;'></div>", unsafe_allow_html=True)
        scan_all_btn = st.button("🚀 Scan All 40+ Stocks", use_container_width=True, type="primary")

    with col_t6:
        st.markdown("<div style='height: 28px;'></div>", unsafe_allow_html=True)
        if st.button("🔄 Reset", use_container_width=True, help="Reset wallet capital and ledger"):
            st.session_state.wallet_balance = st.session_state.initial_capital
            st.session_state.active_position = None
            st.session_state.trade_history = []
            add_log("Wallet and simulation state reset to defaults.", "warn")
            st.rerun()


# ==========================================
# 2.5 CUSTOM RULE & PARAMETER CONFIGURATOR
# ==========================================
with st.expander("⚙️ Customize Consensus Rules & Module Parameters (Click to Edit)", expanded=False):
    st.markdown("##### 🛠️ Tailor Algorithmic Consensus Logic & Thresholds")
    rule_tab1, rule_tab2, rule_tab3 = st.tabs([
        "🎯 Consensus & Auto-Exit Triggers",
        "📈 Trend & Momentum Indicators",
        "📊 Volatility, Levels & Breakouts"
    ])
    
    with rule_tab1:
        c_r1, c_r2 = st.columns(2)
        with c_r1:
            new_buy_thresh = st.slider(
                "Buy Threshold (Votes required for Buy/Accumulate)",
                min_value=3, max_value=10,
                value=int(st.session_state.custom_rules["buy_threshold"]),
                help="Minimum number of passing modules to confirm Buy/Accumulate action."
            )
        with c_r2:
            new_exit_thresh = st.slider(
                "Auto-Sell Exit Threshold (Bearish trigger if votes < N)",
                min_value=2, max_value=8,
                value=int(st.session_state.custom_rules["exit_threshold"]),
                help="Automated exit is enforced when active position votes drop below this value."
            )
        
        st.markdown("###### Toggle Individual Modules Active/Inactive:")
        m_cols = st.columns(5)
        new_enabled = {}
        mod_labels = [
            "RSI Range", "EMA Cross", "Vol Spike", "VWAP Mom", "BB Break",
            "Pivot Bounce", "MACD Shift", "Supertrend", "Fib Pocket", "PA Break"
        ]
        for idx in range(1, 11):
            with m_cols[(idx - 1) % 5]:
                cur_en = st.session_state.custom_rules.get("enabled_modules", {}).get(idx, True)
                new_enabled[idx] = st.checkbox(f"#{idx} {mod_labels[idx-1]}", value=cur_en, key=f"mod_en_{idx}")
                
    with rule_tab2:
        c_p1, c_p2, c_p3 = st.columns(3)
        with c_p1:
            st.markdown("<b>Module 1: RSI Range-Shift</b>", unsafe_allow_html=True)
            new_rsi_win = st.number_input("RSI Window", 5, 50, int(st.session_state.custom_rules["rsi_window"]))
            new_rsi_floor = st.number_input("RSI Bullish Floor", 20.0, 60.0, float(st.session_state.custom_rules["rsi_floor"]), step=1.0)
            new_rsi_ceiling = st.number_input("RSI Ceiling", 60.0, 90.0, float(st.session_state.custom_rules["rsi_ceiling"]), step=1.0)
        with c_p2:
            st.markdown("<b>Module 2: EMA Crossover</b>", unsafe_allow_html=True)
            new_ema_fast = st.number_input("Fast EMA Span", 5, 50, int(st.session_state.custom_rules["ema_fast"]))
            new_ema_slow = st.number_input("Slow EMA Span", 20, 200, int(st.session_state.custom_rules["ema_slow"]))
            st.markdown("<b>Module 4: VWAP Period</b>", unsafe_allow_html=True)
            new_vwap_win = st.number_input("VWAP Window", 5, 100, int(st.session_state.custom_rules["vwap_window"]))
        with c_p3:
            st.markdown("<b>Module 7: MACD Spans</b>", unsafe_allow_html=True)
            new_macd_fast = st.number_input("MACD Fast", 5, 30, int(st.session_state.custom_rules["macd_fast"]))
            new_macd_slow = st.number_input("MACD Slow", 15, 60, int(st.session_state.custom_rules["macd_slow"]))
            new_macd_sig = st.number_input("MACD Signal", 3, 20, int(st.session_state.custom_rules["macd_signal"]))
            st.markdown("<b>Module 8: Supertrend</b>", unsafe_allow_html=True)
            new_st_per = st.number_input("Supertrend ATR Period", 5, 30, int(st.session_state.custom_rules["supertrend_period"]))
            new_st_mult = st.number_input("Supertrend Multiplier", 1.0, 6.0, float(st.session_state.custom_rules["supertrend_mult"]), step=0.5)

    with rule_tab3:
        c_v1, c_v2 = st.columns(2)
        with c_v1:
            st.markdown("<b>Module 3: Volume Spike</b>", unsafe_allow_html=True)
            new_vol_win = st.number_input("Volume MA Window", 5, 50, int(st.session_state.custom_rules["vol_window"]))
            new_vol_mult = st.number_input("Volume Multiplier (e.g. 2.0x)", 1.1, 5.0, float(st.session_state.custom_rules["vol_multiplier"]), step=0.1)
            st.markdown("<b>Module 5: Bollinger Bands</b>", unsafe_allow_html=True)
            new_bb_win = st.number_input("BB Window", 5, 50, int(st.session_state.custom_rules["bb_window"]))
            new_bb_dev = st.number_input("BB Std Dev (σ)", 1.0, 4.0, float(st.session_state.custom_rules["bb_dev"]), step=0.1)
        with c_v2:
            st.markdown("<b>Module 6: Pivot Points</b>", unsafe_allow_html=True)
            new_piv_tol = st.number_input("Support Bounce Tolerance (%)", 0.1, 5.0, float(st.session_state.custom_rules["pivot_tolerance"] * 100.0), step=0.1) / 100.0
            st.markdown("<b>Module 9: Fibonacci Golden Zone</b>", unsafe_allow_html=True)
            new_fib_lb = st.number_input("Fib Swing Lookback", 10, 100, int(st.session_state.custom_rules["fib_lookback"]))
            st.markdown("<b>Module 10: Price Action Breakout</b>", unsafe_allow_html=True)
            new_bo_lb = st.number_input("Breakout Lookback Bars", 5, 50, int(st.session_state.custom_rules["breakout_lookback"]))

    col_r_save, col_r_reset = st.columns([1.5, 1.5])
    with col_r_save:
        if st.button("💾 Apply & Re-Evaluate Rules", type="primary", use_container_width=True):
            st.session_state.custom_rules.update({
                "buy_threshold": new_buy_thresh,
                "exit_threshold": new_exit_thresh,
                "enabled_modules": new_enabled,
                "rsi_window": new_rsi_win,
                "rsi_floor": new_rsi_floor,
                "rsi_ceiling": new_rsi_ceiling,
                "ema_fast": new_ema_fast,
                "ema_slow": new_ema_slow,
                "vwap_window": new_vwap_win,
                "vol_window": new_vol_win,
                "vol_multiplier": new_vol_mult,
                "bb_window": new_bb_win,
                "bb_dev": new_bb_dev,
                "pivot_tolerance": new_piv_tol,
                "macd_fast": new_macd_fast,
                "macd_slow": new_macd_slow,
                "macd_signal": new_macd_sig,
                "supertrend_period": new_st_per,
                "supertrend_mult": new_st_mult,
                "fib_lookback": new_fib_lb,
                "breakout_lookback": new_bo_lb,
            })
            st.session_state.watchlist_cache = {}
            add_log(f"Custom rules saved! Buy: ≥{new_buy_thresh}, Exit: <{new_exit_thresh}.", "info")
            st.toast("Custom Strategy Rules Applied! Re-scanning stocks...", icon="⚙️")
            st.rerun()

    with col_r_reset:
        if st.button("🔄 Reset Rules to Defaults", use_container_width=True):
            st.session_state.custom_rules = DEFAULT_RULES.copy()
            st.session_state.watchlist_cache = {}
            add_log("Rules reset to institutional defaults.", "warn")
            st.toast("Rules reset to institutional defaults.", icon="🔄")
            st.rerun()


# ==========================================
# 3. UNIVERSAL SEARCH BAR & QUICK FILTERS
# ==========================================
st.markdown("<div style='margin-top: 0.6rem;'></div>", unsafe_allow_html=True)

col_search1, col_filter, col_sort = st.columns([2.2, 1.4, 1.2])

all_known_tickers = [item["ticker"] for item in MASTER_NSE_STOCKS]

with col_search1:
    search_query = st.selectbox(
        "🔍 Search Any Stock (Type ticker or name e.g., RELIANCE, TCS, ZOMATO, HAL, IRFC, WIPRO...):",
        options=[""] + all_known_tickers,
        format_func=lambda x: f"🔍 {x} - {NSE_DICT[x]['name']} ({NSE_DICT[x]['sector']})" if x in NSE_DICT else ("Type to search stock..." if x == "" else x),
        help="Select or search any NSE listed stock to inspect its passed/failed modules immediately.",
        key="universal_search_box"
    )

with col_filter:
    b_th = st.session_state.custom_rules.get("buy_threshold", 6)
    e_th = st.session_state.custom_rules.get("exit_threshold", 6)
    filter_choice = st.selectbox(
        "⚡ Filter Watchlist Consensus:",
        options=[
            "All Stocks",
            f"💸 Affordable Only (≤ ₹{st.session_state.wallet_balance:,.0f})",
            f"🔥 Strong Buy (≥ {b_th + 1})",
            f"🟢 Buy (≥ {b_th})",
            "🟡 Neutral",
            f"🔴 Bearish (< {e_th})"
        ],
        index=0
    )

with col_sort:
    sort_choice = st.selectbox(
        "📊 Sort Watchlist By:",
        options=["Score (High to Low)", "Change % (Top Gainers)", "Price (High to Low)", "Ticker (A-Z)"],
        index=0
    )

# If user chose a stock via search bar, immediately set it as the active inspected stock
if search_query and search_query.strip() != "":
    st.session_state.selected_ticker = search_query.strip()


# ==========================================
# 4. PRE-SCAN & CACHE WATCHLIST STOCKS
# ==========================================
# Pre-scan full universe so affordable stocks under ₹1000 are immediately available
if st.session_state.selected_ticker not in st.session_state.watchlist_cache or scan_all_btn or len(st.session_state.watchlist_cache) <= 1:
    target_stocks = MASTER_NSE_STOCKS
    for s_meta in target_stocks:
        try:
            st.session_state.watchlist_cache[s_meta["ticker"]] = scan_single_stock(s_meta, timeframe, custom_rules=st.session_state.custom_rules)
        except Exception:
            pass

# Also always ensure the selected ticker has data
if st.session_state.selected_ticker not in st.session_state.watchlist_cache:
    selected_meta = NSE_DICT.get(st.session_state.selected_ticker, {
        "ticker": st.session_state.selected_ticker,
        "symbol": f"{st.session_state.selected_ticker}.NS" if not st.session_state.selected_ticker.endswith(".NS") else st.session_state.selected_ticker,
        "name": st.session_state.selected_ticker,
        "sector": "NSE Equity"
    })
    st.session_state.watchlist_cache[st.session_state.selected_ticker] = scan_single_stock(selected_meta, timeframe, custom_rules=st.session_state.custom_rules)

active_stock_data = st.session_state.watchlist_cache[st.session_state.selected_ticker]
curr_inspect_price = active_stock_data["price"]


# ==========================================
# 5. AUTOMATED EXIT ENGINE CHECK
# ==========================================
if st.session_state.active_position and auto_exit:
    active_pos = st.session_state.active_position
    pos_ticker = active_pos["ticker"]
    
    # If we have scan data for the held stock, verify consensus using configured exit threshold
    if pos_ticker in st.session_state.watchlist_cache:
        pos_stock_data = st.session_state.watchlist_cache[pos_ticker]
        pos_score = pos_stock_data["score"]
        pos_curr_price = pos_stock_data["price"]
        configured_exit_thresh = st.session_state.custom_rules.get("exit_threshold", 6)
        
        # Rule: If votes drop below configured exit threshold, automated paper-sell order triggers!
        if pos_score < configured_exit_thresh:
            qty = active_pos["quantity"]
            sell_turnover = qty * pos_curr_price
            charges, _ = calculate_charges(sell_turnover)
            gross_pnl = (pos_curr_price - active_pos["entry_price"]) * qty
            net_pnl = gross_pnl - (active_pos["entry_fees"] + charges)
            
            st.session_state.wallet_balance += (sell_turnover - charges)
            
            trade_record = {
                "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
                "ticker": pos_ticker,
                "type": "SELL (AUTO EXIT)",
                "qty": qty,
                "entry_price": active_pos["entry_price"],
                "exit_price": pos_curr_price,
                "turnover": round(sell_turnover, 2),
                "fees": round(charges, 2),
                "pnl": round(net_pnl, 2),
                "reason": f"Consensus score dropped to {pos_score}/10 (< {configured_exit_thresh} Configured Threshold)",
                "balance_after": round(st.session_state.wallet_balance, 2)
            }
            st.session_state.trade_history.insert(0, trade_record)
            st.session_state.active_position = None
            
            add_log(
                f"🚨 AUTOMATED EXIT TRIGGERED for {pos_ticker}: Liquidated {qty} shares @ ₹{pos_curr_price:,.2f} | "
                f"Score: {pos_score}/10 (< {configured_exit_thresh}) | Net P&L: ₹{net_pnl:+,.2f}",
                "sell"
            )
            st.toast(f"Automated Exit: {pos_ticker} liquidated as consensus fell below {configured_exit_thresh}/10!", icon="⚠️")


# Calculate unrealized P&L
unrealized_pnl = 0.0
unrealized_pnl_pct = 0.0
if st.session_state.active_position:
    pos = st.session_state.active_position
    pos_ticker = pos["ticker"]
    pos_price = st.session_state.watchlist_cache.get(pos_ticker, {}).get("price", pos["entry_price"])
    gross_unrealized = (pos_price - pos["entry_price"]) * pos["quantity"]
    est_exit_charges, _ = calculate_charges(pos_price * pos["quantity"])
    unrealized_pnl = gross_unrealized - est_exit_charges
    unrealized_pnl_pct = (unrealized_pnl / (pos["entry_price"] * pos["quantity"])) * 100.0


# ==========================================
# 6. TOP METRIC CARDS
# ==========================================
col_m1, col_m2, col_m3, col_m4 = st.columns(4)

with col_m1:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-label">Total Wallet Balance</div>
        <div class="metric-val">₹{st.session_state.wallet_balance:,.2f}</div>
        <div class="metric-sub" style="color: {'#34d399' if st.session_state.wallet_balance >= st.session_state.initial_capital else '#f87171'};">
            {'+' if st.session_state.wallet_balance >= st.session_state.initial_capital else ''}₹{(st.session_state.wallet_balance - st.session_state.initial_capital):,.2f} 
            ({((st.session_state.wallet_balance - st.session_state.initial_capital)/st.session_state.initial_capital)*100:+.1f}%)
        </div>
    </div>
    """, unsafe_allow_html=True)

with col_m2:
    if st.session_state.active_position:
        pos = st.session_state.active_position
        pos_display = f"{pos['ticker']} ({pos['quantity']} sh)"
        pos_sub = f"Avg: ₹{pos['entry_price']:,.2f} | Stop: ₹{pos['stop_loss']:,.2f}"
        pos_sub_color = "#38bdf8"
    else:
        pos_display = "NO POSITION"
        pos_sub = "100% Cash Ready"
        pos_sub_color = "#94a3b8"

    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-label">Active Position</div>
        <div class="metric-val" style="font-size: 1.35rem; color: #38bdf8;">{pos_display}</div>
        <div class="metric-sub" style="color: {pos_sub_color};">{pos_sub}</div>
    </div>
    """, unsafe_allow_html=True)

with col_m3:
    pnl_color = "#34d399" if unrealized_pnl >= 0 else "#f87171"
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-label">Active Unrealized P&L</div>
        <div class="metric-val" style="color: {pnl_color};">
            {'+' if unrealized_pnl >= 0 else ''}₹{unrealized_pnl:,.2f}
        </div>
        <div class="metric-sub" style="color: {pnl_color};">
            {'+' if unrealized_pnl_pct >= 0 else ''}{unrealized_pnl_pct:.2f}% (net of all charges)
        </div>
    </div>
    """, unsafe_allow_html=True)

with col_m4:
    score = active_stock_data["score"]
    bias_color = active_stock_data["color"]
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-label">Selected: {active_stock_data['ticker']} Score</div>
        <div class="metric-val" style="color: {bias_color};">
            {score} / 10 <span style="font-size: 0.9rem; font-weight: 500;">({active_stock_data['score_pct']:.0f}%)</span>
        </div>
        <div class="metric-sub" style="color: {bias_color}; font-weight: 700;">
            {active_stock_data['bias']}
        </div>
    </div>
    """, unsafe_allow_html=True)

st.markdown("<div style='margin-bottom: 1rem;'></div>", unsafe_allow_html=True)


# ==========================================
# 7. MAIN 2-COLUMN VIEW: WATCHLIST & STOCK INSPECTOR
# ==========================================
col_watch, col_detail = st.columns([1.35, 1.65])

# ------------------------------------------
# LEFT COLUMN: FILTERED WATCHLIST
# ------------------------------------------
with col_watch:
    col_w_title, col_w_toggle = st.columns([1.4, 1.6])
    with col_w_title:
        st.markdown("#### 📋 Stock Watchlist")
    with col_w_toggle:
        filter_affordable_only = st.checkbox(
            f"💸 Only ≤ Wallet (≤ ₹{st.session_state.wallet_balance:,.0f})",
            value=st.session_state.get("filter_affordable_only", True),
            key="chk_filter_afford",
            help="When checked, only shows stocks priced below your current wallet capital."
        )
        st.session_state.filter_affordable_only = filter_affordable_only
    
    # Filter cached stocks
    raw_watchlist = list(st.session_state.watchlist_cache.values())
    
    filtered_list = []
    b_th = st.session_state.custom_rules.get("buy_threshold", 6)
    e_th = st.session_state.custom_rules.get("exit_threshold", 6)

    for item in raw_watchlist:
        # 1. Budget filter rule: If wallet balance is 1000, only show stocks below 1000rs!
        if filter_affordable_only and item["price"] > st.session_state.wallet_balance:
            continue
        if filter_choice.startswith("💸 Affordable") and item["price"] > st.session_state.wallet_balance:
            continue
            
        sc = item["score"]
        if "Strong Buy" in filter_choice and sc < (b_th + 1):
            continue
        if "Buy" in filter_choice and "Strong" not in filter_choice and sc < b_th:
            continue
        if "Neutral" in filter_choice and (sc < e_th or sc > b_th):
            continue
        if "Bearish" in filter_choice and sc >= e_th:
            continue
        filtered_list.append(item)
    
    # Sort
    if sort_choice == "Score (High to Low)":
        filtered_list.sort(key=lambda x: x["score"], reverse=True)
    elif sort_choice == "Change % (Top Gainers)":
        filtered_list.sort(key=lambda x: x["change_pct"], reverse=True)
    elif sort_choice == "Price (High to Low)":
        filtered_list.sort(key=lambda x: x["price"], reverse=True)
    elif sort_choice == "Ticker (A-Z)":
        filtered_list.sort(key=lambda x: x["ticker"])

    affordable_label = f" (Filtered to ≤ ₹{st.session_state.wallet_balance:,.0f})" if filter_affordable_only else ""
    st.markdown(f"<div style='font-size: 0.78rem; color: #94a3b8; margin-bottom: 8px;'>Showing <b>{len(filtered_list)}</b> stocks{affordable_label}. Click any stock to inspect chart & modules:</div>", unsafe_allow_html=True)

    # Render interactive stock rows
    for item in filtered_list:
        t_key = item["ticker"]
        is_selected = (t_key == st.session_state.selected_ticker)
        bg_col = "#1e293b" if is_selected else "#0f172a"
        border_col = "#38bdf8" if is_selected else "#1e293b"
        
        c_btn, c_info, c_score = st.columns([1.2, 1.8, 1.2])
        
        with c_btn:
            # Button to select
            if st.button(
                f"{'👉 ' if is_selected else ''}{t_key}",
                key=f"btn_stock_{t_key}",
                use_container_width=True,
                type="primary" if is_selected else "secondary"
            ):
                st.session_state.selected_ticker = t_key
                st.rerun()
                
        with c_info:
            chg_col = "#34d399" if item["change"] >= 0 else "#f87171"
            st.markdown(f"""
            <div style="font-size: 0.85rem; font-weight: 700; color: #f8fafc; padding-top: 5px;">
                ₹{item['price']:,.2f} 
                <span style="font-size: 0.72rem; color: {chg_col};">
                    {'+' if item['change'] >= 0 else ''}{item['change_pct']:+.2f}%
                </span>
            </div>
            """, unsafe_allow_html=True)
            
        with c_score:
            st.markdown(f"""
            <div style="text-align: right; padding-top: 5px;">
                <span style="background: {item['color']}22; color: {item['color']}; border: 1px solid {item['color']}66; 
                             font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 6px;">
                    {item['score']}/10 {item['action'].split()[0]}
                </span>
            </div>
            """, unsafe_allow_html=True)
            
        st.markdown("<div style='height: 1px; background: rgba(51, 65, 85, 0.3); margin: 3px 0;'></div>", unsafe_allow_html=True)

    # Watchlist Summary Table View Toggle
    with st.expander("📊 View Complete Scanned Matrix Table"):
        summary_table_rows = []
        for it in filtered_list:
            summary_table_rows.append({
                "Ticker": it["ticker"],
                "Name": it["name"],
                "Price (₹)": f"₹{it['price']:,.2f}",
                "Change %": f"{it['change_pct']:+.2f}%",
                "Consensus": f"{it['score']}/10",
                "Action": it["action"],
                "Passed": f"{len(it['passed_modules'])} modules",
                "Failed": f"{len(it['failed_modules'])} modules",
            })
        if summary_table_rows:
            st.dataframe(pd.DataFrame(summary_table_rows), hide_index=True, use_container_width=True)


# ------------------------------------------
# RIGHT COLUMN: SELECTED STOCK INSPECTOR (CHART + MODULES PASSED/FAILED + TRADE)
# ------------------------------------------
with col_detail:
    ins = active_stock_data
    ins_ticker = ins["ticker"]
    ins_price = ins["price"]
    
    # 1. Selected Asset Banner
    st.markdown(f"""
    <div style="display: flex; justify-content: space-between; align-items: center; 
                background: #111827; border: 1px solid #1f2937; padding: 0.85rem 1.25rem; border-radius: 12px; margin-bottom: 0.8rem;">
        <div>
            <div style="font-size: 1.35rem; font-weight: 800; color: #f8fafc;">
                {ins_ticker} <span style="font-size: 0.85rem; color: #94a3b8; font-weight: 500;">({ins['symbol']})</span>
            </div>
            <div style="font-size: 0.8rem; color: #64748b;">{ins['name']} • {ins['sector']}</div>
        </div>
        <div style="text-align: right;">
            <div style="font-size: 1.5rem; font-weight: 800; color: #f8fafc;">₹{ins_price:,.2f}</div>
            <div style="font-size: 0.82rem; font-weight: 600; color: {'#34d399' if ins['change'] >= 0 else '#f87171'};">
                {'+' if ins['change'] >= 0 else ''}₹{ins['change']:,.2f} ({ins['change_pct']:+.2f}%)
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # 2. PROMINENT MODULES PASSED vs FAILED BREAKDOWN
    st.markdown("##### 🔬 Consensus Inspection: Passed vs. Failed Modules")
    
    col_p_mod, col_f_mod = st.columns(2)
    
    with col_p_mod:
        st.markdown(f"""
        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 0.75rem;">
            <div style="font-size: 0.8rem; font-weight: 700; color: #34d399; margin-bottom: 6px;">
                ✅ PASSED MODULES ({len(ins['passed_modules'])} / 10)
            </div>
            {"".join([f"<span class='chip-pass'>✓ {m}</span>" for m in ins['passed_modules']]) if ins['passed_modules'] else "<div style='color: #64748b; font-size: 0.75rem;'>No modules passed</div>"}
        </div>
        """, unsafe_allow_html=True)
        
    with col_f_mod:
        st.markdown(f"""
        <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; padding: 0.75rem;">
            <div style="font-size: 0.8rem; font-weight: 700; color: #f87171; margin-bottom: 6px;">
                ❌ FAILED MODULES ({len(ins['failed_modules'])} / 10)
            </div>
            {"".join([f"<span class='chip-fail'>✕ {m}</span>" for m in ins['failed_modules']]) if ins['failed_modules'] else "<div style='color: #34d399; font-size: 0.75rem;'>100% Perfect Consensus!</div>"}
        </div>
        """, unsafe_allow_html=True)

    st.markdown("<div style='height: 8px;'></div>", unsafe_allow_html=True)

    # 3. INTERACTIVE CANDLESTICK CHART (TRADINGVIEW & GROWW STYLE)
    st.markdown("##### 🕯️ Candlestick Chart Terminal (TradingView & Groww Engine)")
    
    chart_tab1, chart_tab2 = st.tabs([
        "📊 TradingView Pro Live (Groww Engine)",
        "🎯 FinanceBro Algorithmic Candlestick Overlay"
    ])
    
    with chart_tab1:
        render_tradingview_candlestick(ins["symbol"], height=440)
        
    with chart_tab2:
        render_plotly_candlestick(ins["df"], ins_ticker, active_pos=st.session_state.active_position, height=440)

    # 4. FULL 10-MODULE MATRIX DETAILS (EXPANDABLE)
    with st.expander("🔍 View Detailed 10-Module Criteria & Weights", expanded=False):
        detailed_matrix_rows = []
        for m in ins["matrix"]:
            detailed_matrix_rows.append({
                "Module": f"#{m['id']} {m['name']}",
                "Category": m["category"],
                "Weight": f"{m['weight']}x",
                "Signal": "PASS" if m["passed"] else "FAIL",
                "Institutional Trigger": m["description"]
            })
        st.dataframe(
            pd.DataFrame(detailed_matrix_rows),
            column_config={
                "Module": st.column_config.TextColumn("Module", width="medium"),
                "Category": st.column_config.TextColumn("Category", width="small"),
                "Signal": st.column_config.TextColumn("Status", width="small"),
                "Institutional Trigger": st.column_config.TextColumn("Trigger Condition", width="large"),
            },
            hide_index=True,
            use_container_width=True
        )

    # 5. EXECUTION & EXIT ACTION PANEL
    st.markdown("##### ⚡ Paper Trading Execution Panel")
    
    score_val = ins["score"]
    action_decision = ins["action"]
    
    col_ex1, col_ex2 = st.columns([1.5, 1.5])
    
    with col_ex1:
        # Sizing calculation
        available_cash = max(0.0, st.session_state.wallet_balance - 25.0)
        max_shares = int(available_cash // ins_price) if ins_price > 0 else 0
        
        trade_qty = st.number_input(
            "Shares to Trade",
            min_value=1,
            max_value=max(1, max_shares) if max_shares > 0 else 1,
            value=min(max(1, max_shares), 1),
            step=1,
            key=f"trade_qty_{ins_ticker}"
        )
        
        trade_val = trade_qty * ins_price
        charges, _ = calculate_charges(trade_val)
        tot_needed = trade_val + charges
        
        st.markdown(f"""
        <div style="font-size: 0.75rem; color: #94a3b8; line-height: 1.4;">
            Order Value: <b style="color: #f8fafc;">₹{trade_val:,.2f}</b><br>
            Brokerage & STT/GST: <b style="color: #fbbf24;">₹{charges:.2f}</b><br>
            Total Capital Needed: <b style="color: #38bdf8;">₹{tot_needed:,.2f}</b>
        </div>
        """, unsafe_allow_html=True)

    with col_ex2:
        b_thresh = st.session_state.custom_rules.get("buy_threshold", 6)
        e_thresh = st.session_state.custom_rules.get("exit_threshold", 6)
        buy_eligible = (
            score_val >= b_thresh 
            and st.session_state.wallet_balance >= tot_needed 
            and st.session_state.active_position is None
        )
        
        st.markdown(f"""
        <div style="text-align: center; background: {ins['color']}18; border: 1px solid {ins['color']}; 
                    padding: 8px; border-radius: 8px; margin-bottom: 8px;">
            <span style="font-weight: 800; color: {ins['color']}; font-size: 0.95rem;">{action_decision}</span>
            <div style="font-size: 0.72rem; color: #cbd5e1;">Score: {score_val}/{ins.get('total_modules', 10)} (Rule: Buy ≥ {b_thresh}, Auto-Exit < {e_thresh})</div>
        </div>
        """, unsafe_allow_html=True)
        
        col_b_buy, col_b_sell = st.columns(2)
        with col_b_buy:
            if st.button("🟢 Buy", use_container_width=True, type="primary", disabled=not buy_eligible):
                st.session_state.wallet_balance -= tot_needed
                st.session_state.active_position = {
                    "ticker": ins_ticker,
                    "symbol": ins["symbol"],
                    "quantity": trade_qty,
                    "entry_price": ins_price,
                    "entry_time": datetime.datetime.now().strftime("%H:%M:%S"),
                    "entry_fees": charges,
                    "stop_loss": round(ins_price * 0.98, 2),
                    "target": round(ins_price * 1.04, 2),
                    "score_at_entry": score_val
                }
                trade_record = {
                    "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
                    "ticker": ins_ticker,
                    "type": "BUY",
                    "qty": trade_qty,
                    "entry_price": ins_price,
                    "exit_price": "-",
                    "turnover": round(trade_val, 2),
                    "fees": round(charges, 2),
                    "pnl": "-",
                    "reason": f"Consensus score {score_val}/10 (>= 6)",
                    "balance_after": round(st.session_state.wallet_balance, 2)
                }
                st.session_state.trade_history.insert(0, trade_record)
                add_log(f"✅ BUY: {trade_qty} {ins_ticker} @ ₹{ins_price:,.2f} | Fees: ₹{charges:.2f}", "buy")
                st.toast(f"Executed Buy: {trade_qty} {ins_ticker} @ ₹{ins_price:,.2f}", icon="🚀")
                st.rerun()
                
        with col_b_sell:
            has_pos = st.session_state.active_position is not None
            if st.button("🔴 Liquidate", use_container_width=True, disabled=not has_pos):
                pos = st.session_state.active_position
                p_qty = pos["quantity"]
                p_exit_price = ins_price
                p_turnover = p_qty * p_exit_price
                exit_fees, _ = calculate_charges(p_turnover)
                net_pnl = ((p_exit_price - pos["entry_price"]) * p_qty) - (pos["entry_fees"] + exit_fees)
                
                st.session_state.wallet_balance += (p_turnover - exit_fees)
                trade_record = {
                    "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
                    "ticker": pos["ticker"],
                    "type": "SELL (MANUAL)",
                    "qty": p_qty,
                    "entry_price": pos["entry_price"],
                    "exit_price": p_exit_price,
                    "turnover": round(p_turnover, 2),
                    "fees": round(exit_fees, 2),
                    "pnl": round(net_pnl, 2),
                    "reason": "Manual Operator Exit",
                    "balance_after": round(st.session_state.wallet_balance, 2)
                }
                st.session_state.trade_history.insert(0, trade_record)
                st.session_state.active_position = None
                add_log(f"🔻 SELL: {p_qty} {pos['ticker']} @ ₹{p_exit_price:,.2f} | P&L: ₹{net_pnl:+,.2f}", "sell")
                st.toast(f"Position Liquidated! P&L: ₹{net_pnl:+,.2f}", icon="💰")
                st.rerun()


# ==========================================
# 8. TERMINAL LOGS & EXECUTION LEDGER
# ==========================================
st.markdown("---")
col_log, col_hist = st.columns([1.1, 1.9])

with col_log:
    st.markdown("##### 📜 Real-Time Simulation Terminal")
    log_content = ""
    for entry in reversed(st.session_state.simulation_logs[-25:]):
        if "BUY" in entry:
            cls = "log-buy"
        elif "SELL" in entry or "AUTOMATED" in entry or "EXIT" in entry:
            cls = "log-sell"
        elif "RESET" in entry or "WARNING" in entry:
            cls = "log-warn"
        else:
            cls = "log-info"
        log_content += f"<div class='log-line {cls}'>{entry}</div>"

    st.markdown(f"""
    <div class="terminal-container">
        {log_content}
    </div>
    """, unsafe_allow_html=True)

with col_hist:
    st.markdown("##### 📋 Paper Trading Execution Ledger")
    if st.session_state.trade_history:
        history_df = pd.DataFrame(st.session_state.trade_history)
        st.dataframe(
            history_df,
            column_config={
                "timestamp": st.column_config.TextColumn("Time", width="small"),
                "ticker": st.column_config.TextColumn("Asset", width="small"),
                "type": st.column_config.TextColumn("Action", width="medium"),
                "qty": st.column_config.NumberColumn("Qty", format="%d"),
                "entry_price": st.column_config.NumberColumn("Entry (₹)", format="₹%.2f"),
                "exit_price": st.column_config.TextColumn("Exit (₹)"),
                "fees": st.column_config.NumberColumn("Fees (₹)", format="₹%.2f"),
                "pnl": st.column_config.TextColumn("Net P&L (₹)"),
                "reason": st.column_config.TextColumn("Trigger Rationale", width="large"),
                "balance_after": st.column_config.NumberColumn("Wallet (₹)", format="₹%.2f"),
            },
            hide_index=True,
            use_container_width=True,
            height=220
        )
    else:
        st.info("No paper trades executed yet. Scan stocks and execute paper buy when consensus score is ≥ 6/10.")
