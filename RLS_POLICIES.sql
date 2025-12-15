-- ============================================
-- RLS Policies for users-profile table
-- ============================================
-- Run this SQL in your Supabase SQL Editor to fix the RLS policy error
-- ============================================

-- Step 1: Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public."users-profile" (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Enable Row Level Security
ALTER TABLE public."users-profile" ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public."users-profile";
DROP POLICY IF EXISTS "Users can read their own profile" ON public."users-profile";
DROP POLICY IF EXISTS "Users can update their own profile" ON public."users-profile";

-- Step 4: Create policy to allow users to INSERT their own profile
-- This is the critical policy that's missing and causing your error
CREATE POLICY "Users can insert their own profile"
  ON public."users-profile"
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Step 5: Create policy to allow users to SELECT their own profile
CREATE POLICY "Users can read their own profile"
  ON public."users-profile"
  FOR SELECT
  USING (auth.uid() = id);

-- Step 6: Create policy to allow users to UPDATE their own profile
CREATE POLICY "Users can update their own profile"
  ON public."users-profile"
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- Verification Query (optional - run to check)
-- ============================================
-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd,
--   qual,
--   with_check
-- FROM pg_policies
-- WHERE tablename = 'users-profile';

