-- Debug the couple pairing trigger

-- 1. Check if the trigger exists
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as is_enabled,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgname = 'on_profile_couple_linked';

-- 2. Check if the function exists
SELECT
  proname as function_name,
  prosrc as function_source
FROM pg_proc
WHERE proname = 'update_couple_paired_status';

-- 3. Test the trigger manually - update a profile's couple_id to NULL and back
-- (This won't actually change anything since we're testing)
SELECT
  id,
  couple_id,
  couple_id IS NULL as is_null,
  couple_id IS NOT NULL AND couple_id != couple_id as test_condition
FROM profiles
WHERE id = '5b0f4346-43a0-4a2b-a8d9-e46c6dcdd5f6';
