/**
 * api.js - Centralized Algorithmic Engine & API Connector for FinanceBro
 * Institutional Paper Trading, 10-Module Technical Consensus, NSE F&O Strategy Engine
 */

import { generateClientStockData, MASTER_NSE_STOCKS, DEFAULT_RULES } from './data/stocksData';
import { generateAllFoSuggestions, buildStrategyInstance, FO_UNDERLYINGS, FO_STRATEGY_DEFINITIONS, updateFoSpotPrices } from './data/optionsData';
import { supabaseDb } from './supabase';

const getApiBase = () => {
  if (typeof window !== 'undefined' && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  return '';
};

export const API_BASE = getApiBase();
export const IS_STANDALONE = !API_BASE;

export const getWsUrl = () => {
  if (IS_STANDALONE) return null;
  const base = API_BASE.replace(/^http/, 'ws');
  return `${base}/ws/feed`;
};

// Safe localStorage helper
const STORAGE_KEYS = {
  PORTFOLIO: 'financebro_portfolio_v2',
  RULES: 'financebro_rules_v2',
  LOGS: 'financebro_logs_v2',
  FO_POSITIONS: 'financebro_fo_positions_v2',
  FO_RULES: 'financebro_fo_rules_v2',
  FO_HISTORY: 'financebro_fo_history_v2'
};

const loadStorage = (key, fallback) => {
  try {
    let val = null;
    if (typeof localStorage !== 'undefined') {
      val = localStorage.getItem(key);
    }
    if (!val && typeof sessionStorage !== 'undefined') {
      val = sessionStorage.getItem(key);
    }
    if (!val) return fallback;
    const parsed = JSON.parse(val);
    if (fallback && typeof fallback === 'object' && !Array.isArray(fallback)) {
      return {
        ...fallback,
        ...parsed,
        positions: Array.isArray(parsed?.positions) ? parsed.positions : (fallback.positions || []),
        history: Array.isArray(parsed?.history) ? parsed.history : (fallback.history || [])
      };
    }
    return parsed;
  } catch (e) {
    return fallback;
  }
};

const saveStorage = (key, data) => {
  try {
    const serialized = JSON.stringify(data);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, serialized);
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(key, serialized);
    }
  } catch (e) {
    // Ignore storage quota errors
  }
};

