# 📈 FinanceBro — NSE Institutional Algorithmic & Derivatives Platform

FinanceBro is an institutional-grade algorithmic trading terminal tailored for the **Indian Stock Market (NSE)**, built as a modern **React 18 (Vite)** single-page application.

---

## 🧭 How to Access the Two Dedicated Screens

FinanceBro features two full trading workstations built into a unified HashRouter architecture:

1. **📊 Screen 1: Cash Equity Terminal** (`#/` or `#/equity`)
   - 10-module algorithmic technical consensus scanner (EMA, Supertrend, RSI, MACD, Bollinger Bands, Volume Spike, ADX, Stochastic, OBV, Candlestick Patterns)
   - Real-time TradingView candlestick charts with technical indicators
   - Wallet budget filtering and instant 1-click delivery paper execution
   - Automated equity auto-exit monitoring stop-loss (-3%), take-profit (+10%), and consensus degradation

2. **⚡ Screen 2: Futures & Options (F&O) Derivatives Terminal** (`#/derivatives` or `#/options`)
   - **How to Open**:
     - Click **`⚡ F&O Derivatives (10 Spreads)`** in the top navigation bar.
     - Click the glowing banner at the top of the Cash Equity screen: **"Switch to F&O Terminal"**.
     - Click the floating quick-switch button in the bottom right corner of the screen.
     - Or append `#/derivatives` directly to your browser URL.
   - **Strategy Selector**: 10 Master Institutional Spread Strategies across 3 market regimes.
   - **Interactive Payoff Diagram**: Visual profit/loss area curves with exact breakeven lines and spot prices.
   - **SEBI Span Margin Engine**: Live calculation of margin requirements with hedged spread relief and Indian statutory STT/GST/exchange turnover charges breakdown.
   - **Multi-Leg Basket Execution**: 1-click execution of complete 2-leg and 4-leg option structures.
   - **Autonomous F&O Auto-Exit**: 50% max profit take-profit limit, 100% loss cut, and pre-expiry auto-squareoff to avoid physical delivery.

---

## ⚡ The 10 Master F&O Institutional Strategies

### Phase 1: Bull Market Setups
1. **Bull Call Spread (Vertical Debit Spread)**: Buy ITM/ATM Call + Sell OTM Call to dramatically slash capital required per lot and hedge against theta decay.
2. **Bull Put Spread (Credit Put Spread)**: Sell OTM Put at psychological support (e.g. NIFTY 24,000) + Buy further OTM Put protection wing. Optimized under SEBI peak margin rules.
3. **Call Ratio Backspread**: Sell 1 ATM Call + Buy 2 OTM Calls for breakout rallies and massive gap-up momentum days.

### Phase 2: Bear Market Setups
4. **Bear Put Spread**: Buy higher strike Put + Sell lower strike Put to lower cost basis and protect against IV crush traps on corrections.
5. **Bear Call Spread**: Sell ATM/OTM Call near key resistance + Buy higher OTM Call on aggressive short-covering rallies to collect high option premiums.
6. **Protective Put / Collar**: Long Underlying/Futures + Buy Put floor + Sell OTM Call to safeguard long equity holdings without triggering tax liquidation.

### Phase 3: Sideways, Range-Bound & High-Volatility Setups
7. **Iron Condor (Weekly Expiry Range Trading)**: 4-leg spread capturing rapid theta decay on Tuesday/Wednesday into Thursday Nifty & Wednesday Bank Nifty expiries.
8. **Short Iron Butterfly (At-the-Money Range Play)**: 4-leg spread pinned at spot price to extract maximum premium heading into expiry hours.
9. **Short Straddle / Strangle with Defined Hedging**: Sell ATM/OTM Call & Put with far-OTM protective wings to comply with SEBI span-margin framework and eliminate tail margin spikes.
10. **Long Straddle / Strangle (Pre-Event IV Expansion)**: Buy ATM Call & Put 1–2 days prior to Union Budget, RBI Monetary Policy, or heavyweight quarterly earnings.

---

## 🛡️ Autonomous Risk Management & Auto-Exit Engine
- **Equity Auto-Exit**: Continuous background loop monitoring stop-loss % (-3%), take-profit % (+10%), or consensus score drops below safety thresholds (< 5/10).
- **F&O Auto-Exit**:
  - **Take-Profit Target**: Auto-liquidate credit spreads when 50% max profit is captured to mitigate late-cycle gamma explosions.
  - **Stop-Loss Limit**: Auto-cut spreads if unrealized loss breaches 100% of risk limit.
  - **SEBI Physical Delivery Safety Auto-Squareoff**: Mandatory exit before expiry zero-hour to eliminate physical delivery penalties.

---

## 🚀 Repository & Deployment Structure

The repository is synchronized across **both `main` and `master` branches**:
- **Root Directory (`./`)**: Complete Vite + React 18 application with all components and F&O engine.
- **Frontend Directory (`frontend/`)**: Fully mirrored copy for deployment platforms (Cloudflare Pages, Vercel, Netlify) configured with `Root directory: frontend`.

### Local Run:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (Cash Equity) or [http://localhost:3000/#/derivatives](http://localhost:3000/#/derivatives) (F&O Derivatives).
