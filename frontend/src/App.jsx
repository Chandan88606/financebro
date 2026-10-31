import React, { useState, useEffect, useRef } from 'react';
import HeaderToolbar from './components/HeaderToolbar';
import Watchlist from './components/Watchlist';
import ConsensusInspector from './components/ConsensusInspector';
import PortfolioLedger from './components/PortfolioLedger';
import TerminalLogs from './components/TerminalLogs';
import RulesModal from './components/RulesModal';
import OrderModal from './components/OrderModal';
import { api, getWsUrl } from './api';

export default function App() {
  const [stocks, setStocks] = useState([]);
  const [selectedTicker, setSelectedTicker] = useState('RELIANCE');
  const [stockDetail, setStockDetail] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [rules, setRules] = useState(null);
  const [logs, setLogs] = useState([]);

  const [walletBalance, setWalletBalance] = useState(1000.0);
  const [filterAffordable, setFilterAffordable] = useState(true);
  const [autoExit, setAutoExit] = useState(true);

  const [loadingStocks, setLoadingStocks] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [tradeModal, setTradeModal] = useState({
    isOpen: false,
    ticker: 'RELIANCE',
    price: 0,
    action: 'BUY',
    holding: 0
  });

  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);

  // 1. Initial Data Fetch
  useEffect(() => {
    loadInitialData();
    setupWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingStocks(true);
      const [cfgRes, stocksRes, portRes, logsRes] = await Promise.all([
        api.getConfig(),
        api.getStocks(),
        api.getPortfolio(),
        api.getLogs()
      ]);

      setRules(cfgRes.rules);
      setStocks(stocksRes.stocks || []);
      setPortfolio(portRes);
      setWalletBalance(portRes.wallet_balance || 1000.0);
      setLogs(logsRes.logs || []);

      // Select initial stock
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

  // 2. Setup WebSocket Real-Time Connection
  const setupWebSocket = () => {
    try {
      const ws = new WebSocket(getWsUrl());
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
              // Refresh portfolio if auto-exits triggered
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
        // Auto-reconnect after 4s
        setTimeout(setupWebSocket, 4000);
      };

      ws.onerror = () => {
        setWsConnected(false);
      };
    } catch (err) {
      console.error("WS setup error:", err);
      setTimeout(setupWebSocket, 4000);
    }
  };

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
      const [portRes, logsRes] = await Promise.all([
        api.getPortfolio(),
        api.getLogs()
      ]);
      setPortfolio(portRes);
      setWalletBalance(portRes.wallet_balance);
      setLogs(logsRes.logs || []);
    } catch (e) {}
  };

  // Trade Modal Handler
  const handleOpenTrade = (ticker, price, action = 'BUY', holding = 0) => {
    // If holding not passed, look up from portfolio
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

  const handleResetPortfolio = async (capital = 1000) => {
    await api.resetPortfolio(capital);
    await refreshPortfolio();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Controls */}
      <HeaderToolbar
        walletBalance={walletBalance}
        onResetWallet={handleResetPortfolio}
        filterAffordable={filterAffordable}
        onToggleAffordable={setFilterAffordable}
        autoExit={autoExit}
        onToggleAutoExit={setAutoExit}
        onOpenRules={() => setIsRulesOpen(true)}
        onRefreshStocks={refreshStocks}
        loadingStocks={loadingStocks}
        wsConnected={wsConnected}
      />

      {/* Main Grid Workspace */}
      <main className="main-layout">
        {/* Left Column: Watchlist & Universal Search */}
        <Watchlist
          stocks={stocks}
          selectedTicker={selectedTicker}
          onSelectStock={handleSelectStock}
          walletBalance={walletBalance}
          filterAffordable={filterAffordable}
        />

        {/* Right Column: Inspector, Candlestick Chart, Portfolio, and Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <ConsensusInspector
            stockDetail={stockDetail}
            onOpenTrade={handleOpenTrade}
            walletBalance={walletBalance}
          />

          <PortfolioLedger
            portfolio={portfolio}
            onOpenTrade={handleOpenTrade}
            onResetPortfolio={() => handleResetPortfolio(1000)}
          />

          <TerminalLogs logs={logs} />
        </div>
      </main>

      {/* Strategy & Rules Configuration Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
        rules={rules}
        onSave={handleSaveRules}
        onReset={handleResetRules}
      />

      {/* 1-Click Order Execution Modal */}
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
    </div>
  );
}
