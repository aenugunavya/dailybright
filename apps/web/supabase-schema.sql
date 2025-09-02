-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    display_name TEXT,
    profile_photo_url TEXT,
    tz TEXT, -- IANA timezone like 'America/New_York'
    onesignal_player_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Prompts table
CREATE TABLE public.prompts (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User daily state table
CREATE TABLE public.user_daily_state (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    prompt_id INTEGER REFERENCES public.prompts(id) ON DELETE CASCADE,
    window_start_ts TIMESTAMP WITH TIME ZONE NOT NULL,
    window_end_ts TIMESTAMP WITH TIME ZONE NOT NULL,
    notified_at_ts TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, date)
);

-- Entries table
CREATE TABLE public.entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    prompt_id INTEGER REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL CHECK (char_length(text) <= 2000),
    photo_url TEXT,
    on_time BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Streaks table
CREATE TABLE public.streaks (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
    current_count INTEGER DEFAULT 0,
    longest_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Friends table
CREATE TABLE public.friends (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, friend_id),
    CHECK (user_id != friend_id)
);

-- Reactions table
CREATE TABLE public.reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE NOT NULL,
    reactor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(entry_id, reactor_id)
);

-- Indexes for performance
CREATE INDEX idx_user_daily_state_date ON public.user_daily_state(date);
CREATE INDEX idx_entries_user_date ON public.entries(user_id, date);
CREATE INDEX idx_entries_date ON public.entries(date);
CREATE INDEX idx_friends_status ON public.friends(status);
CREATE INDEX idx_reactions_entry ON public.reactions(entry_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view and search profiles" ON public.users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Prompts policies (readable by authenticated users)
CREATE POLICY "Authenticated users can view prompts" ON public.prompts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert prompts" ON public.prompts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- User daily state policies
CREATE POLICY "Users can view own daily state" ON public.user_daily_state
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily state" ON public.user_daily_state
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily state" ON public.user_daily_state
    FOR UPDATE USING (auth.uid() = user_id);

-- Entries policies
CREATE POLICY "Users can view own entries" ON public.entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view friends' entries" ON public.entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.friends 
            WHERE friends.user_id = auth.uid() 
            AND friends.friend_id = entries.user_id 
            AND friends.status = 'accepted'
        )
    );

CREATE POLICY "Users can insert own entries" ON public.entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries" ON public.entries
    FOR UPDATE USING (auth.uid() = user_id);

-- Streaks policies
CREATE POLICY "Users can view own streaks" ON public.streaks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks" ON public.streaks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" ON public.streaks
    FOR UPDATE USING (auth.uid() = user_id);

-- Friends policies
CREATE POLICY "Users can view own friend relationships" ON public.friends
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can insert friend requests" ON public.friends
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friend relationships" ON public.friends
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Reactions policies
CREATE POLICY "Users can view reactions on visible entries" ON public.reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.entries 
            WHERE entries.id = reactions.entry_id 
            AND (
                entries.user_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM public.friends 
                    WHERE friends.user_id = auth.uid() 
                    AND friends.friend_id = entries.user_id 
                    AND friends.status = 'accepted'
                )
            )
        )
    );

CREATE POLICY "Users can insert reactions on visible entries" ON public.reactions
    FOR INSERT WITH CHECK (
        auth.uid() = reactor_id 
        AND EXISTS (
            SELECT 1 FROM public.entries 
            WHERE entries.id = reactions.entry_id 
            AND (
                entries.user_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM public.friends 
                    WHERE friends.user_id = auth.uid() 
                    AND friends.friend_id = entries.user_id 
                    AND friends.status = 'accepted'
                )
            )
        )
    );

CREATE POLICY "Users can delete own reactions" ON public.reactions
    FOR DELETE USING (auth.uid() = reactor_id);

-- Functions for automatic timestamping
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get current authenticated user ID
CREATE OR REPLACE FUNCTION public.get_auth_uid()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create entry with proper authentication
CREATE OR REPLACE FUNCTION public.create_entry_safe(
    p_user_id UUID,
    p_date DATE,
    p_prompt_id INTEGER,
    p_text TEXT,
    p_photo_url TEXT DEFAULT NULL,
    p_on_time BOOLEAN DEFAULT false
)
RETURNS JSON AS $$
DECLARE
    v_auth_uid UUID;
    v_entry_id UUID;
    v_debug_info JSON;
