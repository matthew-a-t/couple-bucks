-- Add Income Tracking
-- This migration creates the incomes table for tracking user income sources

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE income_frequency AS ENUM ('weekly', 'biweekly', 'monthly');

-- =============================================
-- TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS incomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,

  -- Income details
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  source_name TEXT NOT NULL DEFAULT 'Primary Income',
  frequency income_frequency NOT NULL DEFAULT 'monthly',
  is_primary BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_incomes_profile_id ON incomes(profile_id);
CREATE INDEX idx_incomes_couple_id ON incomes(couple_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

-- Users can view their own income
CREATE POLICY "Users can view their own income"
  ON incomes FOR SELECT
  USING (auth.uid() = profile_id);

-- Users can view their partner's income
CREATE POLICY "Users can view their partner's income"
  ON incomes FOR SELECT
  USING (
    couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

-- Users can create their own income
CREATE POLICY "Users can create their own income"
  ON incomes FOR INSERT
  WITH CHECK (
    auth.uid() = profile_id AND
    couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

-- Users can update their own income
CREATE POLICY "Users can update their own income"
  ON incomes FOR UPDATE
  USING (auth.uid() = profile_id);

-- Managers can update any income in their couple
CREATE POLICY "Managers can update partner income"
  ON incomes FOR UPDATE
  USING (
    couple_id IN (
      SELECT couple_id FROM profiles
      WHERE id = auth.uid() AND permission_tier = 'manager'
    )
  );

-- Users can delete their own income
CREATE POLICY "Users can delete their own income"
  ON incomes FOR DELETE
  USING (auth.uid() = profile_id);

-- Managers can delete any income in their couple
CREATE POLICY "Managers can delete partner income"
  ON incomes FOR DELETE
  USING (
    couple_id IN (
      SELECT couple_id FROM profiles
      WHERE id = auth.uid() AND permission_tier = 'manager'
    )
  );

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER update_incomes_updated_at
  BEFORE UPDATE ON incomes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
