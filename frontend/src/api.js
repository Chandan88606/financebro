/**
 * api.js - Centralized API & WebSocket Connector for FinanceBro Backend
 */

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  // If served on standard port in production or dev proxy
  if (window.location.port === '3000') {
    return 'http://localhost:8000';
  }
  return window.location.origin;
};

export const API_BASE = getApiBase();

export const getWsUrl = () => {
  const base = API_BASE.replace(/^http/, 'ws');
  return `${base}/ws/feed`;
};

// Generic fetch handler with error messaging
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });
    if (!res.ok) {
      let errDetail = `HTTP ${res.status}`;
      try {
        const data = await res.json();
        errDetail = data.detail || errDetail;
      } catch (e) {}
      throw new Error(errDetail);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  getHealth: () => request('/api/health'),
  getConfig: () => request('/api/config'),
  updateConfig: (rules) => request('/api/config', {
    method: 'POST',
    body: JSON.stringify({ rules })
  }),
  resetConfig: () => request('/api/config/reset', { method: 'POST' }),
  
  getStocks: (params = {}) => {
    const query = new URLSearchParams();
    if (params.max_price != null) query.append('max_price', params.max_price);
    if (params.query) query.append('query', params.query);
    const qs = query.toString();
    return request(`/api/stocks${qs ? `?${qs}` : ''}`);
  },

  getStockDetail: (ticker) => request(`/api/stock/${ticker}`),
  getStockCandles: (ticker, period = '6mo', interval = '1d') =>
    request(`/api/stock/${ticker}/candles?period=${period}&interval=${interval}`),

  getPortfolio: () => request('/api/portfolio'),
  executeOrder: (order) => request('/api/order/execute', {
    method: 'POST',
    body: JSON.stringify(order)
  }),
  resetPortfolio: (initial_capital = 1000) => request('/api/portfolio/reset', {
    method: 'POST',
    body: JSON.stringify({ initial_capital })
  }),

  getLogs: () => request('/api/logs')
};
