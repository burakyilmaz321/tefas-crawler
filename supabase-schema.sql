-- ====================================
-- TEFAS Fund Dashboard - Supabase Schema
-- ====================================
-- Run this in Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → Paste & Run
-- ====================================

-- 1. Create funds table (metadata for all funds)
CREATE TABLE IF NOT EXISTS funds (
  code TEXT PRIMARY KEY,
  title TEXT,
  kind TEXT CHECK (kind IN ('YAT', 'EMK', 'BYF')),
  latest_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create historical_data table (cached time series data)
CREATE TABLE IF NOT EXISTS historical_data (
  id BIGSERIAL PRIMARY KEY,
  fund_code TEXT REFERENCES funds(code) ON DELETE CASCADE,
  date DATE NOT NULL,
  price NUMERIC,
  market_cap NUMERIC,
  investor_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fund_code, date)
);

-- Create index for fast lookups by fund and date range
CREATE INDEX IF NOT EXISTS idx_historical_fund_date
  ON historical_data(fund_code, date DESC);

-- 3. Create portfolios table (user saved portfolios)
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'My Portfolio',
  fund_list JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create index for fast user portfolio lookups
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id
  ON portfolios(user_id);

-- ====================================
-- Row Level Security (RLS) Policies
-- ====================================

-- Enable RLS on portfolios table (users can only see their own portfolios)
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own portfolios
CREATE POLICY "Users can view own portfolios"
  ON portfolios
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own portfolios
CREATE POLICY "Users can insert own portfolios"
  ON portfolios
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own portfolios
CREATE POLICY "Users can update own portfolios"
  ON portfolios
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own portfolios
CREATE POLICY "Users can delete own portfolios"
  ON portfolios
  FOR DELETE
  USING (auth.uid() = user_id);

-- ====================================
-- Public read access for funds and historical_data
-- (No RLS needed - these are public data cached from TEFAS)
-- ====================================

-- Grant public read access to funds
ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to funds"
  ON funds
  FOR SELECT
  USING (true);

-- Grant public read access to historical_data
ALTER TABLE historical_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to historical_data"
  ON historical_data
  FOR SELECT
  USING (true);

-- ====================================
-- IMPORTANT: Service role can bypass RLS
-- Backend API uses service_role key for INSERT/UPDATE/UPSERT
-- Frontend uses anon key for SELECT only
-- ====================================

-- Verification query (run after to confirm setup)
SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename IN ('funds', 'historical_data', 'portfolios')
ORDER BY tablename;
