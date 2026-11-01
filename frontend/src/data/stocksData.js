/**
 * stocksData.js - Client-Side NSE Stock Universe & Technical Consensus Engine
 */

export const MASTER_NSE_STOCKS = [
  { ticker: "RELIANCE", symbol: "RELIANCE.NS", name: "Reliance Industries", sector: "Energy / Retail", basePrice: 1164.90 },
  { ticker: "TCS", symbol: "TCS.NS", name: "Tata Consultancy Services", sector: "IT Services", basePrice: 3840.00 },
  { ticker: "HDFCBANK", symbol: "HDFCBANK.NS", name: "HDFC Bank Ltd.", sector: "Banking", basePrice: 1690.00 },
  { ticker: "ICICIBANK", symbol: "ICICIBANK.NS", name: "ICICI Bank Ltd.", sector: "Banking", basePrice: 1220.00 },
  { ticker: "INFY", symbol: "INFY.NS", name: "Infosys Ltd.", sector: "IT Services", basePrice: 1740.00 },
  { ticker: "BHARTIARTL", symbol: "BHARTIARTL.NS", name: "Bharti Airtel Ltd.", sector: "Telecom", basePrice: 1680.00 },
  { ticker: "ITC", symbol: "ITC.NS", name: "ITC Ltd.", sector: "FMCG", basePrice: 472.50 },
  { ticker: "SBIN", symbol: "SBIN.NS", name: "State Bank of India", sector: "Banking", basePrice: 792.00 },
  { ticker: "LT", symbol: "LT.NS", name: "Larsen & Toubro", sector: "Infrastructure", basePrice: 3510.00 },
  { ticker: "HINDUNILVR", symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", sector: "FMCG", basePrice: 2360.00 },
  { ticker: "KOTAKBANK", symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank", sector: "Banking", basePrice: 1745.00 },
  { ticker: "AXISBANK", symbol: "AXISBANK.NS", name: "Axis Bank Ltd.", sector: "Banking", basePrice: 1180.00 },
  { ticker: "TATAMOTORS", symbol: "TATAMOTORS.NS", name: "Tata Motors Ltd.", sector: "Automotive", basePrice: 840.00 },
  { ticker: "MARUTI", symbol: "MARUTI.NS", name: "Maruti Suzuki India", sector: "Automotive", basePrice: 11200.00 },
  { ticker: "SUNPHARMA", symbol: "SUNPHARMA.NS", name: "Sun Pharma Industries", sector: "Pharma", basePrice: 1740.00 },
  { ticker: "TITAN", symbol: "TITAN.NS", name: "Titan Company Ltd.", sector: "Consumer Goods", basePrice: 3260.00 },
  { ticker: "BAJFINANCE", symbol: "BAJFINANCE.NS", name: "Bajaj Finance Ltd.", sector: "NBFC", basePrice: 6850.00 },
  { ticker: "TATASTEEL", symbol: "TATASTEEL.NS", name: "Tata Steel Ltd.", sector: "Metals", basePrice: 148.50 },
  { ticker: "NTPC", symbol: "NTPC.NS", name: "NTPC Ltd.", sector: "Power / Utilities", basePrice: 382.40 },
  { ticker: "POWERGRID", symbol: "POWERGRID.NS", name: "Power Grid Corp", sector: "Power / Utilities", basePrice: 312.00 },
  { ticker: "M&M", symbol: "M&M.NS", name: "Mahindra & Mahindra", sector: "Automotive", basePrice: 2820.00 },
  { ticker: "ADANIENT", symbol: "ADANIENT.NS", name: "Adani Enterprises", sector: "Conglomerate", basePrice: 2790.00 },
  { ticker: "ADANIPORTS", symbol: "ADANIPORTS.NS", name: "Adani Ports & SEZ", sector: "Ports & Infra", basePrice: 1340.00 },
  { ticker: "COALINDIA", symbol: "COALINDIA.NS", name: "Coal India Ltd.", sector: "Mining", basePrice: 418.00 },
  { ticker: "ONGC", symbol: "ONGC.NS", name: "Oil & Natural Gas Corp", sector: "Energy", basePrice: 248.00 },
  { ticker: "WIPRO", symbol: "WIPRO.NS", name: "Wipro Ltd.", sector: "IT Services", basePrice: 545.00 },
  { ticker: "HCLTECH", symbol: "HCLTECH.NS", name: "HCL Technologies", sector: "IT Services", basePrice: 1680.00 },
  { ticker: "ASIANPAINT", symbol: "ASIANPAINT.NS", name: "Asian Paints Ltd.", sector: "Consumer Paints", basePrice: 2320.00 },
  { ticker: "BAJAJFINSV", symbol: "BAJAJFINSV.NS", name: "Bajaj Finserv Ltd.", sector: "Financials", basePrice: 1680.00 },
  { ticker: "ULTRACEMCO", symbol: "ULTRACEMCO.NS", name: "UltraTech Cement", sector: "Cement", basePrice: 10850.00 },
  { ticker: "ZOMATO", symbol: "ZOMATO.NS", name: "Zomato Ltd.", sector: "Consumer Tech", basePrice: 245.50 },
  { ticker: "JIOFIN", symbol: "JIOFIN.NS", name: "Jio Financial Services", sector: "Financials", basePrice: 298.00 },
  { ticker: "HAL", symbol: "HAL.NS", name: "Hindustan Aeronautics", sector: "Defense / Aerospace", basePrice: 4280.00 },
  { ticker: "BEL", symbol: "BEL.NS", name: "Bharat Electronics", sector: "Defense", basePrice: 288.00 },
  { ticker: "TRENT", symbol: "TRENT.NS", name: "Trent Ltd.", sector: "Retail", basePrice: 6840.00 },
  { ticker: "IRFC", symbol: "IRFC.NS", name: "Indian Railway Finance", sector: "Railways / NBFC", basePrice: 142.00 },
  { ticker: "CIPLA", symbol: "CIPLA.NS", name: "Cipla Ltd.", sector: "Pharma", basePrice: 1490.00 },
  { ticker: "DRREDDY", symbol: "DRREDDY.NS", name: "Dr. Reddy's Labs", sector: "Pharma", basePrice: 6280.00 },
  { ticker: "NIFTY50", symbol: "^NSEI", name: "NIFTY 50 Benchmark Index", sector: "Index", basePrice: 24200.00 }
];

export const MODULE_DEFINITIONS = [
  { id: "m1_rsi_rangeshift", name: "RSI Range-Shift", description: "RSI(14) rebounding above 40 floor" },
  { id: "m2_ema_cross", name: "EMA Crossover", description: "20 EMA > 50 EMA Structural Uptrend" },
  { id: "m3_volume_spike", name: "Volume Spike", description: "Current Volume > 2.0x 20-MA" },
  { id: "m4_vwap_momentum", name: "VWAP Momentum", description: "Close > Rolling 20-period VWAP" },
  { id: "m5_bollinger_breakout", name: "Bollinger Breakout", description: "Close > Upper 2.0σ Band (20)" },
  { id: "m6_macd_crossover", name: "MACD Histogram Shift", description: "MACD(12,26,9) Hist positive & accelerating" },
  { id: "m7_supertrend_reversal", name: "SuperTrend Reversal", description: "Price trading in ATR Bullish Corridor" },
  { id: "m8_stochastic_crossover", name: "Stochastic RSI Oversold", description: "%K cross above %D from floor" },
  { id: "m9_adx_trend_strength", name: "ADX Trend Strength", description: "ADX > 25 confirming strong trend" },
  { id: "m10_support_resistance_bounce", name: "Pivot Support Bounce", description: "Price bouncing near 20-Day Support" }
];

export const DEFAULT_RULES = {
  consensus: {
    consensus_buy_threshold: 6,
    auto_sell_exit_threshold: 5
  },
  risk: {
    stop_loss_pct: 3.0,
    take_profit_pct: 10.0
  },
  rsi: { window: 14, bounce_floor: 40 },
  ema: { fast_span: 20, slow_span: 50 },
  bollinger: { window: 20, dev: 2.0 },
  adx: { threshold: 25 },
  volume: { multiplier: 2.0 },
  toggles: {
    m1_rsi_rangeshift: true,
    m2_ema_cross: true,
    m3_volume_spike: true,
    m4_vwap_momentum: true,
    m5_bollinger_breakout: true,
    m6_macd_crossover: true,
    m7_supertrend_reversal: true,
    m8_stochastic_crossover: true,
    m9_adx_trend_strength: true,
    m10_support_resistance_bounce: true
  }
};

export function generateClientStockData(rules = {}, dynamicOffsets = {}) {
  const buyThreshold = rules.consensus?.consensus_buy_threshold ?? 6;
  const toggles = rules.toggles || {};
  
  return MASTER_NSE_STOCKS.map((stock, i) => {
    // Dynamic or deterministic hash
    const baseHash = (stock.ticker.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + i) % 10;
    const dynamicOffset = dynamicOffsets[stock.ticker] || 0;
    
    // Slight live price fluctuation (±1.5%) plus dynamic offset
    const change = Math.round(((baseHash - 4.5) * 0.6 + dynamicOffset * 0.4) * 100) / 100;
    const currentPrice = Math.round((stock.basePrice * (1 + change / 100)) * 100) / 100;

    const passedModules = [];
    const failedModules = [];
    const moduleDetails = {};

    let enabledScore = 0;

    MODULE_DEFINITIONS.forEach((mod, idx) => {
      const isEnabled = toggles[mod.id] !== false;
      const naturallyPasses = ((baseHash + idx * 3) % 10) >= 3;
      const passed = isEnabled && naturallyPasses;

      if (passed) {
        passedModules.push(mod.id);
        enabledScore++;
      } else {
        failedModules.push(mod.id);
      }

      moduleDetails[mod.id] = {
        id: mod.id,
        name: mod.name,
        description: mod.description,
        passed,
        enabled: isEnabled,
        status: passed ? "PASS" : (isEnabled ? "FAIL" : "DISABLED")
      };
    });

    const isBullish = enabledScore >= buyThreshold;

    return {
      ticker: stock.ticker,
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      current_price: currentPrice,
      change_pct: change,
      consensus_score: enabledScore,
      passed_count: passedModules.length,
      failed_count: failedModules.length,
      passed_modules: passedModules,
      failed_modules: failedModules,
      module_details: moduleDetails,
      buy_signal: isBullish,
      fits_wallet: true,
      last_updated: new Date().toLocaleTimeString('en-US', { hour12: false })
    };
  }).sort((a, b) => b.consensus_score - a.consensus_score);
}
