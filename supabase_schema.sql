-- ====================================================================
-- FinanceBro Institutional Database Schema for Supabase PostgreSQL
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Portfolio & Wallet State Table
CREATE TABLE IF NOT EXISTS public.financebro_portfolio (
    id TEXT PRIMARY KEY DEFAULT 'default',
    wallet_balance NUMERIC(15, 2) NOT NULL DEFAULT 1000.00,
    initial_capital NUMERIC(15, 2) NOT NULL DEFAULT 1000.00,
    invested_capital NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Active Positions (Holdings) Table
CREATE TABLE IF NOT EXISTS public.financebro_positions (
    ticker TEXT PRIMARY KEY,
    qty INTEGER NOT NULL,
    avg_price NUMERIC(15, 2) NOT NULL,
    invested NUMERIC(15, 2) NOT NULL,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    consensus_score INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Trade Execution Ledger Table
CREATE TABLE IF NOT EXISTS public.financebro_trades (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ticker TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('BUY', 'SELL')),
    qty INTEGER NOT NULL,
    price NUMERIC(15, 2) NOT NULL,
    turnover NUMERIC(15, 2) NOT NULL,
    charges NUMERIC(15, 2) NOT NULL,
    brokerage NUMERIC(15, 2) DEFAULT 20.00,
    stt NUMERIC(15, 2) DEFAULT 0.00,
    gst NUMERIC(15, 2) DEFAULT 0.00,
    stamp_duty NUMERIC(15, 2) DEFAULT 0.00,
    pnl NUMERIC(15, 2) DEFAULT 0.00,
    consensus_score INTEGER DEFAULT 0
);

-- 5. Strategy & Custom Consensus Rules Table
CREATE TABLE IF NOT EXISTS public.financebro_rules (
    id TEXT PRIMARY KEY DEFAULT 'active_rules',
    rules JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Insert Initial Default Row if empty
INSERT INTO public.financebro_portfolio (id, wallet_balance, initial_capital, invested_capital)
VALUES ('default', 1000.00, 1000.00, 0.00)
ON CONFLICT (id) DO NOTHING;

-- 7. Enable Row Level Security (RLS) with Public Anon Policies
ALTER TABLE public.financebro_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financebro_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financebro_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financebro_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on financebro_portfolio" ON public.financebro_portfolio FOR SELECT USING (true);
CREATE POLICY "Allow public write access on financebro_portfolio" ON public.financebro_portfolio FOR ALL USING (true);

CREATE POLICY "Allow public read access on financebro_positions" ON public.financebro_positions FOR SELECT USING (true);
CREATE POLICY "Allow public write access on financebro_positions" ON public.financebro_positions FOR ALL USING (true);

CREATE POLICY "Allow public read access on financebro_trades" ON public.financebro_trades FOR SELECT USING (true);
CREATE POLICY "Allow public write access on financebro_trades" ON public.financebro_trades FOR ALL USING (true);

CREATE POLICY "Allow public read access on financebro_rules" ON public.financebro_rules FOR SELECT USING (true);
CREATE POLICY "Allow public write access on financebro_rules" ON public.financebro_rules FOR ALL USING (true);
