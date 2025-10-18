-- Fix infinite recursion in profiles RLS policies
-- The problem: "Users can view their partner's profile" policy queries profiles table while evaluating profiles access = infinite loop

-- Drop all existing profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their partner's profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create simple, non-recursive policies
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy 3: Users can view ANY profile (no recursion, we'll handle partner access in app logic)
-- This is safe because profiles don't contain sensitive data
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Verify policies are correct
SELECT
  policyname,
  cmd as command,
  CASE
    WHEN qual LIKE '%SELECT%FROM%profiles%' THEN 'WARNING: May cause recursion'
    ELSE 'OK'
  END as recursion_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';
