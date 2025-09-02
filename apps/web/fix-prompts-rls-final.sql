-- Fix the prompts RLS policy to allow all authenticated users to read prompts
-- This solves the issue where the client-side database service can't fetch prompts

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can view prompts" ON public.prompts;

-- Create a new policy that allows all authenticated users to view prompts
CREATE POLICY "All authenticated users can view prompts" ON public.prompts
    FOR SELECT USING (true);

-- Keep the insert policy for security but update it to be clearer
DROP POLICY IF EXISTS "Authenticated users can insert prompts" ON public.prompts;
CREATE POLICY "Service role can insert prompts" ON public.prompts
    FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Verify the prompts table has data
SELECT COUNT(*) as prompt_count FROM public.prompts;

-- Show a few sample prompts to verify
SELECT id, text, tags FROM public.prompts ORDER BY id LIMIT 5;
