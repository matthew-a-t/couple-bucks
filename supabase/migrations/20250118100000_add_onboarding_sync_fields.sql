-- Add onboarding synchronization fields to support collaborative survey flow
-- This migration adds:
-- 1. Survey status tracking to couples table
-- 2. Timestamp fields for survey completion milestones
-- 3. Onboarding completion flag for profiles

-- =============================================
-- ENUMS
-- =============================================

-- Create survey status enum for tracking onboarding progress
CREATE TYPE survey_status AS ENUM ('draft', 'pending_review', 'approved');

-- =============================================
-- ALTER TABLES
-- =============================================

-- Add onboarding tracking fields to couples table
ALTER TABLE couples
  ADD COLUMN survey_status survey_status DEFAULT 'draft',
  ADD COLUMN survey_completed_by_user1_at TIMESTAMPTZ,
  ADD COLUMN survey_approved_by_user2_at TIMESTAMPTZ;

-- Add onboarding completion flag to profiles table
ALTER TABLE profiles
  ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON COLUMN couples.survey_status IS 'Tracks onboarding survey progress: draft (User 1 in progress), pending_review (User 1 done, awaiting User 2), approved (User 2 reviewed/finalized)';
COMMENT ON COLUMN couples.survey_completed_by_user1_at IS 'Timestamp when User 1 (creator) completed the initial survey';
COMMENT ON COLUMN couples.survey_approved_by_user2_at IS 'Timestamp when User 2 (joiner) reviewed and approved/modified the survey';
COMMENT ON COLUMN profiles.onboarding_completed IS 'Indicates if user has completed all onboarding steps';

-- =============================================
-- DATA MIGRATION
-- =============================================

-- For existing couples that are already paired, set survey as approved
UPDATE couples
SET
  survey_status = 'approved',
  survey_completed_by_user1_at = created_at,
  survey_approved_by_user2_at = updated_at
WHERE is_paired = true;

-- For existing couples waiting for partner, set status to pending_review
UPDATE couples
SET
  survey_status = 'pending_review',
  survey_completed_by_user1_at = created_at
WHERE is_paired = false AND user2_id IS NULL;

-- Mark existing users as having completed onboarding if they have a couple_id
UPDATE profiles
SET onboarding_completed = true
WHERE couple_id IS NOT NULL;
