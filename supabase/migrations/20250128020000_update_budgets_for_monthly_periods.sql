-- Update Budgets Table for Monthly Periods
-- This migration converts "ongoing" budgets to monthly budgets with period tracking

-- =============================================
-- ADD NEW COLUMNS
-- =============================================

-- Add period_type column (defaulting to 'monthly')
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS period_type VARCHAR(20) DEFAULT 'monthly' CHECK (period_type IN ('monthly'));

-- Add period_start_date column (start of current budget period)
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS period_start_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE);

-- Add auto_reset_enabled column (automatic monthly reset)
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS auto_reset_enabled BOOLEAN DEFAULT true;

-- =============================================
-- MIGRATE EXISTING DATA
-- =============================================

-- For all existing budgets, set the period_start_date to the beginning of the current month
-- This formalizes the current behavior where budgets only count current month expenses
UPDATE budgets
SET
  period_type = 'monthly',
  period_start_date = DATE_TRUNC('month', CURRENT_DATE),
  auto_reset_enabled = true
WHERE period_start_date IS NULL;

-- =============================================
-- CLEANUP OLD COLUMNS
-- =============================================

-- Drop the last_reset_at column as it's replaced by period_start_date
-- Commenting this out for now to avoid data loss - can be dropped after verifying migration
-- ALTER TABLE budgets DROP COLUMN IF EXISTS last_reset_at;

-- Update comment on the budgets table
COMMENT ON TABLE budgets IS 'Monthly budgets with automatic reset and history tracking';
COMMENT ON COLUMN budgets.period_type IS 'Budget period type - currently only "monthly" is supported';
COMMENT ON COLUMN budgets.period_start_date IS 'Start date of the current budget period (first day of the month)';
COMMENT ON COLUMN budgets.auto_reset_enabled IS 'Whether budget automatically resets at the start of each period';
COMMENT ON COLUMN budgets.current_spent IS 'Current spending in this period (calculated from expenses, may be denormalized)';

-- =============================================
-- ADD INDEX FOR PERIOD QUERIES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_budgets_period_start ON budgets(period_start_date DESC);
