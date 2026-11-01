import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import HeaderToolbar from './components/HeaderToolbar';
import Watchlist from './components/Watchlist';
import ConsensusInspector from './components/ConsensusInspector';
import PortfolioLedger from './components/PortfolioLedger';
import TerminalLogs from './components/TerminalLogs';
import RulesModal from './components/RulesModal';
import OrderModal from './components/OrderModal';
import MarketStatusModal from './components/MarketStatusModal';
import DerivativesDashboard from './components/DerivativesDashboard';
import { Zap, BarChart3, ArrowRight } from 'lucide-react';
import { api, getWsUrl, IS_STANDALONE } from './api';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [stocks, setStocks] = useState([]);
  const [selectedTicker, setSelectedTicker] = useState('RELIANCE');
  const [stockDetail, setStockDetail] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [rules, setRules] = useState(null);
  const [logs, setLogs] = useState([]);

  const [walletBalance, setWalletBalance] = useState(100000.0);
  const [filterAffordable, setFilterAffordable] = useState(false);
  const [autoExit, setAutoExit] = useState(true);

  const [loadingStocks, setLoadingStocks] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);
  const [simulationPaused, setSimulationPaused] = useState(false);
  const [marketStatus, setMarketStatus] = useState(() => api.getMarketStatus());

  const [tradeModal, setTradeModal] = useState({
    isOpen: false,
    ticker: 'RELIANCE',
    price: 0,
    action: 'BUY',
    holding: 0
  });

  const [foPositionsCount, setFoPositionsCount] = useState(0);

  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);

  // Keep IST market clock updated every second
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setMarketStatus(api.getMarketStatus());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const handleToggleSimulation = () => {
    const nextPaused = !simulationPaused;
    api.toggleSimulation(!nextPaused);
    setSimulationPaused(nextPaused);
    setMarketStatus(api.getMarketStatus());
  };

  // 1. Initial Data Fetch
  useEffect(() => {
    loadInitialData();
    if (!IS_STANDALONE) {
      setupWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingStocks(true);
      const [cfgRes, stocksRes, portRes, logsRes, foPosRes] = await Promise.all([
        api.getConfig(),
        api.getStocks(),
        api.getPortfolio(),
        api.getLogs(),
        api.getFoPositions()
      ]);

      setRules(cfgRes.rules);
      setStocks(stocksRes.stocks || []);
      setPortfolio(portRes);
      setWalletBalance(portRes.wallet_balance || 100000.0);
      setLogs(logsRes.logs || []);
      setFoPositionsCount(foPosRes ? foPosRes.length : 0);

      if (stocksRes.stocks && stocksRes.stocks.length > 0) {
        const initial = stocksRes.stocks[0].ticker;
        setSelectedTicker(initial);
        loadStockDetail(initial);
      }
    } catch (err) {
      console.error("Initialization error:", err);
    } finally {
      setLoadingStocks(false);
    }
  };

  // 2. Real-time Market Pulse (Tick simulation)
  useEffect(() => {
    const pulseTimer = setInterval(async () => {
      api.tickMarket();
      try {
        const stocksRes = await api.getStocks();
        setStocks(stocksRes.stocks || []);
        if (selectedTicker) {
          const detail = await api.getStockDetail(selectedTicker);
          setStockDetail(detail);
        }
        const portRes = await api.getPortfolio();
        setPortfolio(portRes);

        const foPos = await api.getFoPositions();
        setFoPositionsCount(foPos ? foPos.length : 0);
      } catch (e) {}
    }, 6000);

    return () => clearInterval(pulseTimer);
  }, [selectedTicker]);

  // 3. Setup WebSocket Connection if running against external server
  const setupWebSocket = () => {
    const url = getWsUrl();
    if (!url) return;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'PULSE') {
            if (data.wallet_balance != null) {
              setWalletBalance(data.wallet_balance);
            }
            if (data.latest_log) {
              setLogs(prev => [...prev.slice(-150), data.latest_log]);
            }
            if (data.auto_exits && data.auto_exits.length > 0) {
              refreshPortfolio();
            }
          } else if (data.type === 'STOCKS_UPDATE') {
            if (data.stocks) setStocks(data.stocks);
          }
        } catch (e) {
          console.error("WS Parse error:", e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(setupWebSocket, 5000);
      };

      ws.onerror = () => {
        setWsConnected(false);
      };
    } catch (err) {
      console.error("WS setup error:", err);
      setTimeout(setupWebSocket, 5000);
    }
  };

  // 4. Automated Risk Management: Autonomous Auto-Exit Watcher Loop (Equity + F&O)
  useEffect(() => {
    if (!autoExit) return;

    const intervalId = setInterval(async () => {
      // 4A. Check Equity Positions Auto-Exit (Stop-loss, Take-profit, Severe breakdown)
      if (portfolio && portfolio.positions && portfolio.positions.length > 0) {
        const stopLossPct = rules?.risk?.stop_loss_pct ?? 3.0;
        const takeProfitPct = rules?.risk?.take_profit_pct ?? 10.0;

        for (const pos of [...portfolio.positions]) {
          try {
            const detail = await api.getStockDetail(pos.ticker);
            if (!detail) continue;

            const currentPrice = detail.current_price;
            const score = detail.consensus_score;
            const pnlPct = ((currentPrice - pos.avg_price) / pos.avg_price) * 100;

            let exitReason = null;
            if (pnlPct <= -Math.abs(stopLossPct)) {
              exitReason = `EQUITY STOP-LOSS TRIGGERED (${pnlPct.toFixed(2)}% <= -${stopLossPct}%)`;
            } else if (takeProfitPct > 0 && pnlPct >= takeProfitPct) {
              exitReason = `EQUITY TAKE-PROFIT TARGET REACHED (+${pnlPct.toFixed(2)}% >= +${takeProfitPct}%)`;
            } else if (score <= 2) {
              // Only trigger on severe bearish consensus breakdown (score <= 2/10) so manual holdings aren't immediately dumped
              exitReason = `SEVERE CONSENSUS BREAKDOWN (${score}/10 <= 2/10)`;
            }

            if (exitReason) {
              await handleExecuteOrder({
                ticker: pos.ticker,
                action: 'SELL',
                qty: pos.qty,
                price: currentPrice,
                exitReason,
                autoExited: true
              });
              setLogs(prev => [
                ...prev.slice(-150),
                `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] ⚠️ [AUTO-EXIT: ${exitReason}] Liquidated ${pos.qty}x ${pos.ticker} @ ₹${currentPrice.toFixed(2)}.`
              ]);
              break;
            }
          } catch (e) {}
        }
      }

      // 4B. Check F&O Spreads Auto-Exit
      try {
        const foPos = await api.getFoPositions();
        const foRules = await api.getFoRules();

        if (foPos && foPos.length > 0 && foRules && foRules.auto_exit_enabled) {
          for (const pos of foPos) {
            let foExitReason = null;
            const currentPnl = pos.unrealizedPnl || 0;

            if (typeof pos.maxProfit === 'number' && pos.maxProfit > 0) {
              const tpLimit = pos.maxProfit * (foRules.take_profit_target_pct / 100);
              if (currentPnl >= tpLimit) {
                foExitReason = `F&O TAKE-PROFIT TARGET REACHED (+₹${currentPnl.toFixed(2)} >= ${foRules.take_profit_target_pct}% of Max Profit)`;
              }
            }

            const maxAllowedLoss = (pos.premiumCashEffect || pos.totalMarginRequired || 1000) * (foRules.stop_loss_limit_pct / 100);
            if (!foExitReason && currentPnl <= -Math.abs(maxAllowedLoss)) {
              foExitReason = `F&O STOP-LOSS BREACH (-₹${Math.abs(currentPnl).toFixed(2)} >= ${foRules.stop_loss_limit_pct}% Risk Threshold)`;
            }

            if (!foExitReason && foRules.expiry_auto_squareoff && pos.dte <= 0) {
              foExitReason = `SEBI PHYSICAL DELIVERY SAFETY AUTO-SQUAREOFF (Expiry Zero-Hour)`;
            }

            if (foExitReason) {
              await api.exitFoStrategy(pos.id, foExitReason);
              await refreshPortfolio();
              const updatedFo = await api.getFoPositions();
              setFoPositionsCount(updatedFo ? updatedFo.length : 0);
              break;
            }
          }
        }
      } catch (e) {}
    }, 5000);

    return () => clearInterval(intervalId);
  }, [autoExit, portfolio, rules]);

  const loadStockDetail = async (ticker) => {
    try {
      const detail = await api.getStockDetail(ticker);
      setStockDetail(detail);
    } catch (err) {
      console.error("Error loading stock detail:", err);
    }
  };

  const handleSelectStock = (ticker) => {
    setSelectedTicker(ticker);
    loadStockDetail(ticker);
  };

  const refreshStocks = async () => {
    setLoadingStocks(true);
    try {
      const res = await api.getStocks();
      setStocks(res.stocks || []);
      if (selectedTicker) {
        loadStockDetail(selectedTicker);
      }
      refreshPortfolio();
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setLoadingStocks(false);
    }
  };

  const refreshPortfolio = async () => {
    try {
      const [portRes, logsRes, foPosRes] = await Promise.all([
        api.getPortfolio(),
        api.getLogs(),
        api.getFoPositions()
      ]);
      setPortfolio(portRes);
      setWalletBalance(portRes.wallet_balance);
      setLogs(logsRes.logs || []);
      setFoPositionsCount(foPosRes ? foPosRes.length : 0);
    } catch (e) {}
  };

  // Trade Modal Handler
  const handleOpenTrade = (ticker, price, action = 'BUY', holding = 0) => {
    let currentHolding = holding;
    if (portfolio && portfolio.positions) {
      const pos = portfolio.positions.find(p => p.ticker === ticker);
      if (pos) currentHolding = pos.qty;
    }

    setTradeModal({
      isOpen: true,
      ticker,
      price: price || (stockDetail ? stockDetail.current_price : 0),
      action,
      holding: currentHolding
    });
  };

  const handleExecuteOrder = async (orderPayload) => {
    const res = await api.executeOrder(orderPayload);
    await refreshPortfolio();
    if (selectedTicker) {
      loadStockDetail(selectedTicker);
    }
    return res;
  };

  // Strategy & Rules Handlers
  const handleSaveRules = async (newRules) => {
    const res = await api.updateConfig(newRules);
    setRules(res.rules);
    await refreshStocks();
  };

  const handleResetRules = async () => {
    const res = await api.resetConfig();
    setRules(res.rules);
    await refreshStocks();
  };

  const handleResetPortfolio = async (capital = 100000) => {
    await api.resetPortfolio(capital);
    await refreshPortfolio();
  };

  const handleSeedDemoPortfolio = async () => {
    await api.seedDemoPortfolio();
    await refreshPortfolio();
    const stocksRes = await api.getStocks();
    setStocks(stocksRes.stocks || []);
  };

  // Determine current screen from location
  const isDerivatives = location.pathname.includes('/derivatives') || location.pathname.includes('/options');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Controls with HashRouter Mode Switching */}
      <HeaderToolbar
        currentScreen={isDerivatives ? 'OPTIONS' : 'EQUITY'}
        walletBalance={walletBalance}
        onResetWallet={handleResetPortfolio}
        onSeedDemo={handleSeedDemoPortfolio}
        filterAffordable={filterAffordable}
        onToggleAffordable={setFilterAffordable}
        autoExit={autoExit}
        onToggleAutoExit={setAutoExit}
        onOpenRules={() => setIsRulesOpen(true)}
        onRefreshStocks={refreshStocks}
        loadingStocks={loadingStocks}
        wsConnected={wsConnected}
        foPositionsCount={foPositionsCount}
        marketStatus={marketStatus}
        simulationPaused={simulationPaused}
        onToggleSimulation={handleToggleSimulation}
        onOpenMarketInfo={() => setIsMarketModalOpen(true)}
      />

      {/* Main Grid Workspace with HashRouter Routes */}
      <main style={{ padding: '1.25rem 1.5rem', maxWidth: 1720, margin: '0 auto', width: '100%', flex: 1 }}>
        <Routes>
          {/* Default & Cash Equity Dashboard View */}
          <Route
            path="/"
            element={
              <div>
                {/* High Visibility F&O Quick Switcher Banner */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(2, 132, 199, 0.14) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: 14,
                  padding: '0.85rem 1.25rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                      flexShrink: 0
                    }}>
                      <Zap size={22} color="#ffffff" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f8fafc' }}>
                          Institutional Futures & Options (F&O) Terminal
                        </span>
                        <span className="badge-tag badge-emerald" style={{ fontSize: '0.65rem', fontWeight: 800 }}>
                          10 SPREAD STRATEGIES READY
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: 2, marginBottom: 0 }}>
                        Bull Call/Put Spreads, Ratio Backspreads, Bear Spreads, Iron Condor, Iron Butterfly, Hedged Straddles/Strangles with Payoff Curves & Auto-Exit.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/derivatives')}
                    className="btn"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.6rem 1.15rem',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    <span>Switch to F&O Terminal</span>
                    <ArrowRight size={16} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.25rem' }}>
                  <Watchlist
                    stocks={stocks}
                    selectedTicker={selectedTicker}
                    onSelectStock={handleSelectStock}
                    walletBalance={walletBalance}
                    filterAffordable={filterAffordable}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <ConsensusInspector
                      stockDetail={stockDetail}
                      onOpenTrade={handleOpenTrade}
                      walletBalance={walletBalance}
                    />

                    <PortfolioLedger
                      portfolio={portfolio}
                      autoExit={autoExit}
                      onOpenTrade={handleOpenTrade}
                      onResetPortfolio={() => handleResetPortfolio(100000)}
                      onSeedDemo={handleSeedDemoPortfolio}
                    />

                    <TerminalLogs logs={logs} />
                  </div>
                </div>
              </div>
            }
          />

          <Route
            path="/equity"
            element={
              <Navigate to="/" replace />
            }
          />

          {/* New 'Derivatives Strategy' Dashboard View */}
          <Route
            path="/derivatives"
            element={
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <DerivativesDashboard
                  walletBalance={walletBalance}
                  onRefreshWallet={refreshPortfolio}
                  onAddLog={(log) => setLogs(prev => [...prev.slice(-150), log])}
                />

                <TerminalLogs logs={logs} />
              </div>
            }
          />

          <Route
            path="/options"
            element={
              <Navigate to="/derivatives" replace />
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Floating Quick Terminal Switcher Dock */}
      <div style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 999
      }}>
        {location.pathname.includes('/derivatives') || location.pathname.includes('/options') ? (
          <button
            onClick={() => navigate('/equity')}
            className="btn"
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              padding: '0.65rem 1.15rem',
              borderRadius: 30,
              fontWeight: 700,
              fontSize: '0.82rem',
              boxShadow: '0 6px 22px rgba(2, 132, 199, 0.5)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <BarChart3 size={16} />
            <span>Switch to Cash Equity</span>
          </button>
        ) : (
          <button
            onClick={() => navigate('/derivatives')}
            className="btn"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              padding: '0.65rem 1.15rem',
              borderRadius: 30,
              fontWeight: 700,
              fontSize: '0.82rem',
              boxShadow: '0 6px 22px rgba(16, 185, 129, 0.5)',
              border: '1px solid rgba(52, 211, 153, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <Zap size={16} />
            <span>⚡ F&O Derivatives Terminal</span>
          </button>
        )}
      </div>

      {/* Equity Strategy & Rules Configuration Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
        rules={rules}
        onSave={handleSaveRules}
        onReset={handleResetRules}
      />

      {/* 1-Click Equity Order Execution Modal */}
      <OrderModal
        isOpen={tradeModal.isOpen}
        onClose={() => setTradeModal(prev => ({ ...prev, isOpen: false }))}
        ticker={tradeModal.ticker}
        currentPrice={tradeModal.price}
        defaultAction={tradeModal.action}
        walletBalance={walletBalance}
        currentHolding={tradeModal.holding}
        onExecute={handleExecuteOrder}
      />

      {/* NSE Market Status & Simulator Explanation Modal */}
      <MarketStatusModal
        isOpen={isMarketModalOpen}
        onClose={() => setIsMarketModalOpen(false)}
        marketStatus={marketStatus}
        simulationPaused={simulationPaused}
        onToggleSimulation={handleToggleSimulation}
      />
    </div>
  );
}
