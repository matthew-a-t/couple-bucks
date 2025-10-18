-- ===================================================================
-- COMPLETE DATABASE SETUP FOR COUPLE BUCKS
-- Run this ENTIRE file in Supabase SQL Editor to ensure everything is set up
-- ===================================================================

-- First, let's check what exists
DO $$
BEGIN
  RAISE NOTICE 'Checking current database state...';
END $$;

-- Drop existing objects if they exist (to start fresh)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_couple_linked ON profiles;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_couples_updated_at ON couples;
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
DROP TRIGGER IF EXISTS update_bills_updated_at ON bills;

-- Now run the complete schema
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================

DO $$ BEGIN
  CREATE TYPE permission_tier AS ENUM ('logger', 'manager');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE split_type AS ENUM ('fifty_fifty', 'proportional', 'custom', 'single_payer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE account_type AS ENUM ('joint', 'separate', 'mixed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE bill_frequency AS ENUM ('weekly', 'monthly', 'quarterly', 'annual', 'custom');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- TABLES
-- =============================================

-- Users/Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  permission_tier permission_tier NOT NULL DEFAULT 'logger',
  couple_id UUID,

  -- Notification preferences
  notifications_enabled BOOLEAN DEFAULT true,
  bill_reminder_days INTEGER DEFAULT 3,
  budget_alert_threshold INTEGER DEFAULT 75,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Couples table (exactly 2 users per couple)
CREATE TABLE IF NOT EXISTS couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User references
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Onboarding survey responses
  account_type account_type NOT NULL,
  default_split_type split_type NOT NULL DEFAULT 'fifty_fifty',
  track_income BOOLEAN DEFAULT false,

  -- Custom categories (JSON array)
  custom_categories JSONB DEFAULT '["Groceries", "Dining Out", "Transportation", "Utilities", "Entertainment", "Shopping", "Healthcare", "Household", "Pets", "Other"]'::jsonb,

  -- Quick-add buttons (JSON array of category names)
  quick_add_buttons JSONB DEFAULT '["Groceries", "Dining Out", "Gas", "Coffee"]'::jsonb,

  -- Partner invitation
  invite_code TEXT UNIQUE,
  invite_expires_at TIMESTAMPTZ,
  is_paired BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT different_users CHECK (user1_id != user2_id)
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Expense details
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  description TEXT,

  -- Split information
  split_type split_type NOT NULL DEFAULT 'fifty_fifty',
  split_percentage_user1 INTEGER DEFAULT 50 CHECK (split_percentage_user1 >= 0 AND split_percentage_user1 <= 100),
  split_percentage_user2 INTEGER DEFAULT 50 CHECK (split_percentage_user2 >= 0 AND split_percentage_user2 <= 100),

  -- Receipt
  receipt_url TEXT,

  -- Bill association (optional)
  bill_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraint to ensure split percentages add up to 100
  CONSTRAINT valid_split CHECK (split_percentage_user1 + split_percentage_user2 = 100)
);

-- Budgets table (ongoing spending limits, no time periods)
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,

  -- Budget details
  category TEXT NOT NULL,
  limit_amount DECIMAL(10, 2) NOT NULL CHECK (limit_amount > 0),

  -- Current period tracking (resets manually or monthly)
  current_spent DECIMAL(10, 2) DEFAULT 0 CHECK (current_spent >= 0),
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One budget per category per couple
  UNIQUE(couple_id, category)
);

-- Bills table (recurring bills)
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,

  -- Bill details
  name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,

  -- Recurrence
  due_date DATE NOT NULL,
  frequency bill_frequency NOT NULL DEFAULT 'monthly',
  custom_frequency_days INTEGER, -- For custom frequency

  -- Split information
  split_type split_type NOT NULL DEFAULT 'fifty_fifty',
  split_percentage_user1 INTEGER DEFAULT 50,
  split_percentage_user2 INTEGER DEFAULT 50,

  -- Reminder settings
  reminder_days INTEGER DEFAULT 3,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_paid_date DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_bill_split CHECK (split_percentage_user1 + split_percentage_user2 = 100)
);

-- =============================================
-- INDEXES
-- =============================================

DROP INDEX IF EXISTS idx_profiles_couple_id;
DROP INDEX IF EXISTS idx_couples_invite_code;
DROP INDEX IF EXISTS idx_expenses_couple_id;
DROP INDEX IF EXISTS idx_expenses_created_at;
DROP INDEX IF EXISTS idx_expenses_category;
DROP INDEX IF EXISTS idx_budgets_couple_id;
DROP INDEX IF EXISTS idx_bills_couple_id;
DROP INDEX IF EXISTS idx_bills_due_date;

