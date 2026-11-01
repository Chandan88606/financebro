# 📈 FinanceBro — NSE Institutional Algorithmic & Derivatives Platform

FinanceBro is an institutional-grade algorithmic trading terminal tailored for the **Indian Stock Market (NSE)**, built as a modern **React 18 (Vite)** single-page application.

The terminal features dual specialized screens:
1. **📊 Screen 1: Cash Equity Terminal** — 10-module algorithmic technical consensus scanner, TradingView candlestick charts, wallet budget filtering, and paper delivery execution.
2. **⚡ Screen 2: Derivatives & Options Terminal (F&O)** — Dedicated multi-leg institutional options strategies across Bullish, Bearish, and Sideways/High-IV setups with real-time payoff curve diagrams, SEBI span margin models, and autonomous risk management auto-exit.

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

## 🏃 Getting Started

```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the terminal.
