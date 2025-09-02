-- Fix RLS Policy for prompts table
-- This script adds the missing INSERT policy that allows authenticated users to insert prompts

-- First, check if the policy already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'prompts' 
        AND policyname = 'Authenticated users can insert prompts'
    ) THEN
        -- Create the missing INSERT policy
        CREATE POLICY "Authenticated users can insert prompts" ON public.prompts
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        
        RAISE NOTICE 'INSERT policy created successfully';
    ELSE
        RAISE NOTICE 'INSERT policy already exists';
    END IF;
END $$;

-- Verify the policies
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
