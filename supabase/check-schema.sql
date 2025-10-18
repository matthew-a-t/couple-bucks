-- Run this query in Supabase SQL Editor to check if your schema is set up correctly

-- Check if profiles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'profiles'
) as profiles_table_exists;

-- Check if the trigger exists
SELECT EXISTS (
  SELECT FROM pg_trigger
  WHERE tgname = 'on_auth_user_created'
) as trigger_exists;

-- Check if there are any profiles
SELECT COUNT(*) as profile_count FROM public.profiles;

-- Check if there are any auth users
SELECT COUNT(*) as auth_user_count FROM auth.users;

-- If you see any profiles, list them (comment out if not needed)
SELECT id, email, created_at FROM public.profiles;
