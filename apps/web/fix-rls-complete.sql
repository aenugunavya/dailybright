-- Complete RLS Policy Fix for prompts table
-- This script will drop and recreate the policies to ensure they work correctly

-- First, let's see what policies currently exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'prompts'
ORDER BY policyname;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can view prompts" ON public.prompts;
DROP POLICY IF EXISTS "Authenticated users can insert prompts" ON public.prompts;

-- Recreate the SELECT policy
CREATE POLICY "Authenticated users can view prompts" ON public.prompts
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create the INSERT policy with more permissive check
CREATE POLICY "Authenticated users can insert prompts" ON public.prompts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Alternative: If the above doesn't work, try this more permissive approach
-- DROP POLICY IF EXISTS "Authenticated users can insert prompts" ON public.prompts;
-- CREATE POLICY "Authenticated users can insert prompts" ON public.prompts
--     FOR INSERT WITH CHECK (true);

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'prompts'
ORDER BY policyname;

-- Test if RLS is properly enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'prompts' AND schemaname = 'public';
