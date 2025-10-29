-- Unlink Bills from Spending Categories
-- This migration makes the category column nullable and removes the category index
-- Bills are now independent from spending category budgets

-- =============================================
-- ALTER TABLES
-- =============================================

-- Make category column nullable in bills table
ALTER TABLE bills
ALTER COLUMN category DROP NOT NULL;

-- =============================================
-- DROP INDEXES
-- =============================================

-- Drop the category index since bills are no longer filtered by category
DROP INDEX IF EXISTS idx_bills_category;