BEGIN
    -- Get the authenticated user ID
    v_auth_uid := auth.uid();
    
    -- Check if user is authenticated
    IF v_auth_uid IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    
    -- Check if user is inserting their own entry
    IF v_auth_uid != p_user_id THEN
        RETURN json_build_object('success', false, 'error', 'Can only insert own entries');
    END IF;
    
    -- Debug: Log the parameters
    v_debug_info := json_build_object(
        'auth_uid', v_auth_uid,
        'p_user_id', p_user_id,
        'p_date', p_date,
        'p_prompt_id', p_prompt_id,
        'p_text', p_text,
        'p_photo_url', p_photo_url,
        'p_on_time', p_on_time
    );
    
    -- Insert the entry
    INSERT INTO public.entries (user_id, date, prompt_id, text, photo_url, on_time)
    VALUES (p_user_id, p_date, p_prompt_id, p_text, p_photo_url, p_on_time)
    RETURNING id INTO v_entry_id;
    
    -- Return success with debug info
    RETURN json_build_object(
        'success', true, 
        'entry_id', v_entry_id,
        'debug_info', v_debug_info
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false, 
        'error', SQLERRM,
        'debug_info', v_debug_info
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_streaks
    BEFORE UPDATE ON public.streaks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Storage buckets for photos
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('profiles', 'profiles', true),
  ('entries', 'entries', true);

-- Storage policies
CREATE POLICY "Users can upload their own profile photos"
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile photos"
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile photos"
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

CREATE POLICY "Users can upload their own entry photos"
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'entries' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own entry photos"
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'entries' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view entry photos from friends"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'entries' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.friends 
      WHERE friends.user_id = auth.uid() 
      AND friends.friend_id::text = (storage.foldername(name))[1]
      AND friends.status = 'accepted'
    )
  )
);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample prompts
INSERT INTO public.prompts (text, tags) VALUES
    ('What''s something small that made you smile today?', ARRAY['daily', 'happiness']),
    ('Who is someone you''re grateful for right now?', ARRAY['relationships', 'people']),
    ('What''s a simple pleasure you enjoyed today?', ARRAY['daily', 'mindfulness']),
    ('What''s something about your health you''re thankful for?', ARRAY['health', 'wellness']),
    ('What''s a skill or ability you have that you appreciate?', ARRAY['personal', 'growth']),
    ('What''s something in nature that brings you peace?', ARRAY['nature', 'mindfulness']),
    ('What''s a memory from this week that makes you happy?', ARRAY['memories', 'happiness']),
    ('What''s something you''re looking forward to?', ARRAY['future', 'anticipation']),
    ('What''s a challenge you''ve overcome that you''re proud of?', ARRAY['growth', 'resilience']),
    ('What''s something in your home that you''re grateful for?', ARRAY['home', 'comfort']);

-- Function to get today's entry safely
CREATE OR REPLACE FUNCTION public.get_today_entry_safe(p_user_id UUID, p_date DATE)
RETURNS JSON AS $$
DECLARE
    v_auth_uid UUID;
    v_entry RECORD;
BEGIN
    -- Get the authenticated user ID
    v_auth_uid := auth.uid();
    
    -- Check if user is authenticated
    IF v_auth_uid IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    
    -- Check if user is requesting their own entry
    IF v_auth_uid != p_user_id THEN
        RETURN json_build_object('success', false, 'error', 'Can only read own entries');
    END IF;
    
    -- Get the entry
    SELECT * INTO v_entry FROM public.entries 
    WHERE user_id = p_user_id AND date = p_date;
    
    -- Return the entry or null
    IF v_entry IS NOT NULL THEN
        RETURN json_build_object('success', true, 'entry', row_to_json(v_entry));
    ELSE
        RETURN json_build_object('success', false, 'entry', null);
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get friends' recent entries safely
CREATE OR REPLACE FUNCTION public.get_friends_entries_safe(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_auth_uid UUID;
    v_friends JSON;
    v_entries JSON;
BEGIN
    -- Get the authenticated user ID
    v_auth_uid := auth.uid();
    
    -- Check if user is authenticated
    IF v_auth_uid IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    
    -- Check if user is requesting their own friends' entries
    IF v_auth_uid != p_user_id THEN
        RETURN json_build_object('success', false, 'error', 'Can only read own friends entries');
    END IF;
    
    -- Get friends' entries with proper joins
    SELECT json_agg(
        json_build_object(
            'id', e.id,
            'text', e.text,
            'photo_url', e.photo_url,
            'created_at', e.created_at,
            'user_id', e.user_id,
            'prompt_id', e.prompt_id,
            'users', json_build_object(
                'display_name', u.display_name,
                'email', u.email
            ),
            'prompts', json_build_object(
                'text', p.text
            )
        )
    ) INTO v_entries
    FROM public.entries e
    JOIN public.users u ON e.user_id = u.id
    JOIN public.prompts p ON e.prompt_id = p.id
    JOIN public.friends f ON (
        (f.user_id = p_user_id AND f.friend_id = e.user_id) OR
        (f.friend_id = p_user_id AND f.user_id = e.user_id)
    )
    WHERE f.status = 'accepted'
    AND e.date >= CURRENT_DATE - INTERVAL '7 days'
    ORDER BY e.created_at DESC;
    
    -- Return the entries
    IF v_entries IS NOT NULL THEN
        RETURN json_build_object('success', true, 'entries', v_entries, 'count', json_array_length(v_entries));
    END IF;
    
    RETURN json_build_object('success', true, 'entries', '[]'::JSON, 'count', 0);
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
