-- Add Budget History Tracking
-- This migration creates the budget_history table for archiving budget periods

-- =============================================
-- TABLES
-- =============================================

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

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_budget_history_budget_id ON budget_history(budget_id);
CREATE INDEX idx_budget_history_couple_id ON budget_history(couple_id);
CREATE INDEX idx_budget_history_period_start ON budget_history(period_start DESC);
CREATE INDEX idx_budget_history_category ON budget_history(category);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE budget_history ENABLE ROW LEVEL SECURITY;

-- Users can view their couple's budget history
CREATE POLICY "Users can view their couple's budget history"
  ON budget_history FOR SELECT
  USING (
    couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

-- Only managers can insert budget history (automated process)
CREATE POLICY "Managers can create budget history"
  ON budget_history FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT couple_id FROM profiles
      WHERE id = auth.uid() AND permission_tier = 'manager'
    )
  );

-- Budget history should not be updated (read-only archive)
-- No UPDATE or DELETE policies - history is immutable once created