CREATE INDEX idx_profiles_couple_id ON profiles(couple_id);
CREATE INDEX idx_couples_invite_code ON couples(invite_code);
CREATE INDEX idx_expenses_couple_id ON expenses(couple_id);
CREATE INDEX idx_expenses_created_at ON expenses(created_at DESC);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_budgets_couple_id ON budgets(couple_id);
CREATE INDEX idx_bills_couple_id ON bills(couple_id);
CREATE INDEX idx_bills_due_date ON bills(due_date);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their partner's profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own couple data" ON couples;
DROP POLICY IF EXISTS "User1 can create couple" ON couples;
DROP POLICY IF EXISTS "Users can update their couple data" ON couples;
DROP POLICY IF EXISTS "Users can view their couple's expenses" ON expenses;
DROP POLICY IF EXISTS "Users can create expenses for their couple" ON expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;
DROP POLICY IF EXISTS "Managers can update any expense in their couple" ON expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses;
DROP POLICY IF EXISTS "Managers can delete any expense in their couple" ON expenses;
DROP POLICY IF EXISTS "Users can view their couple's budgets" ON budgets;
DROP POLICY IF EXISTS "Managers can create budgets" ON budgets;
DROP POLICY IF EXISTS "Managers can update budgets" ON budgets;
DROP POLICY IF EXISTS "Managers can delete budgets" ON budgets;
DROP POLICY IF EXISTS "Users can view their couple's bills" ON bills;
DROP POLICY IF EXISTS "Managers can create bills" ON bills;
DROP POLICY IF EXISTS "Managers can update bills" ON bills;
DROP POLICY IF EXISTS "Managers can delete bills" ON bills;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view their partner's profile"
  ON profiles FOR SELECT
  USING (
    couple_id IS NOT NULL AND
    couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Couples policies
CREATE POLICY "Users can view their own couple data"
  ON couples FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "User1 can create couple"
  ON couples FOR INSERT
  WITH CHECK (auth.uid() = user1_id);

CREATE POLICY "Users can update their couple data"
  ON couples FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Expenses policies
CREATE POLICY "Users can view their couple's expenses"
  ON expenses FOR SELECT
  USING (
    couple_id IN (
      SELECT couple_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create expenses for their couple"
  ON expenses FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Managers can update any expense in their couple"
  ON expenses FOR UPDATE
  USING (
    couple_id IN (
      SELECT couple_id FROM profiles
      WHERE id = auth.uid() AND permission_tier = 'manager'
    )
  );

CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = created_by);

CREATE POLICY "Managers can delete any expense in their couple"
  ON expenses FOR DELETE
  USING (
    couple_id IN (
      SELECT couple_id FROM profiles
      WHERE id = auth.uid() AND permission_tier = 'manager'
    )
  );

-- Budgets policies
CREATE POLICY "Users can view their couple's budgets"
  ON budgets FOR SELECT
  USING (
    couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Managers can create budgets"
  ON budgets FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT couple_id FROM profiles
      WHERE id = auth.uid() AND permission_tier = 'manager'
    )
  );

CREATE POLICY "Managers can update budgets"
  ON budgets FOR UPDATE
  USING (
    couple_id IN (
      SELECT couple_id FROM profiles
      WHERE id = auth.uid() AND permission_tier = 'manager'
    )
  );

CREATE POLICY "Managers can delete budgets"
  ON budgets FOR DELETE
  USING (
    couple_id IN (
      SELECT couple_id FROM profiles
      WHERE id = auth.uid() AND permission_tier = 'manager'
    )
  );

-- Bills policies
CREATE POLICY "Users can view their couple's bills"
  ON bills FOR SELECT
  USING (
    couple_id IN (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Managers can create bills"
  ON bills FOR INSERT
  WITH CHECK (
    couple_id IN (
      SELECT couple_id FROM profiles
      WHERE id = auth.uid() AND permission_tier = 'manager'
    )
  );

CREATE POLICY "Managers can update bills"
  ON bills FOR UPDATE
  USING (
    couple_id IN (
      SELECT couple_id FROM profiles
      WHERE id = auth.uid() AND permission_tier = 'manager'
    )
  );

CREATE POLICY "Managers can delete bills"
  ON bills FOR DELETE
  USING (
    couple_id IN (
      SELECT couple_id FROM profiles
      WHERE id = auth.uid() AND permission_tier = 'manager'
    )
  );

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_couples_updated_at
  BEFORE UPDATE ON couples
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update couple's is_paired status when user2 joins
CREATE OR REPLACE FUNCTION update_couple_paired_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.couple_id IS NOT NULL AND OLD.couple_id IS NULL THEN
    UPDATE couples
    SET is_paired = true, user2_id = NEW.id
    WHERE id = NEW.couple_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_couple_linked
  AFTER UPDATE OF couple_id ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_couple_paired_status();

-- Create profiles for any existing auth users
INSERT INTO public.profiles (id, email, full_name, permission_tier)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', 'User'),
  'logger'::permission_tier
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- Verification
SELECT
  'Setup Complete!' as status,
  (SELECT COUNT(*) FROM auth.users) as auth_users,
  (SELECT COUNT(*) FROM public.profiles) as profiles,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') as profile_policies,
  CASE
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM public.profiles)
    THEN '✓ All users have profiles'
    ELSE '✗ Missing profiles'
  END as profile_check,
  CASE
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') >= 3
    THEN '✓ RLS policies exist'
    ELSE '✗ Missing RLS policies'
  END as rls_check;
