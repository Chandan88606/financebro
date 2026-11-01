/**
 * optionsData.js - Institutional NSE Derivatives (F&O) Engine
 * Comprehensive modeling for 10 Indian Options Strategies across Bullish, Bearish, and Sideways/High-IV phases.
 */

export const FO_UNDERLYINGS = [
  {
    ticker: "NIFTY",
    symbol: "^NSEI",
    name: "NIFTY 50 Index",
    type: "INDEX",
    spotPrice: 24250.00,
    lotSize: 50,
    strikeStep: 50,
    weeklyExpiryDay: "Thursday",
    iv: 14.2,
    ivPercentile: 48,
    marketBias: "BULLISH",
    support: 24000,
    resistance: 24500,
    catalyst: "Upcoming RBI Monetary Policy Meeting"
  },
  {
    ticker: "BANKNIFTY",
    symbol: "^NSEBANK",
    name: "NIFTY Bank Index",
    type: "INDEX",
    spotPrice: 51800.00,
    lotSize: 30,
    strikeStep: 100,
    weeklyExpiryDay: "Wednesday",
    iv: 16.8,
    ivPercentile: 55,
    marketBias: "SIDEWAYS",
    support: 51200,
    resistance: 52400,
    catalyst: "Private Banks Quarterly Earnings"
  },
  {
    ticker: "FINNIFTY",
    symbol: "NIFTY_FIN_SERVICE.NS",
    name: "NIFTY Financial Services",
    type: "INDEX",
    spotPrice: 23900.00,
    lotSize: 40,
    strikeStep: 50,
    weeklyExpiryDay: "Tuesday",
    iv: 15.1,
    ivPercentile: 50,
    marketBias: "SIDEWAYS",
    support: 23600,
    resistance: 24200,
    catalyst: "NBFC Credit Growth Data"
  },
  {
    ticker: "RELIANCE",
    symbol: "RELIANCE.NS",
    name: "Reliance Industries Ltd.",
    type: "STOCK",
    spotPrice: 1285.00,
    lotSize: 250,
    strikeStep: 20,
    weeklyExpiryDay: "Monthly Last Thursday",
    iv: 22.4,
    ivPercentile: 74,
    marketBias: "HIGH_IV_PRE_EVENT",
    support: 1240,
    resistance: 1320,
    catalyst: "Q3 Results & Retail Spin-off Speculation"
  },
  {
    ticker: "HDFCBANK",
    symbol: "HDFCBANK.NS",
    name: "HDFC Bank Ltd.",
    type: "STOCK",
    spotPrice: 1690.00,
    lotSize: 550,
    strikeStep: 20,
    weeklyExpiryDay: "Monthly Last Thursday",
    iv: 18.2,
    ivPercentile: 42,
    marketBias: "BULLISH",
    support: 1650,
    resistance: 1730,
    catalyst: "FII Inflows & Deposit Expansion"
  },
  {
    ticker: "TCS",
    symbol: "TCS.NS",
    name: "Tata Consultancy Services",
    type: "STOCK",
    spotPrice: 3840.00,
    lotSize: 175,
    strikeStep: 50,
    weeklyExpiryDay: "Monthly Last Thursday",
    iv: 19.5,
    ivPercentile: 62,
    marketBias: "BEARISH",
    support: 3750,
    resistance: 3920,
    catalyst: "Global Tech Discretionary Spend Slowdown"
  },
  {
    ticker: "TATAMOTORS",
    symbol: "TATAMOTORS.NS",
    name: "Tata Motors Ltd.",
    type: "STOCK",
    spotPrice: 840.00,
    lotSize: 700,
    strikeStep: 10,
    weeklyExpiryDay: "Monthly Last Thursday",
    iv: 28.5,
    ivPercentile: 82,
    marketBias: "BULLISH_BREAKOUT",
    support: 820,
    resistance: 870,
    catalyst: "EV Margin Expansion & JLR Deliveries"
  },
  {
    ticker: "INFY",
    symbol: "INFY.NS",
    name: "Infosys Ltd.",
    type: "STOCK",
    spotPrice: 1740.00,
    lotSize: 400,
    strikeStep: 20,
    weeklyExpiryDay: "Monthly Last Thursday",
    iv: 21.0,
    ivPercentile: 58,
    marketBias: "BEARISH",
    support: 1700,
    resistance: 1780,
    catalyst: "Margin Compression in Europe"
  }
];

