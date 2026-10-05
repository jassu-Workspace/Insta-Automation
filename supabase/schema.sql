-- DMflow Supabase Schema Setup

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  ig_account_id TEXT NOT NULL,
  profile_pic TEXT,
  groq_api_key TEXT,
  ai_context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook Events table
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id TEXT,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automations table (extended for AI, Builder, and Rewind)
CREATE TABLE IF NOT EXISTS public.automations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  trigger_source TEXT NOT NULL DEFAULT 'dm', -- 'dm', 'comment', 'story'
  trigger_type TEXT NOT NULL DEFAULT 'keyword', -- 'keyword', 'postback', 'ai'
  trigger_value TEXT NOT NULL, -- comma-separated keywords e.g. "hello, hi" or "*"
  response_content JSONB NOT NULL, -- { "text": "Private DM reply text" }
  public_response_content JSONB, -- { "text": "Public comment reply text" }
  reply_mode TEXT DEFAULT 'both', -- 'both', 'dm_only', 'public_only'
  specific_media_id TEXT, -- optional specific Instagram post / Reel ID
  is_ai_enabled BOOLEAN DEFAULT false,
  ai_model TEXT DEFAULT 'llama-3.1-8b-instant',
  max_response_length INTEGER DEFAULT 250,
  fallback_response_text TEXT,
  enable_opening_dm BOOLEAN DEFAULT true,
  enable_follow_gate BOOLEAN DEFAULT false,
  enable_email_capture BOOLEAN DEFAULT false,
  button_text TEXT,
  button_url TEXT,
  outbound_webhook_url TEXT,
  flow_steps JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table (extended for Multi-Turn State Machine)
CREATE TABLE IF NOT EXISTS public.conversations (
  id TEXT PRIMARY KEY, -- e.g. user_id:follower_id
  user_id TEXT NOT NULL,
  follower_id TEXT NOT NULL,
  follower_username TEXT,
  follower_email TEXT,
  current_step_id TEXT,
  active_automation_id UUID,
  flow_context JSONB DEFAULT '{}'::jsonb,
  state_updated_at TIMESTAMPTZ,
  state_expires_at TIMESTAMPTZ,
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  message_text TEXT NOT NULL,
  direction TEXT NOT NULL, -- 'incoming' | 'outgoing'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Processed Events table (Webhook Idempotency & Deduplication)
CREATE TABLE IF NOT EXISTS public.processed_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ice Breakers table
CREATE TABLE IF NOT EXISTS public.ice_breakers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  question TEXT NOT NULL,
  payload TEXT,
  response_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rewind Jobs table
CREATE TABLE IF NOT EXISTS public.rewind_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  automation_id TEXT NOT NULL,
  automation_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed', -- 'scanning', 'processing', 'completed', 'failed'
  comments_scanned INTEGER DEFAULT 0,
  dms_sent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ice_breakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewind_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public read access webhook_events" ON public.webhook_events FOR SELECT USING (true);
CREATE POLICY "Allow public read access automations" ON public.automations FOR SELECT USING (true);
CREATE POLICY "Allow public read access conversations" ON public.conversations FOR SELECT USING (true);
CREATE POLICY "Allow public read access messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Allow public read access processed_events" ON public.processed_events FOR SELECT USING (true);
CREATE POLICY "Allow public read access ice_breakers" ON public.ice_breakers FOR SELECT USING (true);
CREATE POLICY "Allow public read access rewind_jobs" ON public.rewind_jobs FOR SELECT USING (true);

CREATE POLICY "Allow service role full access users" ON public.users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role full access webhook_events" ON public.webhook_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role full access automations" ON public.automations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role full access conversations" ON public.conversations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role full access messages" ON public.messages FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role full access processed_events" ON public.processed_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role full access ice_breakers" ON public.ice_breakers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role full access rewind_jobs" ON public.rewind_jobs FOR ALL USING (auth.role() = 'service_role');
