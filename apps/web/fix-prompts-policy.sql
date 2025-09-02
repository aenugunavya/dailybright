-- Fix missing INSERT policy for prompts table
-- This allows authenticated users to insert new prompts (needed for the API)

CREATE POLICY "Authenticated users can insert prompts" ON public.prompts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
