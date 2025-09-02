-- Seed the prompts table with initial prompts that can be used
-- Run this in your Supabase SQL Editor to add some prompts to work with

-- First, temporarily disable RLS to insert seed data
ALTER TABLE public.prompts DISABLE ROW LEVEL SECURITY;

-- Insert seed prompts
INSERT INTO public.prompts (text, tags) VALUES
('What are you grateful for today? Share something that brought you joy or made you smile.', ARRAY['daily', 'simple']),
('In exactly 5 words, describe your day''s emotional soundtrack 🎵', ARRAY['daily', 'creative']),
('If your day was a color, what would it be and why?', ARRAY['daily', 'creative']),
('What superpower did you accidentally use today without realizing it?', ARRAY['daily', 'fun']),
('Rate your day like a video game: What was your biggest XP gain?', ARRAY['daily', 'gaming']),
('If today was a movie genre, what would it be called?', ARRAY['daily', 'creative']),
('What invisible thing deserves a thank-you note from you today?', ARRAY['daily', 'thoughtful']),
('Your day as a weather forecast: What was the emotional climate? ⛅', ARRAY['daily', 'creative']),
('If you could time-travel and high-five your past self, when would it be?', ARRAY['daily', 'fun']),
('What secret ingredient made today better than yesterday?', ARRAY['daily', 'thoughtful']),
('Rate your day''s plot twists from 1-10. What was the best one?', ARRAY['daily', 'fun']),
('If your gratitude had a flavor today, what would you taste?', ARRAY['daily', 'creative']),
('What background character in your life deserves the spotlight today?', ARRAY['daily', 'thoughtful']),
('Your day''s energy level: solar panel or dead battery? Why?', ARRAY['daily', 'fun']),
('If today was a song, what would be its title and genre?', ARRAY['daily', 'creative']),
('What tiny miracle went completely unnoticed by everyone else today?', ARRAY['daily', 'thoughtful']),
('In 3 words, describe what your future self would thank you for', ARRAY['daily', 'simple']),
('What invisible force field protected your mood today? 🛡️', ARRAY['daily', 'fun']),
('If your day was a text message, what emoji combo would it be?', ARRAY['daily', 'creative']),
('What ordinary thing became extraordinary for exactly 30 seconds today?', ARRAY['daily', 'thoughtful']),
('Rate today''s surprise level: predictable sitcom or plot-twist thriller?', ARRAY['daily', 'fun']);

-- Re-enable RLS
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- Verify the prompts were inserted
SELECT COUNT(*) as prompt_count FROM public.prompts;
SELECT id, text, tags FROM public.prompts LIMIT 5;
