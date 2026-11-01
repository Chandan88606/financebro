/**
 * supabase.js - Supabase Client & Real-time Database Helpers for FinanceBro
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://oamqppsogszthhmpubto.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_bFAwxzfNmpJY5DKB7azWdQ_dGWYYHsV';

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
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
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('financebro_positions')
        .select('*');
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn("Supabase getPositions fallback:", e.message);
      return [];
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
          brokerage: trade.breakdown?.brokerage || 20,
          stt: trade.breakdown?.stt || 0,
          gst: trade.breakdown?.gst || 0,
          stamp_duty: trade.breakdown?.stamp_duty || 0,
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
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('financebro_trades')
        .select('*')
        .order('timestamp', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn("Supabase getTrades fallback:", e.message);
      return [];
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
  }
};