// Indian statutory fee calculations for Equity
export const calculateIndianCharges = (turnover, action = 'BUY') => {
  turnover = Math.max(0, turnover);
  const brokerage = turnover > 0 ? (turnover < 66666 ? Math.min(20, turnover * 0.0003) : 20.0) : 0;
  const stt = turnover * 0.001; // 0.1% on equity delivery
  const exchangeFee = turnover * 0.0000345;
  const gst = (brokerage + exchangeFee) * 0.18;
  const stampDuty = action === 'BUY' ? turnover * 0.00015 : 0.0;
  const sebiFee = turnover * 0.000001;

  const totalCharges = Math.round((brokerage + stt + exchangeFee + gst + stampDuty + sebiFee) * 100) / 100;
  return {
    brokerage: Math.round(brokerage * 100) / 100,
    stt: Math.round(stt * 100) / 100,
    exchangeFee: Math.round(exchangeFee * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    stampDuty: Math.round(stampDuty * 100) / 100,
    sebiFee: Math.round(sebiFee * 100) / 100,
    total: totalCharges
  };
};

// Indian F&O statutory fee calculation (NSE Options rules: flat ₹20 brokerage/order, STT on sell side only 0.0625%, GST 18%, Stamp duty 0.003%)
export const calculateFoCharges = (legsCount = 2, premiumTurnover = 5000, lots = 1) => {
  const brokerage = legsCount * 20.0; // Flat ₹20 per executed option order leg
  const stt = (premiumTurnover * 0.000625); // 0.0625% on option sell premium
  const exchangeFee = premiumTurnover * 0.0005;
  const gst = (brokerage + exchangeFee) * 0.18;
  const stampDuty = premiumTurnover * 0.00003;
  const sebiFee = premiumTurnover * 0.000001;

  const total = Math.round((brokerage + stt + exchangeFee + gst + stampDuty + sebiFee) * 100) / 100;
  return {
    brokerage,
    stt: Math.round(stt * 100) / 100,
    exchangeFee: Math.round(exchangeFee * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    stampDuty: Math.round(stampDuty * 100) / 100,
    total
  };
};

// Initialize in-memory state with localStorage fallback
let localPortfolio = loadStorage(STORAGE_KEYS.PORTFOLIO, {
  wallet_balance: 100000.0,
  initial_capital: 100000.0,
  invested_capital: 0.0,
  current_portfolio_value: 0.0,
  total_equity: 100000.0,
  unrealized_pnl: 0.0,
  realized_pnl: 0.0,
  net_pnl: 0.0,
  roi_pct: 0.0,
  total_charges_paid: 0.0,
  positions: [],
  history: []
});

let localRules = loadStorage(STORAGE_KEYS.RULES, DEFAULT_RULES);

// F&O Default Auto-Exit and Risk Rules
export const DEFAULT_FO_RULES = {
  take_profit_target_pct: 50.0,   // Take profit when 50% max profit is reached
  stop_loss_limit_pct: 100.0,     // Auto-cut when loss hits 1x premium/margin limit
  expiry_auto_squareoff: true,    // Exit 1h before market close on expiry day to avoid physical delivery
  auto_exit_enabled: true
};

let localFoRules = loadStorage(STORAGE_KEYS.FO_RULES, DEFAULT_FO_RULES);
let localFoPositions = loadStorage(STORAGE_KEYS.FO_POSITIONS, []);
let localFoHistory = loadStorage(STORAGE_KEYS.FO_HISTORY, []);

let localLogs = loadStorage(STORAGE_KEYS.LOGS, [
  `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] FinanceBro Institutional Terminal initialized. Real Market Mode active. Official NSE closing LTP & 1-minute silent live feed enabled.`
]);

// Real-time live quotes memory cache with local persistence
let livePriceCache = loadStorage('financebro_live_quotes', {});
updateFoSpotPrices(livePriceCache);

export const getIndianMarketStatus = () => {
  // IST is UTC + 5:30
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istDate = new Date(utc + (3600000 * 5.5));

  const day = istDate.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = istDate.getHours();
  const minute = istDate.getMinutes();
  const timeInMinutes = hour * 60 + minute;

  const isWeekday = day >= 1 && day <= 5;
  // NSE Regular trading hours: 09:15 to 15:30 IST (555 to 930 mins)
  const isMarketHours = isWeekday && (timeInMinutes >= 555 && timeInMinutes <= 930);

  const istFormatted = istDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  let nextOpenText = 'Monday 09:15 AM IST';
  if (isWeekday) {
    if (timeInMinutes < 555) {
      nextOpenText = 'Today at 09:15 AM IST';
    } else if (day === 5 && timeInMinutes > 930) {
      nextOpenText = 'Monday at 09:15 AM IST';
    } else if (timeInMinutes > 930) {
      nextOpenText = 'Tomorrow at 09:15 AM IST';
    }
  }

  const statusText = isMarketHours
    ? 'MARKET IS OPEN (09:15 - 15:30 IST)'
    : (day === 0 || day === 6
        ? 'MARKET IS CLOSED (WEEKEND)'
        : (timeInMinutes < 555 ? 'MARKET IS CLOSED (PRE-MARKET)' : 'MARKET IS CLOSED (SESSION ENDED)'));

  return {
    isOpen: isMarketHours,
    isClosed: !isMarketHours,
    isWeekend: day === 0 || day === 6,
    istTimeString: istFormatted,
    dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day],
    statusText,
    nextOpenText,
    exchange: 'National Stock Exchange of India (NSE)',
    notice: isMarketHours
      ? 'Official trading session is actively underway.'
      : 'Trading session is currently closed. Showing official NSE closing prices (LTP). No simulated fluctuations.'
  };
};

export const api = {
  getMarketStatus: () => {
    return getIndianMarketStatus();
  },

  // 1-Minute Silent Real-time Quote Engine
  fetchLiveQuotes: async (symbolsToFetch = null) => {
    try {
      const watchlistTickers = MASTER_NSE_STOCKS.map(s => s.ticker);
      const foTickers = FO_UNDERLYINGS.map(u => u.ticker);
      const holdingTickers = (localPortfolio?.positions || []).map(p => p.ticker);

      const all = Array.from(new Set([...holdingTickers, ...foTickers, ...watchlistTickers]));
      const symbols = symbolsToFetch || all;

      // Parallel batch fetching
      const BATCH_SIZE = 6;
      for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
        const batch = symbols.slice(i, i + BATCH_SIZE);
        await Promise.allSettled(batch.map(async (ticker) => {
          const stockMeta = MASTER_NSE_STOCKS.find(s => s.ticker === ticker);
          const foMeta = FO_UNDERLYINGS.find(u => u.ticker === ticker);
          const symbol = stockMeta?.symbol || foMeta?.symbol || (ticker.startsWith('^') ? ticker : `${ticker}.NS`);

          try {
            let res = null;
            // 1. Try Vite dev server proxy first (/api/yahoo)
            try {
              res = await fetch(`/api/yahoo/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`, {
                headers: { 'Accept': 'application/json' }
              });
            } catch (e) {}

            // 2. Direct fallback
            if (!res || !res.ok) {
              try {
                res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`);
              } catch (e) {}
            }

            // 3. Browser CORS Proxy Fallback
            if (!res || !res.ok) {
              try {
                const target = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`;
                res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`);
              } catch (e) {}
            }

            if (res && res.ok) {
              try {
                const text = await res.text();
                const trimmed = (text || '').trim();
                if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                  const data = JSON.parse(trimmed);
                  const meta = data?.chart?.result?.[0]?.meta;
                  if (meta && typeof meta.regularMarketPrice === 'number' && meta.regularMarketPrice > 0) {
                    const price = Math.round(meta.regularMarketPrice * 100) / 100;
                    const prevClose = Math.round((meta.chartPreviousClose || meta.previousClose || price) * 100) / 100;
                    const changePct = prevClose > 0 ? Math.round(((price - prevClose) / prevClose) * 10000) / 100 : 0.0;
                    const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false });

                    const quote = {
                      ticker,
                      symbol,
                      price,
                      prevClose,
                      changePct,
                      updatedAt: `${nowTime} (Live)`,
                      timestamp: Date.now()
                    };

                    livePriceCache[ticker] = quote;
                    livePriceCache[symbol] = quote;
                  }
                }
              } catch (parseErr) {}
            }
          } catch (err) {}
        }));
      }

      saveStorage('financebro_live_quotes', livePriceCache);
      updateFoSpotPrices(livePriceCache);
      return livePriceCache;
    } catch (e) {
      return livePriceCache;
    }
  },

  getLiveQuotes: () => livePriceCache,

  getHealth: async () => {
    return {
      status: "online",
      service: "FinanceBro Institutional Engine",
      market_status: getIndianMarketStatus(),
      wallet_balance: localPortfolio.wallet_balance,
      stocks_tracked: MASTER_NSE_STOCKS.length,
      fo_underlyings_tracked: FO_UNDERLYINGS.length,
      timestamp: new Date().toISOString()
    };
  },

  getConfig: async () => {
    try {
      const supaRules = await supabaseDb.getRules();
      if (supaRules) {
        localRules = supaRules;
        saveStorage(STORAGE_KEYS.RULES, localRules);
      }
    } catch (e) {}
    return { rules: localRules, defaults: DEFAULT_RULES };
  },

  updateConfig: async (rules) => {
    localRules = rules;
    saveStorage(STORAGE_KEYS.RULES, localRules);
    await supabaseDb.saveRules(rules);
    const log = `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] ⚙️ Strategy parameters & consensus thresholds updated.`;
    localLogs.push(log);
    saveStorage(STORAGE_KEYS.LOGS, localLogs.slice(-150));
    return { success: true, rules: localRules };
  },

  resetConfig: async () => {
    localRules = JSON.parse(JSON.stringify(DEFAULT_RULES));
    saveStorage(STORAGE_KEYS.RULES, localRules);
    await supabaseDb.saveRules(localRules);
    const log = `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] ⚙️ Strategy parameters reset to factory defaults.`;
    localLogs.push(log);
    saveStorage(STORAGE_KEYS.LOGS, localLogs.slice(-150));
    return { success: true, rules: localRules };
  },

  getStocks: async (params = {}) => {
    const stocks = generateClientStockData(localRules, livePriceCache);
    let filtered = stocks;

    if (params.max_price != null && params.max_price > 0) {
      filtered = filtered.filter(s => s.current_price <= params.max_price);
    }

    if (params.query) {
      const q = params.query.toLowerCase().trim();
      filtered = filtered.filter(s =>
        s.ticker.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q)
      );
    }

    return {
      count: filtered.length,
      wallet_balance: localPortfolio.wallet_balance,
      stocks: filtered
    };
  },

  getStockDetail: async (ticker) => {
    const stocks = generateClientStockData(localRules, livePriceCache);
    const found = stocks.find(s => s.ticker.toUpperCase() === ticker.toUpperCase()) || stocks[0];
    return found;
  },

  getPortfolio: async () => {
    localPortfolio = loadStorage(STORAGE_KEYS.PORTFOLIO, localPortfolio);
    if (!Array.isArray(localPortfolio.positions)) localPortfolio.positions = [];
    if (!Array.isArray(localPortfolio.history)) localPortfolio.history = [];
    const stocks = generateClientStockData(localRules, livePriceCache);
    const stockMap = {};
    stocks.forEach(s => { stockMap[s.ticker] = s.current_price; });

    let currentVal = 0.0;
    let totalInvested = 0.0;
    let unrealized = 0.0;

    localPortfolio.positions.forEach(pos => {
      const curPrice = stockMap[pos.ticker] || pos.avg_price;
      pos.current_price = curPrice;
      const posValue = Math.round(pos.qty * curPrice * 100) / 100;
      currentVal += posValue;
      totalInvested += pos.invested;

      const pnl = Math.round((posValue - pos.invested) * 100) / 100;
      pos.unrealized_pnl = pnl;
      pos.unrealized_pnl_pct = pos.invested > 0 ? Math.round(((posValue - pos.invested) / pos.invested) * 10000) / 100 : 0.0;
      unrealized += pnl;
    });

    currentVal = Math.round(currentVal * 100) / 100;
    totalInvested = Math.round(totalInvested * 100) / 100;
    unrealized = Math.round(unrealized * 100) / 100;

    // Add F&O unrealized PnL to total equity
    let foUnrealized = 0;
    localFoPositions.forEach(p => {
      foUnrealized += (p.unrealizedPnl || 0);
    });

    const totalEquity = Math.round((localPortfolio.wallet_balance + currentVal + foUnrealized) * 100) / 100;
    const netPnl = Math.round((unrealized + foUnrealized + localPortfolio.realized_pnl - localPortfolio.total_charges_paid) * 100) / 100;
    const initial = localPortfolio.initial_capital || 100000.0;
    const roiPct = Math.round((netPnl / initial) * 10000) / 100;

    localPortfolio.invested_capital = totalInvested;
    localPortfolio.current_portfolio_value = currentVal;
    localPortfolio.total_equity = totalEquity;
    localPortfolio.unrealized_pnl = unrealized;
    localPortfolio.net_pnl = netPnl;
    localPortfolio.roi_pct = roiPct;

    saveStorage(STORAGE_KEYS.PORTFOLIO, localPortfolio);
    return localPortfolio;
  },

  executeOrder: async (order) => {
    localPortfolio = loadStorage(STORAGE_KEYS.PORTFOLIO, localPortfolio);
    if (!Array.isArray(localPortfolio.positions)) localPortfolio.positions = [];
    if (!Array.isArray(localPortfolio.history)) localPortfolio.history = [];
    const { ticker, action, qty, price, exitReason, autoExited } = order;
    if (!qty || qty <= 0) throw new Error("Quantity must be greater than 0");
    if (!price || price <= 0) throw new Error("Price must be greater than 0");

    const turnover = Math.round(qty * price * 100) / 100;
    const chargesBreakdown = calculateIndianCharges(turnover, action);
    const totalCharges = chargesBreakdown.total;

    const tradeRecord = {
      id: `TRD-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ticker,
      action: action.toUpperCase(),
      qty: parseInt(qty, 10),
      price: Math.round(price * 100) / 100,
      turnover,
      charges: totalCharges,
      breakdown: chargesBreakdown,
      pnl: 0.0,
      exitReason: exitReason || null,
      autoExited: !!autoExited
    };

    if (action.toUpperCase() === 'BUY') {
      const totalReq = Math.round((turnover + totalCharges) * 100) / 100;
      if (totalReq > localPortfolio.wallet_balance) {
        throw new Error(`Insufficient funds. Required: ₹${totalReq.toFixed(2)} (Turnover + Taxes), Available: ₹${localPortfolio.wallet_balance.toFixed(2)}`);
      }

      localPortfolio.wallet_balance = Math.round((localPortfolio.wallet_balance - totalReq) * 100) / 100;
      localPortfolio.total_charges_paid = Math.round(((localPortfolio.total_charges_paid || 0) + totalCharges) * 100) / 100;
      tradeRecord.closing_balance = localPortfolio.wallet_balance;

      const existing = localPortfolio.positions.find(p => p.ticker === ticker);
      if (existing) {
        const newTotalQty = existing.qty + qty;
        const newTotalCost = existing.invested + turnover;
        existing.avg_price = Math.round((newTotalCost / newTotalQty) * 100) / 100;
        existing.qty = newTotalQty;
        existing.invested = Math.round(newTotalQty * existing.avg_price * 100) / 100;
        existing.last_updated = tradeRecord.timestamp;
      } else {
        localPortfolio.positions.push({
          ticker,
          qty,
          avg_price: price,
          current_price: price,
          invested: turnover,
          unrealized_pnl: 0.0,
          unrealized_pnl_pct: 0.0,
          opened_at: tradeRecord.timestamp
        });
      }

      const log = `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] 🟢 [BUY ORDER] ${qty}x ${ticker} @ ₹${price.toFixed(2)} | Turnover: ₹${turnover.toFixed(2)} | Fees: ₹${totalCharges.toFixed(2)} | Cash: ₹${localPortfolio.wallet_balance.toFixed(2)}`;
      localLogs.push(log);
    } else {
      const idx = localPortfolio.positions.findIndex(p => p.ticker === ticker);
      if (idx < 0) {
        throw new Error(`You have no active position in ${ticker} to sell.`);
      }

      const pos = localPortfolio.positions[idx];
      if (qty > pos.qty) {
        throw new Error(`Cannot sell ${qty} shares. Current holding is ${pos.qty}.`);
      }

      const netProceeds = Math.round((turnover - totalCharges) * 100) / 100;
      const costBasis = Math.round(qty * pos.avg_price * 100) / 100;
      const pnl = Math.round((netProceeds - costBasis) * 100) / 100;
      tradeRecord.pnl = pnl;

      localPortfolio.wallet_balance = Math.round((localPortfolio.wallet_balance + netProceeds) * 100) / 100;
      localPortfolio.realized_pnl = Math.round(((localPortfolio.realized_pnl || 0) + pnl) * 100) / 100;
      localPortfolio.total_charges_paid = Math.round(((localPortfolio.total_charges_paid || 0) + totalCharges) * 100) / 100;
      tradeRecord.closing_balance = localPortfolio.wallet_balance;

      if (qty >= pos.qty) {
        localPortfolio.positions.splice(idx, 1);
      } else {
        pos.qty -= qty;
        pos.invested = Math.round(pos.qty * pos.avg_price * 100) / 100;
      }

      const reasonTag = exitReason ? ` [${exitReason}]` : '';
      const log = `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] 🔴 [SELL ORDER${reasonTag}] ${qty}x ${ticker} @ ₹${price.toFixed(2)} | Realized P&L: ₹${pnl.toFixed(2)} | Fees: ₹${totalCharges.toFixed(2)} | Cash: ₹${localPortfolio.wallet_balance.toFixed(2)}`;
      localLogs.push(log);
    }

    localPortfolio.history.unshift(tradeRecord);
    saveStorage(STORAGE_KEYS.PORTFOLIO, localPortfolio);
    saveStorage(STORAGE_KEYS.LOGS, localLogs.slice(-150));
    supabaseDb.insertTrade(tradeRecord);
    supabaseDb.savePortfolio(localPortfolio.wallet_balance, localPortfolio.initial_capital);

    return { success: true, trade: tradeRecord };
  },

  resetPortfolio: async (initial_capital = 100000) => {
    localPortfolio = {
      wallet_balance: initial_capital,
      initial_capital: initial_capital,
      invested_capital: 0.0,
      current_portfolio_value: 0.0,
      total_equity: initial_capital,
      unrealized_pnl: 0.0,
      realized_pnl: 0.0,
      net_pnl: 0.0,
      roi_pct: 0.0,
      total_charges_paid: 0.0,
      positions: [],
      history: []
    };

    localFoPositions = [];
    localFoHistory = [];

    saveStorage(STORAGE_KEYS.PORTFOLIO, localPortfolio);
    saveStorage(STORAGE_KEYS.FO_POSITIONS, localFoPositions);
    saveStorage(STORAGE_KEYS.FO_HISTORY, localFoHistory);

    const log = `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] 🔄 Full portfolio & F&O ledger reset to ₹${initial_capital.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`;
    localLogs.push(log);
    saveStorage(STORAGE_KEYS.LOGS, localLogs.slice(-150));

    await supabaseDb.savePortfolio(initial_capital, initial_capital);
    return { success: true, wallet_balance: initial_capital };
  },

  seedDemoPortfolio: async () => {
    const now = new Date();
    const timeStr = (minsAgo) => {
      const d = new Date(now.getTime() - minsAgo * 60000);
      return d.toISOString().replace('T', ' ').substring(0, 19);
    };

    const demoPositions = [
      {
        ticker: "RELIANCE",
        qty: 15,
        avg_price: 1285.00,
        current_price: 1306.20,
        invested: 17220.00,
        unrealized_pnl: 253.50,
        unrealized_pnl_pct: 1.47,
        opened_at: timeStr(45)
      },
      {
        ticker: "TATASTEEL",
        qty: 100,
        avg_price: 144.20,
        current_price: 148.50,
        invested: 14420.00,
        unrealized_pnl: 430.00,
        unrealized_pnl_pct: 2.98,
        opened_at: timeStr(72)
      },
      {
        ticker: "INFY",
        qty: 12,
        avg_price: 1712.00,
        current_price: 1740.00,
        invested: 20544.00,
        unrealized_pnl: 336.00,
        unrealized_pnl_pct: 1.64,
        opened_at: timeStr(95)
      },
      {
        ticker: "HDFCBANK",
        qty: 10,
        avg_price: 1660.00,
        current_price: 1690.00,
        invested: 16600.00,
        unrealized_pnl: 300.00,
        unrealized_pnl_pct: 1.81,
        opened_at: timeStr(130)
      }
    ];

    const demoHistory = [
      {
        id: `TRD-${Date.now() - 1200000}`,
        timestamp: timeStr(20),
        ticker: "TCS",
        action: "SELL",
        qty: 5,
        price: 3890.00,
        turnover: 19450.00,
        charges: 39.45,
        pnl: 840.00,
        exitReason: "EQUITY TAKE-PROFIT TARGET REACHED (+4.51%)",
        autoExited: true
      },
      {
        id: `TRD-${Date.now() - 2700000}`,
        timestamp: timeStr(45),
        ticker: "RELIANCE",
        action: "BUY",
        qty: 15,
        price: 1148.00,
        turnover: 17220.00,
        charges: 38.10,
        pnl: 0.0,
        exitReason: null,
        autoExited: false
      },
      {
        id: `TRD-${Date.now() - 4320000}`,
        timestamp: timeStr(72),
        ticker: "TATASTEEL",
        action: "BUY",
        qty: 100,
        price: 144.20,
        turnover: 14420.00,
        charges: 35.20,
        pnl: 0.0,
        exitReason: null,
        autoExited: false
      },
      {
        id: `TRD-${Date.now() - 5700000}`,
        timestamp: timeStr(95),
        ticker: "INFY",
        action: "BUY",
        qty: 12,
        price: 1712.00,
        turnover: 20544.00,
        charges: 43.60,
        pnl: 0.0,
        exitReason: null,
        autoExited: false
      },
      {
        id: `TRD-${Date.now() - 7800000}`,
        timestamp: timeStr(130),
        ticker: "HDFCBANK",
        action: "BUY",
        qty: 10,
        price: 1660.00,
        turnover: 16600.00,
        charges: 38.80,
        pnl: 0.0,
        exitReason: null,
        autoExited: false
      },
      {
        id: `TRD-${Date.now() - 10800000}`,
        timestamp: timeStr(180),
        ticker: "BHARTIARTL",
        action: "SELL",
        qty: 10,
        price: 1685.00,
        turnover: 16850.00,
        charges: 36.50,
        pnl: 460.00,
        exitReason: "MANUAL",
        autoExited: false
      }
    ];

    const demoFoPositions = [
      {
        id: `FO-${Date.now() - 3600000}`,
        timestamp: timeStr(60),
        strategyId: "IRON_CONDOR",
        strategyName: "Iron Condor",
        alias: "Weekly Expiry Range Trading",
        phase: "Phase 3: Sideways & High-IV",
        underlyingTicker: "NIFTY",
        underlyingName: "NIFTY 50 Index",
        spotPriceAtEntry: 23053.10,
        lots: 1,
        lotSize: 50,
        legs: [
          { strike: 22700, optionType: 'PE', action: 'BUY', premium: 24.5, qtyRatio: 1, label: 'OTM Put Wing (Protection)' },
          { strike: 22900, optionType: 'PE', action: 'SELL', premium: 64.2, qtyRatio: 1, label: 'Short OTM Put (Credit Decay)' },
          { strike: 23200, optionType: 'CE', action: 'SELL', premium: 68.0, qtyRatio: 1, label: 'Short OTM Call (Credit Decay)' },
          { strike: 23400, optionType: 'CE', action: 'BUY', premium: 26.5, qtyRatio: 1, label: 'OTM Call Wing (Protection)' }
        ],
        isCredit: true,
        entryNetPremium: 81.2,
        premiumCashEffect: 4060.00,
        totalMarginRequired: 42000,
        maxProfit: 4060.00,
        maxLoss: 5940.00,
        breakevens: [22818.8, 23281.2],
        dte: 4,
        expiryDay: "Thursday",
        chargesPaid: 108.50,
        unrealizedPnl: 1450.00,
        unrealizedPnlPct: 3.45
      },
      {
        id: `FO-${Date.now() - 7200000}`,
        timestamp: timeStr(120),
        strategyId: "BULL_CALL_SPREAD",
        strategyName: "Bull Call Spread",
        alias: "Vertical Debit Spread",
        phase: "Phase 1: Bull Market Setups",
        underlyingTicker: "BANKNIFTY",
        underlyingName: "NIFTY Bank Index",
        spotPriceAtEntry: 54686.95,
        lots: 1,
        lotSize: 30,
        legs: [
          { strike: 54300, optionType: 'CE', action: 'BUY', premium: 420.0, qtyRatio: 1, label: 'ITM Long Call' },
          { strike: 55000, optionType: 'CE', action: 'SELL', premium: 185.0, qtyRatio: 1, label: 'OTM Short Call (Theta Hedge)' }
        ],
        isCredit: false,
        entryNetPremium: 235.0,
        premiumCashEffect: 7050.00,
        totalMarginRequired: 22500,
        maxProfit: 13950.00,
        maxLoss: 7050.00,
        breakevens: [54535.0],
        dte: 3,
        expiryDay: "Wednesday",
        chargesPaid: 58.20,
        unrealizedPnl: 2100.00,
        unrealizedPnlPct: 9.33
      }
    ];

    const demoFoHistory = [
      {
        id: `FO-HIST-${Date.now() - 86400000}`,
        timestamp: timeStr(1440),
        exitTimestamp: timeStr(720),
        strategyId: "BULL_PUT_SPREAD",
        strategyName: "Bull Put Spread",
        alias: "Credit Put Spread",
        phase: "Phase 1: Bull Market Setups",
        underlyingTicker: "NIFTY",
        underlyingName: "NIFTY 50 Index",
        lots: 1,
        lotSize: 50,
        exitReason: "TAKE-PROFIT TARGET REACHED (+50% Max Profit)",
        realizedPnl: 2400.00,
        exitCharges: 52.30
      }
    ];

    localPortfolio = {
      wallet_balance: 38450.0,
      initial_capital: 100000.0,
      invested_capital: 70621.50,
      current_portfolio_value: 71912.50,
      total_equity: 113912.50,
      unrealized_pnl: 1291.00,
      realized_pnl: 1300.00,
      net_pnl: 2353.95,
      roi_pct: 2.35,
      total_charges_paid: 237.05,
      positions: demoPositions,
      history: demoHistory
    };

    localFoPositions = demoFoPositions;
    localFoHistory = demoFoHistory;

    localLogs.push(`[${new Date().toLocaleTimeString('en-US', { hour12: false })}] ⚡ Institutional Demo Portfolio loaded: 4 NSE Equity holdings (RELIANCE, TATASTEEL, INFY, HDFCBANK) and 2 F&O strategies (NIFTY Iron Condor, BANKNIFTY Bull Call Spread).`);

    saveStorage(STORAGE_KEYS.PORTFOLIO, localPortfolio);
    saveStorage(STORAGE_KEYS.FO_POSITIONS, localFoPositions);
    saveStorage(STORAGE_KEYS.FO_HISTORY, localFoHistory);
    saveStorage(STORAGE_KEYS.LOGS, localLogs.slice(-150));

    return { success: true, portfolio: localPortfolio, foPositions: localFoPositions };
  },

  getLogs: async () => {
    return { count: localLogs.length, logs: localLogs };
  },

  // Authentic Real Market Mode: Zero simulated fluctuations or synthetic drift
  tickMarket: () => {
    // Strictly preserve authentic official NSE closing prices (LTP) without manipulation
    return;
  },

  // ==========================================
  // FUTURES & OPTIONS (F&O) DERIVATIVES APIS
  // ==========================================
  getFoSuggestions: async (dte = 4) => {
    updateFoSpotPrices(livePriceCache);
    return generateAllFoSuggestions(dte, livePriceCache);
  },

  getFoPositions: async () => {
    return localFoPositions;
  },

  getFoRules: async () => {
    return localFoRules;
  },

  updateFoRules: async (rules) => {
    localFoRules = rules;
    saveStorage(STORAGE_KEYS.FO_RULES, localFoRules);
    localLogs.push(`[${new Date().toLocaleTimeString('en-US', { hour12: false })}] ⚙️ F&O auto-exit rules updated: Take Profit @ ${rules.take_profit_target_pct}%, Stop Loss @ ${rules.stop_loss_limit_pct}%.`);
    saveStorage(STORAGE_KEYS.LOGS, localLogs.slice(-150));
    return { success: true, rules: localFoRules };
  },

  executeFoStrategy: async ({ strategyInstance, lots = 1 }) => {
    const totalLots = Math.max(1, parseInt(lots, 10));
    const totalMargin = Math.round(strategyInstance.requiredMarginPerLot * totalLots);
    const premiumTurnover = Math.round(strategyInstance.totalCashEffectPerLot * totalLots);
    const charges = calculateFoCharges(strategyInstance.legs.length, premiumTurnover, totalLots);

    const cashNeeded = strategyInstance.isCredit ? charges.total : (premiumTurnover + charges.total);

    if (strategyInstance.isCredit) {
      if (totalMargin > localPortfolio.wallet_balance) {
        throw new Error(`Insufficient margin. SEBI Span Margin Required: ₹${totalMargin.toLocaleString('en-IN')}, Available: ₹${localPortfolio.wallet_balance.toLocaleString('en-IN')}`);
      }
    } else {
      if (cashNeeded > localPortfolio.wallet_balance) {
        throw new Error(`Insufficient funds. Net Premium + Charges Required: ₹${cashNeeded.toLocaleString('en-IN')}, Available: ₹${localPortfolio.wallet_balance.toLocaleString('en-IN')}`);
      }
    }

    // Block required margin / deduct cash
    localPortfolio.wallet_balance = Math.round((localPortfolio.wallet_balance - cashNeeded) * 100) / 100;
    localPortfolio.total_charges_paid = Math.round(((localPortfolio.total_charges_paid || 0) + charges.total) * 100) / 100;

    const newPosition = {
      id: `FO-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      strategyId: strategyInstance.strategyId,
      strategyName: strategyInstance.strategyName,
      alias: strategyInstance.alias,
      phase: strategyInstance.phase,
      underlyingTicker: strategyInstance.underlyingTicker,
      underlyingName: strategyInstance.underlyingName,
      spotPriceAtEntry: strategyInstance.spotPrice,
      lots: totalLots,
      lotSize: strategyInstance.lotSize,
      legs: strategyInstance.legs,
      isCredit: strategyInstance.isCredit,
      entryNetPremium: strategyInstance.netPremiumPerUnit,
      premiumCashEffect: premiumTurnover,
      totalMarginRequired: totalMargin,
      maxProfit: typeof strategyInstance.maxProfitPerLot === 'number' ? strategyInstance.maxProfitPerLot * totalLots : 'UNLIMITED',
      maxLoss: strategyInstance.maxLossPerLot * totalLots,
      breakevens: strategyInstance.breakevens,
      dte: strategyInstance.dte,
      expiryDay: strategyInstance.expiryDay,
      chargesPaid: charges.total,
      unrealizedPnl: 0.0,
      unrealizedPnlPct: 0.0
    };

    localFoPositions.unshift(newPosition);

    const log = `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] ⚡ [F&O STRATEGY DEPLOYED] ${totalLots}x ${strategyInstance.strategyName} on ${strategyInstance.underlyingTicker} | Margin: ₹${totalMargin.toLocaleString('en-IN')} | Net ${strategyInstance.isCredit ? 'Credit' : 'Debit'}: ₹${premiumTurnover.toFixed(2)}`;
    localLogs.push(log);

    saveStorage(STORAGE_KEYS.PORTFOLIO, localPortfolio);
    saveStorage(STORAGE_KEYS.FO_POSITIONS, localFoPositions);
    saveStorage(STORAGE_KEYS.LOGS, localLogs.slice(-150));

    return { success: true, position: newPosition };
  },

  exitFoStrategy: async (positionId, exitReason = "MANUAL_SQUAREOFF") => {
    const idx = localFoPositions.findIndex(p => p.id === positionId);
    if (idx < 0) throw new Error("F&O position not found");

    const pos = localFoPositions[idx];
    const exitCharges = calculateFoCharges(pos.legs.length, Math.abs(pos.unrealizedPnl), pos.lots);
    const finalRealizedPnl = Math.round((pos.unrealizedPnl - exitCharges.total) * 100) / 100;

    // Release margin and add/deduct realized P&L
    if (pos.isCredit) {
      localPortfolio.wallet_balance = Math.round((localPortfolio.wallet_balance + pos.premiumCashEffect + finalRealizedPnl) * 100) / 100;
    } else {
      localPortfolio.wallet_balance = Math.round((localPortfolio.wallet_balance + pos.premiumCashEffect + finalRealizedPnl) * 100) / 100;
    }

    localPortfolio.realized_pnl = Math.round(((localPortfolio.realized_pnl || 0) + finalRealizedPnl) * 100) / 100;
    localPortfolio.total_charges_paid = Math.round(((localPortfolio.total_charges_paid || 0) + exitCharges.total) * 100) / 100;

    const closedRecord = {
      ...pos,
      exitTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      exitReason,
      realizedPnl: finalRealizedPnl,
      exitCharges: exitCharges.total
    };

    localFoHistory.unshift(closedRecord);
    localFoPositions.splice(idx, 1);

    const log = `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] 🏁 [F&O POSITION CLOSED: ${exitReason}] ${pos.strategyName} (${pos.underlyingTicker}) | Realized P&L: ₹${finalRealizedPnl.toFixed(2)}`;
    localLogs.push(log);

    saveStorage(STORAGE_KEYS.PORTFOLIO, localPortfolio);
    saveStorage(STORAGE_KEYS.FO_POSITIONS, localFoPositions);
    saveStorage(STORAGE_KEYS.FO_HISTORY, localFoHistory);
    saveStorage(STORAGE_KEYS.LOGS, localLogs.slice(-150));

    return { success: true, closedRecord };
  }
};
