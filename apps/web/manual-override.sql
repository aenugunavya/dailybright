-- Manual SQL to override today's prompt to solar panel
-- Run this in your Supabase SQL Editor

-- Step 1: Create the solar panel prompt
INSERT INTO public.prompts (text, tags)
VALUES ('Your day''s energy level: solar panel or dead battery? Why?', ARRAY['daily', 'manual-override'])
RETURNING id;

-- Step 2: Get the prompt ID from step 1, then run this (replace PROMPT_ID with the actual ID)
-- UPDATE public.daily_prompts 
-- SET prompt_id = PROMPT_ID, scheduled_time = '00:00:00'::TIME
-- WHERE date = CURRENT_DATE;

-- Alternative: Delete today's entry and recreate with solar panel prompt
-- First get a solar panel prompt ID from existing prompts:
SELECT id, text FROM public.prompts 
WHERE text ILIKE '%solar panel%' OR text ILIKE '%dead battery%'
ORDER BY created_at DESC
LIMIT 5;

-- Then use one of those IDs to update today's prompt:
-- UPDATE public.daily_prompts 
-- SET prompt_id = [ID_FROM_ABOVE], scheduled_time = '00:00:00'::TIME
-- WHERE date = CURRENT_DATE;
