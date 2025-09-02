-- Table for tracking daily prompts with automated scheduling
CREATE TABLE public.daily_prompts (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    prompt_id INTEGER REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    scheduled_time TIME DEFAULT NULL, -- The random time this prompt was/will be scheduled for
    is_active BOOLEAN DEFAULT true
);

-- Index for performance
CREATE INDEX idx_daily_prompts_date ON public.daily_prompts(date);
CREATE INDEX idx_daily_prompts_active ON public.daily_prompts(is_active);

-- Enable RLS
ALTER TABLE public.daily_prompts ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read daily prompts (they're public)
CREATE POLICY "Anyone can view daily prompts" ON public.daily_prompts
    FOR SELECT USING (true);

-- Policy: Only service role can insert/update daily prompts (for cron jobs)
CREATE POLICY "Service can manage daily prompts" ON public.daily_prompts
    FOR ALL USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
        OR auth.role() = 'service_role'
    );

-- Function to get today's active prompt
CREATE OR REPLACE FUNCTION public.get_todays_prompt()
RETURNS JSON AS $$
DECLARE
    v_today_prompt RECORD;
    v_result JSON;
BEGIN
    -- Get today's active prompt with full prompt details
    SELECT 
        dp.id as daily_prompt_id,
        dp.date,
        dp.generated_at,
        dp.scheduled_time,
        p.id as prompt_id,
        p.text as prompt_text,
        p.tags,
        p.created_at as prompt_created_at
    INTO v_today_prompt
    FROM public.daily_prompts dp
    JOIN public.prompts p ON dp.prompt_id = p.id
    WHERE dp.date = CURRENT_DATE 
    AND dp.is_active = true
    LIMIT 1;
    
    IF v_today_prompt IS NOT NULL THEN
        v_result := json_build_object(
            'success', true,
            'has_prompt', true,
            'daily_prompt_id', v_today_prompt.daily_prompt_id,
            'date', v_today_prompt.date,
            'generated_at', v_today_prompt.generated_at,
            'scheduled_time', v_today_prompt.scheduled_time,
            'prompt', json_build_object(
                'id', v_today_prompt.prompt_id,
                'text', v_today_prompt.prompt_text,
                'tags', v_today_prompt.tags,
                'created_at', v_today_prompt.prompt_created_at
            )
        );
    ELSE
        v_result := json_build_object(
            'success', true,
            'has_prompt', false,
            'message', 'No prompt available for today yet'
        );
    END IF;
    
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false, 
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a daily prompt (for cron job use)
CREATE OR REPLACE FUNCTION public.create_daily_prompt(
    p_date DATE DEFAULT CURRENT_DATE,
    p_prompt_text TEXT DEFAULT NULL,
    p_scheduled_time TIME DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_existing_prompt RECORD;
    v_new_prompt_id INTEGER;
    v_daily_prompt_id INTEGER;
    v_random_time TIME;
    v_result JSON;
BEGIN
    -- Check if we already have a prompt for this date
    SELECT * INTO v_existing_prompt 
    FROM public.daily_prompts 
    WHERE date = p_date;
    
    IF v_existing_prompt IS NOT NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'A prompt already exists for this date',
            'existing_id', v_existing_prompt.id
        );
    END IF;
    
    -- If no prompt text provided, we'll need to call the generation API
    IF p_prompt_text IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Prompt text is required. Call the generation API first.'
        );
    END IF;
    
    -- Create the prompt in the prompts table
    INSERT INTO public.prompts (text, tags)
    VALUES (p_prompt_text, ARRAY['daily', 'automated'])
    RETURNING id INTO v_new_prompt_id;
    
    -- Generate random time between 8 AM and 8 PM if not provided
    IF p_scheduled_time IS NULL THEN
        v_random_time := (TIME '08:00:00' + (random() * INTERVAL '12 hours'))::TIME;
    ELSE
        v_random_time := p_scheduled_time;
    END IF;
    
    -- Create the daily prompt entry
    INSERT INTO public.daily_prompts (date, prompt_id, scheduled_time)
    VALUES (p_date, v_new_prompt_id, v_random_time)
    RETURNING id INTO v_daily_prompt_id;
    
    v_result := json_build_object(
        'success', true,
        'daily_prompt_id', v_daily_prompt_id,
        'prompt_id', v_new_prompt_id,
        'date', p_date,
        'scheduled_time', v_random_time,
        'prompt_text', p_prompt_text
    );
    
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false, 
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