export const FO_STRATEGY_DEFINITIONS = [
  // ==========================================
  // PHASE 1: BULL MARKET SETUPS
  // ==========================================
  {
    id: "BULL_CALL_SPREAD",
    phase: "Phase 1: Bull Market Setups",
    name: "Bull Call Spread",
    alias: "Vertical Debit Spread",
    type: "DEBIT",
    bias: "MODERATELY_BULLISH",
    idealFor: "Directional upward rally with capped downside and reduced premium cost.",
    indianMarketApplication: "Instead of buying expensive naked weekly Nifty/Bank Nifty Call options (where theta destroys you if the index consolidates), you buy an In-The-Money (ITM) or At-The-Money (ATM) Call and sell an Out-of-The-Money (OTM) Call. This drastically reduces the capital required per lot under strict broker margin frameworks.",
    legConfig: [
      { action: "BUY", optionType: "CE", strikeOffset: 0, label: "Buy ATM/ITM Call" },
      { action: "SELL", optionType: "CE", strikeOffset: 1, label: "Sell OTM Call (Capped Target)" }
    ],
    sebiMarginMultiplier: 0.22 // Significant margin relief vs naked selling
  },
  {
    id: "BULL_PUT_SPREAD",
    phase: "Phase 1: Bull Market Setups",
    name: "Bull Put Spread",
    alias: "Credit Put Spread",
    type: "CREDIT",
    bias: "BULLISH_SUPPORT_BOUNCE",
    idealFor: "High probability of profit when index/stock defends a strong psychological support level.",
    indianMarketApplication: "One of the most popular strategies for Indian option sellers. When Nifty finds strong support at a round psychological level (e.g., 24,000 or 25,000), you sell an OTM Put and buy a further OTM Put below it for protection. Because SEBI’s peak margin rules penalize naked selling, this spread-based credit strategy optimizes margin utilization.",
    legConfig: [
      { action: "SELL", optionType: "PE", strikeOffset: -1, label: "Sell OTM Put (Support Strike)" },
      { action: "BUY", optionType: "PE", strikeOffset: -2, label: "Buy Far OTM Put (Protection Wing)" }
    ],
    sebiMarginMultiplier: 0.18
  },
  {
    id: "CALL_RATIO_BACKSPREAD",
    phase: "Phase 1: Bull Market Setups",
    name: "Call Ratio Backspread",
    alias: "1x2 Volatility Breakout Spread",
    type: "VOLATILITY_BULLISH",
    bias: "EXPLOSIVE_BULLISH",
    idealFor: "Anticipating an explosive breakout, heavy gap-up, or massive momentum session.",
    indianMarketApplication: "Deployed during strong breakout sessions in high-momentum stocks or index rallies. You sell 1 ATM Call and buy 2 OTM Calls further up. If a massive gap-up or explosive trend day hits, the dual long calls yield heavy exponential returns while the sold call cushions minor pullbacks.",
    legConfig: [
      { action: "SELL", optionType: "CE", strikeOffset: 0, qtyRatio: 1, label: "Sell 1x ATM Call" },
      { action: "BUY", optionType: "CE", strikeOffset: 2, qtyRatio: 2, label: "Buy 2x OTM Calls" }
    ],
    sebiMarginMultiplier: 0.35
  },

  // ==========================================
  // PHASE 2: BEAR MARKET SETUPS
  // ==========================================
  {
    id: "BEAR_PUT_SPREAD",
    phase: "Phase 2: Bear Market Setups",
    name: "Bear Put Spread",
    alias: "Vertical Debit Put Spread",
    type: "DEBIT",
    bias: "MODERATELY_BEARISH",
    idealFor: "Downward market breakdown without suffering from excessive IV inflation crush.",
    indianMarketApplication: "When Indian markets break key technical support levels or global cues turn negative, buying naked puts can result in getting trapped by high Implied Volatility (IV). A Bear Put Spread (buying a higher strike put and selling a lower strike put) lowers your cost basis and shields you if the market attempts a sudden intraday recovery.",
    legConfig: [
      { action: "BUY", optionType: "PE", strikeOffset: 0, label: "Buy ATM Put" },
      { action: "SELL", optionType: "PE", strikeOffset: -1, label: "Sell OTM Put" }
    ],
    sebiMarginMultiplier: 0.22
  },
  {
    id: "BEAR_CALL_SPREAD",
    phase: "Phase 2: Bear Market Setups",
    name: "Bear Call Spread",
    alias: "Credit Call Spread on Rallies",
    type: "CREDIT",
    bias: "BEARISH_RESISTANCE_REJECTION",
    idealFor: "Shorting counter-trend bear-market bounce rallies near major moving averages.",
    indianMarketApplication: "In a bear market, Indian indices routinely experience sharp, aggressive short-covering rallies ('trap rallies') that last a day or two. Experienced traders use Bear Call Spreads near major resistance zones (like crucial moving averages) to collect high option premiums, betting that the rally will stall and fade.",
    legConfig: [
      { action: "SELL", optionType: "CE", strikeOffset: 1, label: "Sell OTM Call (Resistance Strike)" },
      { action: "BUY", optionType: "CE", strikeOffset: 2, label: "Buy Far OTM Call (Protection Wing)" }
    ],
    sebiMarginMultiplier: 0.18
  },
  {
    id: "PROTECTIVE_COLLAR",
    phase: "Phase 2: Bear Market Setups",
    name: "Protective Put / Collar",
    alias: "Portfolio Hedging Structure",
    type: "HEDGE",
    bias: "HEDGED_LONG",
    idealFor: "Locking in profits or shielding long delivery blue-chip equity without liquidating shares.",
    indianMarketApplication: "Ideal if you hold a heavy delivery-based portfolio of Indian blue-chip stocks (Reliance, TCS, HDFC Bank) and fear a systemic market correction. Buying index puts or structuring a collar prevents panic-selling your long-term equity holdings during sudden macro shocks.",
    legConfig: [
      { action: "BUY", optionType: "PE", strikeOffset: -1, label: "Buy OTM Put (Downside Floor)" },
      { action: "SELL", optionType: "CE", strikeOffset: 1, label: "Sell OTM Call (Finances Put Cost)" }
    ],
    sebiMarginMultiplier: 0.15
  },

  // ==========================================
  // PHASE 3: SIDEWAYS & VOLATILITY SETUPS
  // ==========================================
  {
    id: "IRON_CONDOR",
    phase: "Phase 3: Sideways & Volatility",
    name: "Iron Condor",
    alias: "Weekly Expiry Range Trading",
    type: "CREDIT",
    bias: "NEUTRAL_RANGE_BOUND",
    idealFor: "Capturing rapid theta time decay when index stays inside broad boundary wings.",
    indianMarketApplication: "With multiple weekly expiries available on NSE (Nifty on Thursdays, Bank Nifty on Wednesdays, etc.), the Iron Condor is deployed on Tuesday afternoons or Wednesday mornings to capture rapid time decay (theta) as the index expires inside a defined range.",
    legConfig: [
      { action: "BUY", optionType: "PE", strikeOffset: -3, label: "Buy Far OTM Put Wing" },
      { action: "SELL", optionType: "PE", strikeOffset: -1, label: "Sell OTM Put (Lower Bound)" },
      { action: "SELL", optionType: "CE", strikeOffset: 1, label: "Sell OTM Call (Upper Bound)" },
      { action: "BUY", optionType: "CE", strikeOffset: 3, label: "Buy Far OTM Call Wing" }
    ],
    sebiMarginMultiplier: 0.28
  },
  {
    id: "SHORT_IRON_BUTTERFLY",
    phase: "Phase 3: Sideways & Volatility",
    name: "Short Iron Butterfly",
    alias: "ATM Expiry Range Play",
    type: "CREDIT",
    bias: "PINNED_ATM_NEUTRAL",
    idealFor: "Extracting maximum credit premium when underlying is expected to pin right at spot on expiry day.",
    indianMarketApplication: "Similar to an Iron Condor, but the short strikes are placed right at the current spot price. It extracts maximum premium when a stock or index goes completely range-bound heading into expiry hours.",
    legConfig: [
      { action: "BUY", optionType: "PE", strikeOffset: -2, label: "Buy OTM Put Wing" },
      { action: "SELL", optionType: "PE", strikeOffset: 0, label: "Sell ATM Put" },
      { action: "SELL", optionType: "CE", strikeOffset: 0, label: "Sell ATM Call" },
      { action: "BUY", optionType: "CE", strikeOffset: 2, label: "Buy OTM Call Wing" }
    ],
    sebiMarginMultiplier: 0.25
  },
  {
    id: "HEDGED_STRADDLE_STRANGLE",
    phase: "Phase 3: Sideways & Volatility",
    name: "Short Straddle / Strangle (Hedged)",
    alias: "SEBI Span-Margin Winged Straddle",
    type: "CREDIT",
    bias: "HIGH_THETA_HARVEST",
    idealFor: "Professional theta harvesting with mandatory SEBI span margin hedging.",
    indianMarketApplication: "Popular among algorithmic and high-net-worth Indian traders. Selling an ATM/OTM Call and Put simultaneously captures massive decay. Crucial rule in India: Always buy far-OTM wings (making it an Iron Condor/Butterfly) to satisfy SEBI span-margin requirements; otherwise, naked short straddles require prohibitive margin block amounts.",
    legConfig: [
      { action: "BUY", optionType: "PE", strikeOffset: -4, label: "Far OTM Put SEBI Wing" },
      { action: "SELL", optionType: "PE", strikeOffset: 0, label: "Sell ATM Put" },
      { action: "SELL", optionType: "CE", strikeOffset: 0, label: "Sell ATM Call" },
      { action: "BUY", optionType: "CE", strikeOffset: 4, label: "Far OTM Call SEBI Wing" }
    ],
    sebiMarginMultiplier: 0.30
  },
  {
    id: "LONG_STRADDLE_STRANGLE",
    phase: "Phase 3: Sideways & Volatility",
    name: "Long Straddle / Strangle",
    alias: "Pre-Event IV Explosion Play",
    type: "DEBIT",
    bias: "EXPLOSIVE_VOLATILITY",
    idealFor: "Big market catalysts: Union Budget, RBI Policy announcements, or heavyweight quarterly earnings.",
    indianMarketApplication: "Deployed precisely 1–2 days before massive Indian economic catalysts—such as the Union Budget presentation, RBI Monetary Policy announcements, or major quarterly results for heavyweights like Reliance or Infosys. Prior to the event, option buyers load up on both ATM calls and puts to capitalize on the massive explosion of Implied Volatility (IV) and a sharp directional breakout.",
    legConfig: [
      { action: "BUY", optionType: "CE", strikeOffset: 0, label: "Buy ATM Call (IV Explosion)" },
      { action: "BUY", optionType: "PE", strikeOffset: 0, label: "Buy ATM Put (IV Explosion)" }
    ],
    sebiMarginMultiplier: 0.15
  }
];

