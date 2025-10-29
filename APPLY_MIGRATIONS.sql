-- =============================================
-- CONSOLIDATED MIGRATION: Income Tracking + Monthly Budgets
-- Run this entire file in your Supabase SQL Editor
-- =============================================

-- =============================================
-- MIGRATION 1: Add Income Tracking
-- =============================================

-- Create income frequency enum
CREATE TYPE income_frequency AS ENUM ('weekly', 'biweekly', 'monthly');

-- Create incomes table
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

-- Create indexes for incomes
CREATE INDEX idx_incomes_profile_id ON incomes(profile_id);
CREATE INDEX idx_incomes_couple_id ON incomes(couple_id);

-- Enable RLS on incomes
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for incomes
CREATE POLICY "Users can view their own income"
  ON incomes FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can view their partner's income"
  ON incomes FOR SELECT
  USING (
    couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create their own income"
  ON incomes FOR INSERT
  WITH CHECK (
    auth.uid() = profile_id AND
    couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their own income"
  ON incomes FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "Managers can update partner income"
  ON incomes FOR UPDATE
  USING (
    couple_id IN (
      SELECT couple_id FROM profiles
      WHERE id = auth.uid() AND permission_tier = 'manager'
    )
  );

CREATE POLICY "Users can delete their own income"
  ON incomes FOR DELETE
  USING (auth.uid() = profile_id);

CREATE POLICY "Managers can delete partner income"
  ON incomes FOR DELETE
  USING (
    couple_id IN (
      SELECT couple_id FROM profiles
      WHERE id = auth.uid() AND permission_tier = 'manager'
    )
  );

-- Add trigger for updated_at on incomes
CREATE TRIGGER update_incomes_updated_at
  BEFORE UPDATE ON incomes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- MIGRATION 2: Add Budget History Tracking
-- =============================================

-- Create budget_history table
CREATE TABLE IF NOT EXISTS budget_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,

  -- Period information
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Budget snapshot
  category TEXT NOT NULL,
  limit_amount DECIMAL(10, 2) NOT NULL CHECK (limit_amount > 0),
  total_spent DECIMAL(10, 2) NOT NULL CHECK (total_spent >= 0),
  expenses_count INTEGER DEFAULT 0 CHECK (expenses_count >= 0),

  -- Status at period end
  status TEXT NOT NULL CHECK (status IN ('success', 'warning', 'error')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate history records for same budget period
  UNIQUE(budget_id, period_start, period_end)
);

-- Create indexes for budget_history
CREATE INDEX idx_budget_history_budget_id ON budget_history(budget_id);
CREATE INDEX idx_budget_history_couple_id ON budget_history(couple_id);
CREATE INDEX idx_budget_history_period_start ON budget_history(period_start DESC);
CREATE INDEX idx_budget_history_category ON budget_history(category);

-- Enable RLS on budget_history
ALTER TABLE budget_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for budget_history
CREATE POLICY "Users can view their couple's budget history"
  ON budget_history FOR SELECT
  USING (
    couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Managers can create budget history"
  ON budget_history FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT couple_id FROM profiles
      WHERE id = auth.uid() AND permission_tier = 'manager'
    )
  );

-- =============================================
-- MIGRATION 3: Update Budgets for Monthly Periods
-- =============================================

-- Add period columns to budgets table
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS period_type VARCHAR(20) DEFAULT 'monthly' CHECK (period_type IN ('monthly'));
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS period_start_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE);
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS auto_reset_enabled BOOLEAN DEFAULT true;

-- Migrate existing budget data
UPDATE budgets
SET
  period_type = 'monthly',
  period_start_date = DATE_TRUNC('month', CURRENT_DATE),
  auto_reset_enabled = true
WHERE period_start_date IS NULL;

-- Add helpful comments
COMMENT ON TABLE budgets IS 'Monthly budgets with automatic reset and history tracking';
COMMENT ON COLUMN budgets.period_type IS 'Budget period type - currently only "monthly" is supported';
COMMENT ON COLUMN budgets.period_start_date IS 'Start date of the current budget period (first day of the month)';
COMMENT ON COLUMN budgets.auto_reset_enabled IS 'Whether budget automatically resets at the start of each period';
COMMENT ON COLUMN budgets.current_spent IS 'Current spending in this period (calculated from expenses, may be denormalized)';

-- Create index for period queries
CREATE INDEX IF NOT EXISTS idx_budgets_period_start ON budgets(period_start_date DESC);

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- You should see: "Success. No rows returned"
-- If you see any errors, check the error message and verify your database state
