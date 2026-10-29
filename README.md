# 📈 FinanceBro — NSE Algorithmic Trading & Consensus Platform

FinanceBro is an institutional-grade algorithmic technical analysis consensus engine and paper trading terminal tailored for the **Indian Stock Market (NSE)**.

---

## 🚀 Key Features

- **🎯 10 Master Consensus Modules**:
  1. **Module 1: RSI Range-Shift** — Bull market floor rebound ($RSI \ge 40$).
  2. **Module 2: EMA Crossover** — Structural trend ($20\text{ EMA} > 50\text{ EMA}$).
  3. **Module 3: Volume Spike** — Institutional accumulation ($\text{Vol} \ge 2\times 20\text{-SMA}$).
  4. **Module 4: VWAP Momentum** — Price trading above Volume-Weighted Average Price.
  5. **Module 5: Bollinger Band Breakout** — Volatility expansion ($\text{Close} \ge \text{Upper } 2\sigma$).
  6. **Module 6: Pivot Point Bounce** — Support 1 ($S_1$) reaction and bounce.
  7. **Module 7: MACD Histogram Shift** — Positive acceleration impulse.
  8. **Module 8: Supertrend Bullish** — Classic ATR Supertrend ($10, 3$) in green regime.
  9. **Module 9: Fibonacci Golden Pocket** — $50\% - 61.8\% - 65\%$ swing retracement zone defense.
  10. **Module 10: Price Action Breakout** — Breakout above prior $N$-period high.

- **🕯️ TradingView & Groww-Grade Candlestick Terminal**:
  - Live **TradingView Advanced Candlestick Terminal** with full drawing tools, timeframes, and indicators.
  - Custom **FinanceBro Plotly Dark Candlestick Chart** with 20 EMA, 50 EMA, shaded Bollinger Bands ribbon, Volume bars, and active position markers.

- **💸 Wallet Budget Filtering**:
  - Automatically filters the universe to stocks priced below your available wallet balance (e.g., $\le$ ₹1,000).

- **⚙️ Configurable Strategy & Rule Parameters**:
  - Customize Buy & Auto-Sell Exit thresholds.
  - Tune individual indicators (RSI windows/floors, EMAs, Volume multipliers, Bollinger deviations, Supertrend, etc.).
  - Toggle specific modules ON/OFF.

- **⚡ Automated Risk Management & Execution**:
  - Automatic paper-sell liquidation if consensus score drops below the configured exit threshold.
  - Realistic Indian brokerage fee & regulatory tax model (Flat ₹20 broker fee + STT + GST + Stamp Duty + SEBI turnover fee).
  - Real-time simulation terminal logs and historical execution ledger.

---

## 🛠️ Technology Stack

- **Frontend**: Streamlit (Sleek dark-mode dashboard)
- **Charting**: TradingView Widget & Plotly
- **Data & Computations**: Python 3, Pandas, NumPy, yfinance, ta

---

## 🏃 Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Chandan88606/FinanceBro.git
   cd FinanceBro
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**:
   ```bash
   streamlit run app.py
   ```

4. Open your browser at `http://localhost:8501`.
