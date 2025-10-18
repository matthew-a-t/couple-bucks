-- Comprehensive diagnostic for login issues
-- Run this in Supabase SQL Editor

-- 1. Check if all required tables exist
SELECT
  EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') as profiles_exists,
  EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'couples') as couples_exists,
  EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') as expenses_exists,
  EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'budgets') as budgets_exists,
  EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bills') as bills_exists;

-- 2. Check if RLS is enabled on profiles table
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'profiles';

-- 3. Check if RLS policies exist for profiles
SELECT
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles';

-- 4. Check the actual profile data
SELECT
  id,
  email,
  permission_tier,
  couple_id,
  created_at
FROM public.profiles;

-- 5. Check if the foreign key constraint on couple_id is causing issues
SELECT
  constraint_name,
  table_name,
  column_name
FROM information_schema.key_column_usage
WHERE table_name = 'profiles'
  AND column_name = 'couple_id';
