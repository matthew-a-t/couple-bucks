-- Test if RLS is working correctly
-- This simulates what the app does when you log in

-- First, check what user ID you have
SELECT
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users;

-- Now try to select from profiles as that user would
-- Replace 'YOUR_USER_ID' with the actual ID from above
-- For example: SELECT * FROM profiles WHERE id = '12345678-1234-1234-1234-123456789012';

-- To test RLS properly, we need to see if the policy works
-- Check if you can see the profile
SELECT * FROM profiles;

-- Check the RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';
