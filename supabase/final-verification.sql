-- Final verification query (fixed)
-- Run this in Supabase SQL Editor

SELECT
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') as profiles_table_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'couples') as couples_table_exists,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') as profile_policies_count,
  (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') as profiles_rls_enabled,
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  (SELECT COUNT(*) FROM public.profiles) as profiles_count;

-- Also show the actual data
SELECT 'Current Profiles:' as info;
SELECT id, email, permission_tier, couple_id, created_at FROM public.profiles;

-- Check if trigger exists
SELECT 'Trigger Status:' as info;
SELECT EXISTS (
  SELECT FROM pg_trigger WHERE tgname = 'on_auth_user_created'
) as trigger_exists;