// Calculate strike prices based on spot and step
export function getStrike(spot, step, offset) {
  const atm = Math.round(spot / step) * step;
  return atm + (offset * step);
}

// Estimate realistic option premium using spot, strike, DTE, and IV
export function estimateOptionPremium(spot, strike, optionType, iv = 15, dte = 5) {
  const intrinsic = optionType === "CE" ? Math.max(0, spot - strike) : Math.max(0, strike - spot);
  const timeValueBase = spot * (iv / 100) * Math.sqrt(Math.max(1, dte) / 365) * 0.4;
  const distancePct = Math.abs(spot - strike) / spot;
  const decayFactor = Math.exp(-distancePct * 25);
  const timeValue = Math.max(2.0, timeValueBase * decayFactor);
  return Math.round((intrinsic + timeValue) * 10) / 10;
}

// Generate full detailed instance of an F&O Strategy Suggestion
export function buildStrategyInstance(strategyDef, underlying, dte = 4) {
  const { spotPrice, strikeStep, lotSize, iv, weeklyExpiryDay } = underlying;

  let netPremiumPerUnit = 0;
  const legs = strategyDef.legConfig.map(cfg => {
    const strike = getStrike(spotPrice, strikeStep, cfg.strikeOffset);
    const premium = estimateOptionPremium(spotPrice, strike, cfg.optionType, iv, dte);
    const qtyRatio = cfg.qtyRatio || 1;

    if (cfg.action === "BUY") {
      netPremiumPerUnit -= (premium * qtyRatio);
    } else {
      netPremiumPerUnit += (premium * qtyRatio);
    }

    return {
      action: cfg.action,
      optionType: cfg.optionType,
      strike,
      premium,
      qtyRatio,
      label: cfg.label
    };
  });

  const isCredit = netPremiumPerUnit > 0;
  const netPremiumAbs = Math.abs(netPremiumPerUnit);
  const totalCashEffectPerLot = Math.round(netPremiumAbs * lotSize * 100) / 100;

  // Realistic SEBI Span Margin calculation
  // Naked short in India requires ~₹1.2L per lot on Nifty; Hedged spreads get ~70-80% discount
  const baseMarginPerLot = underlying.type === "INDEX" ? 115000 : Math.round(spotPrice * lotSize * 0.22);
  const requiredMarginPerLot = isCredit
    ? Math.max(22000, Math.round(baseMarginPerLot * strategyDef.sebiMarginMultiplier))
    : totalCashEffectPerLot; // Debit spreads only require the net debit paid

  // Risk / Reward & Breakeven metrics
  let maxProfitPerLot = 0;
  let maxLossPerLot = 0;
  let breakevens = [];

  const stepDiff = strikeStep;
  if (strategyDef.id === "BULL_CALL_SPREAD") {
    maxProfitPerLot = Math.round((stepDiff - netPremiumAbs) * lotSize);
    maxLossPerLot = Math.round(netPremiumAbs * lotSize);
    breakevens = [legs[0].strike + netPremiumAbs];
  } else if (strategyDef.id === "BULL_PUT_SPREAD") {
    maxProfitPerLot = Math.round(netPremiumAbs * lotSize);
    maxLossPerLot = Math.round((stepDiff - netPremiumAbs) * lotSize);
    breakevens = [legs[0].strike - netPremiumAbs];
  } else if (strategyDef.id === "CALL_RATIO_BACKSPREAD") {
    maxProfitPerLot = "UNLIMITED";
    maxLossPerLot = Math.round((stepDiff * 2 - netPremiumAbs) * lotSize);
    breakevens = [legs[0].strike + netPremiumAbs, legs[1].strike + stepDiff];
  } else if (strategyDef.id === "BEAR_PUT_SPREAD") {
    maxProfitPerLot = Math.round((stepDiff - netPremiumAbs) * lotSize);
    maxLossPerLot = Math.round(netPremiumAbs * lotSize);
    breakevens = [legs[0].strike - netPremiumAbs];
  } else if (strategyDef.id === "BEAR_CALL_SPREAD") {
    maxProfitPerLot = Math.round(netPremiumAbs * lotSize);
    maxLossPerLot = Math.round((stepDiff - netPremiumAbs) * lotSize);
    breakevens = [legs[0].strike + netPremiumAbs];
  } else if (strategyDef.id === "IRON_CONDOR") {
    maxProfitPerLot = Math.round(netPremiumAbs * lotSize);
    maxLossPerLot = Math.round(((stepDiff * 2) - netPremiumAbs) * lotSize);
    breakevens = [legs[1].strike - netPremiumAbs, legs[2].strike + netPremiumAbs];
  } else if (strategyDef.id === "SHORT_IRON_BUTTERFLY" || strategyDef.id === "HEDGED_STRADDLE_STRANGLE") {
    maxProfitPerLot = Math.round(netPremiumAbs * lotSize);
    maxLossPerLot = Math.round(((stepDiff * 2) - netPremiumAbs) * lotSize);
    breakevens = [legs[1].strike - netPremiumAbs, legs[2].strike + netPremiumAbs];
  } else if (strategyDef.id === "LONG_STRADDLE_STRANGLE") {
    maxProfitPerLot = "UNLIMITED";
    maxLossPerLot = Math.round(netPremiumAbs * lotSize);
    breakevens = [legs[0].strike - netPremiumAbs, legs[0].strike + netPremiumAbs];
  } else {
    maxProfitPerLot = Math.round(stepDiff * lotSize);
    maxLossPerLot = Math.round(stepDiff * lotSize);
    breakevens = [spotPrice];
  }

  // Payoff curves across spot ± 5%
  const payoffCurve = [];
  const rangeMin = Math.round(spotPrice * 0.94);
  const rangeMax = Math.round(spotPrice * 1.06);
  const stepCount = 25;
  const priceIncrement = (rangeMax - rangeMin) / stepCount;

  for (let p = rangeMin; p <= rangeMax; p += priceIncrement) {
    let pnlAtPrice = 0;
    legs.forEach(leg => {
      const mult = leg.action === "BUY" ? 1 : -1;
      const ratio = leg.qtyRatio || 1;
      let legPayout = 0;
      if (leg.optionType === "CE") {
        legPayout = Math.max(0, p - leg.strike);
      } else {
        legPayout = Math.max(0, leg.strike - p);
      }
      pnlAtPrice += mult * (legPayout - leg.premium) * ratio;
    });

    payoffCurve.push({
      spot: Math.round(p),
      pnlPerLot: Math.round(pnlAtPrice * lotSize)
    });
  }

  // Dynamic Suggestion Confidence Score (1-10)
  let confidenceScore = 8;
  if (underlying.marketBias === "BULLISH" && strategyDef.bias.includes("BULLISH")) confidenceScore = 9;
  if (underlying.marketBias === "BEARISH" && strategyDef.bias.includes("BEARISH")) confidenceScore = 9;
  if (underlying.marketBias === "SIDEWAYS" && (strategyDef.id === "IRON_CONDOR" || strategyDef.id === "SHORT_IRON_BUTTERFLY")) confidenceScore = 9;
  if (underlying.marketBias === "HIGH_IV_PRE_EVENT" && strategyDef.id === "LONG_STRADDLE_STRANGLE") confidenceScore = 10;
  if (underlying.marketBias === "BULLISH_BREAKOUT" && strategyDef.id === "CALL_RATIO_BACKSPREAD") confidenceScore = 10;

  // Institutional Risk-to-Reward Profile Calculations
  let riskRewardRatioStr = "1 : 1.0";
  let riskRewardNumeric = 1.0;
  let popPct = 50;
  let riskProfileCategory = "Defined Risk · Balanced Profile";

  if (typeof maxProfitPerLot === 'string' && maxProfitPerLot === 'UNLIMITED') {
    riskRewardRatioStr = "1 : Asymmetric (Uncapped)";
    riskRewardNumeric = 5.0;
    popPct = strategyDef.id === "CALL_RATIO_BACKSPREAD" ? 38 : 42;
    riskProfileCategory = "Explosive Volatility · Uncapped Upside";
  } else if (maxLossPerLot > 0 && maxProfitPerLot > 0) {
    const ratio = Math.round((maxProfitPerLot / maxLossPerLot) * 100) / 100;
    riskRewardNumeric = ratio;
    riskRewardRatioStr = `1 : ${ratio.toFixed(2)}`;

    if (isCredit) {
      popPct = strategyDef.id === "IRON_CONDOR" ? 68 : (strategyDef.id === "BULL_PUT_SPREAD" ? 72 : 65);
      riskProfileCategory = "High Probability Credit · Capped Risk";
    } else {
      popPct = 46;
      riskProfileCategory = "Defined Debit · Trend Acceleration";
    }
  }

  if (strategyDef.id === "PROTECTIVE_COLLAR") {
    popPct = 82;
    riskProfileCategory = "Capital Preservation · Downside Floor";
  }

  const returnOnRiskPct = typeof maxProfitPerLot === 'number' && maxLossPerLot > 0
    ? `${Math.round((maxProfitPerLot / maxLossPerLot) * 100)}%`
    : "Uncapped";

  const returnOnMarginPct = isCredit
    ? `${Math.round((maxProfitPerLot / (requiredMarginPerLot || 1)) * 100)}%`
    : `${Math.round((maxProfitPerLot / (totalCashEffectPerLot || 1)) * 100)}%`;

  return {
    id: `${strategyDef.id}_${underlying.ticker}`,
    strategyId: strategyDef.id,
    strategyName: strategyDef.name,
    alias: strategyDef.alias,
    phase: strategyDef.phase,
    type: strategyDef.type,
    bias: strategyDef.bias,
    idealFor: strategyDef.idealFor,
    indianMarketApplication: strategyDef.indianMarketApplication,
    underlyingTicker: underlying.ticker,
    underlyingName: underlying.name,
    spotPrice,
    lotSize,
    legs,
    dte,
    expiryDay: weeklyExpiryDay,
    isCredit,
    netPremiumPerUnit: Math.round(netPremiumPerUnit * 100) / 100,
    totalCashEffectPerLot,
    requiredMarginPerLot,
    maxProfitPerLot,
    maxLossPerLot,
    breakevens: breakevens.map(b => typeof b === 'number' ? Math.round(b * 10) / 10 : b),
    payoffCurve,
    confidenceScore,
    riskRewardRatio: riskRewardRatioStr,
    riskRewardNumeric,
    popPct,
    riskProfileCategory,
    returnOnRiskPct,
    returnOnMarginPct,
    greeks: {
      delta: isCredit ? (strategyDef.bias.includes("BULLISH") ? "+0.18" : "-0.16") : "+0.32",
      theta: isCredit ? `+₹${Math.round(totalCashEffectPerLot * 0.15)} /day` : `-₹${Math.round(totalCashEffectPerLot * 0.12)} /day`,
      vega: strategyDef.id.includes("LONG_STRADDLE") ? "+42.5 (High Sensitivity)" : "-18.2 (Vega Hedged)"
    }
  };
}

