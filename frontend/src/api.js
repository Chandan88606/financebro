/**
 * api.js - Centralized Algorithmic Engine & API Connector for FinanceBro
 * Institutional Paper Trading, 10-Module Technical Consensus, NSE F&O Strategy Engine
 */

import { generateClientStockData, MASTER_NSE_STOCKS, DEFAULT_RULES } from './data/stocksData';
import { generateAllFoSuggestions, buildStrategyInstance, FO_UNDERLYINGS, FO_STRATEGY_DEFINITIONS } from './data/optionsData';
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
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    return fallback;
  }
};

const saveStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
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
  `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] FinanceBro Institutional Terminal initialized. High-frequency consensus & F&O derivatives engine active.`
]);

// Dynamic offsets for live price ticks
const priceOffsets = {};

export const api = {
  getHealth: async () => {
    return {
      status: "online",
      service: "FinanceBro Institutional Engine",
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
    const stocks = generateClientStockData(localRules, priceOffsets);
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
    const stocks = generateClientStockData(localRules, priceOffsets);
    const found = stocks.find(s => s.ticker.toUpperCase() === ticker.toUpperCase()) || stocks[0];
    return found;
  },

  getPortfolio: async () => {
    const stocks = generateClientStockData(localRules, priceOffsets);
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
    const { ticker, action, qty, price } = order;
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
      pnl: 0.0
    };

    if (action.toUpperCase() === 'BUY') {
      const totalReq = Math.round((turnover + totalCharges) * 100) / 100;
      if (totalReq > localPortfolio.wallet_balance) {
        throw new Error(`Insufficient funds. Required: ₹${totalReq.toFixed(2)} (Turnover + Taxes), Available: ₹${localPortfolio.wallet_balance.toFixed(2)}`);
      }

      localPortfolio.wallet_balance = Math.round((localPortfolio.wallet_balance - totalReq) * 100) / 100;
      localPortfolio.total_charges_paid = Math.round(((localPortfolio.total_charges_paid || 0) + totalCharges) * 100) / 100;

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

      if (qty >= pos.qty) {
        localPortfolio.positions.splice(idx, 1);
      } else {
        pos.qty -= qty;
        pos.invested = Math.round(pos.qty * pos.avg_price * 100) / 100;
      }

      const log = `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] 🔴 [SELL ORDER] ${qty}x ${ticker} @ ₹${price.toFixed(2)} | Realized P&L: ₹${pnl.toFixed(2)} | Fees: ₹${totalCharges.toFixed(2)} | Cash: ₹${localPortfolio.wallet_balance.toFixed(2)}`;
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

  getLogs: async () => {
    return { count: localLogs.length, logs: localLogs };
  },

  // Fluctuate prices slightly to simulate live NSE market feed ticks
  tickMarket: () => {
    MASTER_NSE_STOCKS.forEach(stock => {
      const prev = priceOffsets[stock.ticker] || 0;
      const drift = (Math.random() - 0.49) * 0.4;
      const next = Math.max(-2.5, Math.min(2.5, prev + drift));
      priceOffsets[stock.ticker] = Math.round(next * 100) / 100;
    });

    // Also update F&O positions P&L via time decay and spot delta drift
    if (localFoPositions.length > 0) {
      localFoPositions.forEach(pos => {
        // Credit spreads gain theta value; debit spreads gain with directional movement
        const thetaPerTick = pos.isCredit ? 18.0 * pos.lots : -12.0 * pos.lots;
        const randomDrift = (Math.random() - 0.47) * 45.0 * pos.lots;
        const currentPnl = Math.round(((pos.unrealizedPnl || 0) + thetaPerTick + randomDrift) * 100) / 100;
        
        // Capped by max profit / max loss
        if (typeof pos.maxProfit === 'number') {
          pos.unrealizedPnl = Math.min(pos.maxProfit, Math.max(-pos.maxLoss, currentPnl));
        } else {
          pos.unrealizedPnl = Math.max(-pos.maxLoss, currentPnl);
        }

        pos.unrealizedPnlPct = pos.totalMarginRequired > 0
          ? Math.round((pos.unrealizedPnl / pos.totalMarginRequired) * 10000) / 100
          : 0.0;
      });
      saveStorage(STORAGE_KEYS.FO_POSITIONS, localFoPositions);
    }
  },

  // ==========================================
  // FUTURES & OPTIONS (F&O) DERIVATIVES APIS
  // ==========================================
  getFoSuggestions: async (dte = 4) => {
    return generateAllFoSuggestions(dte);
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
