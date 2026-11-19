/**
 * supabase.js - Supabase Client & Real-time Database Helpers for FinanceBro
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://oamqppsogszthhmpubto.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_bFAwxzfNmpJY5DKB7azWdQ_dGWYYHsV';

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null;

export const supabaseDb = {
  // 1. Get or Initialize Portfolio
  getPortfolio: async () => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('financebro_portfolio')
        .select('*')
        .eq('id', 'default')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (e) {
      console.warn("Supabase getPortfolio fallback:", e.message);
      return null;
    }
  },

  // 2. Save Portfolio state
  savePortfolio: async (wallet_balance, initial_capital, invested_capital = 0) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('financebro_portfolio')
        .upsert({
          id: 'default',
          wallet_balance,
          initial_capital,
          invested_capital,
          updated_at: new Date().toISOString()
        });
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase savePortfolio fallback:", e.message);
    }
  },

  // 3. Get Active Positions
  getPositions: async () => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('financebro_positions')
        .select('*');
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn("Supabase getPositions fallback:", e.message);
      return null;
    }
  },

  // 3b. Upsert Active Position
  upsertPosition: async (position) => {
    if (!supabase || !position?.ticker) return;
    try {
      const parseIso = (ts) => {
        if (!ts) return new Date().toISOString();
        const normalized = typeof ts === 'string' && ts.includes(' ') && !ts.includes('T')
          ? `${ts.replace(' ', 'T')}Z`
          : ts;
        const d = new Date(normalized);
        return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
      };
      const { error } = await supabase
        .from('financebro_positions')
        .upsert({
          ticker: position.ticker,
          qty: Math.round(position.qty),
          avg_price: position.avg_price,
          invested: position.invested,
          opened_at: parseIso(position.opened_at),
          consensus_score: position.consensus_score || 0,
          last_updated: new Date().toISOString()
        });
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase upsertPosition fallback:", e.message);
    }
  },

  // 3c. Delete Closed Position
  deletePosition: async (ticker) => {
    if (!supabase || !ticker) return;
    try {
      const { error } = await supabase
        .from('financebro_positions')
        .delete()
        .eq('ticker', ticker);
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase deletePosition fallback:", e.message);
    }
  },

  // 3d. Clear All Positions (for explicit ledger reset)
  clearPositions: async () => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('financebro_positions')
        .delete()
        .neq('ticker', '');
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase clearPositions fallback:", e.message);
    }
  },

  // 4. Record a Trade
  insertTrade: async (trade) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('financebro_trades')
        .insert([{
          id: trade.id,
          timestamp: new Date().toISOString(),
          ticker: trade.ticker,
          action: trade.action,
          qty: trade.qty,
          price: trade.price,
          turnover: trade.turnover,
          charges: trade.charges,
          brokerage: trade.breakdown?.brokerage ?? 20,
          stt: trade.breakdown?.stt ?? 0,
          gst: trade.breakdown?.gst ?? 0,
          stamp_duty: trade.breakdown?.stampDuty ?? trade.breakdown?.stamp_duty ?? 0,
          pnl: trade.pnl || 0,
          consensus_score: trade.consensus_score || 0
        }]);
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase insertTrade fallback:", e.message);
    }
  },

  // 5. Get Trade History
  getTrades: async () => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('financebro_trades')
        .select('*')
        .order('timestamp', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn("Supabase getTrades fallback:", e.message);
      return null;
    }
  },

  // 5b. Clear Trade History (for explicit ledger reset)
  clearTrades: async () => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('financebro_trades')
        .delete()
        .neq('id', '');
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase clearTrades fallback:", e.message);
    }
  },

  // 6. Save Rules
  saveRules: async (rules) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('financebro_rules')
        .upsert({
          id: 'active_rules',
          rules,
          updated_at: new Date().toISOString()
        });
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase saveRules fallback:", e.message);
    }
  },

  // 7. Get Rules
  getRules: async () => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('financebro_rules')
        .select('*')
        .eq('id', 'active_rules')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data?.rules || null;
    } catch (e) {
      console.warn("Supabase getRules fallback:", e.message);
      return null;
    }
  },

  // 8. F&O Active Positions
  getFoPositions: async () => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('financebro_fo_positions')
        .select('*');
      if (error) throw error;
      return (data || []).map(r => (r.data ? { ...r.data, id: r.id } : r));
    } catch (e) {
      console.warn("Supabase getFoPositions fallback:", e.message);
      return null;
    }
  },

  upsertFoPosition: async (position) => {
    if (!supabase || !position?.id) return;
    try {
      const { error } = await supabase
        .from('financebro_fo_positions')
        .upsert({
          id: position.id,
          data: position,
          updated_at: new Date().toISOString()
        });
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase upsertFoPosition fallback:", e.message);
    }
  },

  deleteFoPosition: async (id) => {
    if (!supabase || !id) return;
    try {
      const { error } = await supabase
        .from('financebro_fo_positions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase deleteFoPosition fallback:", e.message);
    }
  },

  clearFoPositions: async () => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('financebro_fo_positions')
        .delete()
        .neq('id', '');
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase clearFoPositions fallback:", e.message);
    }
  },

  // 9. F&O Trade History
  getFoHistory: async () => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('financebro_fo_history')
        .select('*')
        .order('timestamp', { ascending: false });
      if (error) throw error;
      return (data || []).map(r => (r.data ? { ...r.data, id: r.id } : r));
    } catch (e) {
      console.warn("Supabase getFoHistory fallback:", e.message);
      return null;
    }
  },

  insertFoTrade: async (trade) => {
    if (!supabase || !trade?.id) return;
    try {
      const { error } = await supabase
        .from('financebro_fo_history')
        .insert([{
          id: trade.id,
          data: trade,
          timestamp: new Date().toISOString(),
          realized_pnl: trade.realizedPnl || 0
        }]);
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase insertFoTrade fallback:", e.message);
    }
  },

  clearFoHistory: async () => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('financebro_fo_history')
        .delete()
        .neq('id', '');
      if (error) throw error;
    } catch (e) {
      console.warn("Supabase clearFoHistory fallback:", e.message);
    }
  },

  // 10. Live Cross-Device Realtime Subscription
  subscribeToChanges: (callback) => {
    if (!supabase) return null;
    try {
      const channel = supabase
        .channel('financebro_live_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'financebro_portfolio' }, (payload) => {
          callback('portfolio', payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'financebro_positions' }, (payload) => {
          callback('positions', payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'financebro_trades' }, (payload) => {
          callback('trades', payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'financebro_rules' }, (payload) => {
          callback('rules', payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'financebro_fo_positions' }, (payload) => {
          callback('fo_positions', payload);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'financebro_fo_history' }, (payload) => {
          callback('fo_history', payload);
        })
        .subscribe();
      return channel;
    } catch (e) {
      console.warn("Supabase Realtime subscription error:", e);
      return null;
    }
  }
};