// Generate all 10 strategic opportunities across the NSE universe
export function generateAllFoSuggestions(dte = 4) {
  const suggestions = [];

  // Match each of the 10 strategies with prime candidate underlying assets
  FO_STRATEGY_DEFINITIONS.forEach(strat => {
    let candidateUnderlying = FO_UNDERLYINGS[0]; // Default NIFTY

    if (strat.id === "BULL_CALL_SPREAD") {
      candidateUnderlying = FO_UNDERLYINGS.find(u => u.ticker === "HDFCBANK") || FO_UNDERLYINGS[0];
    } else if (strat.id === "BULL_PUT_SPREAD") {
      candidateUnderlying = FO_UNDERLYINGS.find(u => u.ticker === "NIFTY") || FO_UNDERLYINGS[0];
    } else if (strat.id === "CALL_RATIO_BACKSPREAD") {
      candidateUnderlying = FO_UNDERLYINGS.find(u => u.ticker === "TATAMOTORS") || FO_UNDERLYINGS[0];
    } else if (strat.id === "BEAR_PUT_SPREAD") {
      candidateUnderlying = FO_UNDERLYINGS.find(u => u.ticker === "TCS") || FO_UNDERLYINGS[0];
    } else if (strat.id === "BEAR_CALL_SPREAD") {
      candidateUnderlying = FO_UNDERLYINGS.find(u => u.ticker === "INFY") || FO_UNDERLYINGS[0];
    } else if (strat.id === "PROTECTIVE_COLLAR") {
      candidateUnderlying = FO_UNDERLYINGS.find(u => u.ticker === "RELIANCE") || FO_UNDERLYINGS[0];
    } else if (strat.id === "IRON_CONDOR") {
      candidateUnderlying = FO_UNDERLYINGS.find(u => u.ticker === "BANKNIFTY") || FO_UNDERLYINGS[0];
    } else if (strat.id === "SHORT_IRON_BUTTERFLY") {
      candidateUnderlying = FO_UNDERLYINGS.find(u => u.ticker === "FINNIFTY") || FO_UNDERLYINGS[0];
    } else if (strat.id === "HEDGED_STRADDLE_STRANGLE") {
      candidateUnderlying = FO_UNDERLYINGS.find(u => u.ticker === "NIFTY") || FO_UNDERLYINGS[0];
    } else if (strat.id === "LONG_STRADDLE_STRANGLE") {
      candidateUnderlying = FO_UNDERLYINGS.find(u => u.ticker === "RELIANCE") || FO_UNDERLYINGS[0];
    }

    const instance = buildStrategyInstance(strat, candidateUnderlying, dte);
    suggestions.push(instance);
  });

  return suggestions;
}
