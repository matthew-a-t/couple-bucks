-- Add Bill Payment History and Receipt Support
-- This migration creates the bill_payment_history table and adds receipt support to bills

-- =============================================
-- TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS bill_payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,

  -- Payment information
  payment_date DATE NOT NULL,
  amount_paid DECIMAL(10, 2) NOT NULL CHECK (amount_paid > 0),
  payment_method TEXT,
  notes TEXT,

  -- Receipt for this payment
  receipt_url TEXT,

  -- Period information (which cycle was this payment for)
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Who recorded the payment
  recorded_by UUID NOT NULL REFERENCES profiles(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add receipt_url to bills table (for storing bill invoices/documents)
ALTER TABLE bills
ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- =============================================
-- INDEXES
-- =============================================

-- Bill payment history indexes
CREATE INDEX idx_bill_payment_history_bill_id ON bill_payment_history(bill_id);
CREATE INDEX idx_bill_payment_history_couple_id ON bill_payment_history(couple_id);
CREATE INDEX idx_bill_payment_history_payment_date ON bill_payment_history(payment_date DESC);
CREATE INDEX idx_bill_payment_history_period_start ON bill_payment_history(period_start DESC);

-- Bills table indexes (for filtering and search)
CREATE INDEX IF NOT EXISTS idx_bills_couple_id ON bills(couple_id);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);
CREATE INDEX IF NOT EXISTS idx_bills_category ON bills(category);
CREATE INDEX IF NOT EXISTS idx_bills_frequency ON bills(frequency);
CREATE INDEX IF NOT EXISTS idx_bills_is_active ON bills(is_active);

-- Composite index for common queries (active bills for a couple by due date)
CREATE INDEX IF NOT EXISTS idx_bills_couple_active_due
  ON bills(couple_id, is_active, due_date)
  WHERE is_active = true;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE bill_payment_history ENABLE ROW LEVEL SECURITY;

-- Users can view their couple's bill payment history
CREATE POLICY "Users can view their couple's bill payment history"
  ON bill_payment_history FOR SELECT
  USING (
    couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

-- Users can record bill payments for their couple
CREATE POLICY "Users can create bill payment history"
  ON bill_payment_history FOR INSERT
  WITH CHECK (
    couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid())
    AND recorded_by = auth.uid()
  );

-- Only the person who recorded the payment can update it (for corrections)
CREATE POLICY "Users can update their own payment records"
  ON bill_payment_history FOR UPDATE
  USING (recorded_by = auth.uid())
  WITH CHECK (recorded_by = auth.uid());

-- Only managers can delete payment history
CREATE POLICY "Managers can delete payment history"
  ON bill_payment_history FOR DELETE
  USING (
    couple_id IN (
      SELECT couple_id FROM profiles
      WHERE id = auth.uid() AND permission_tier = 'manager'
    )
  );
