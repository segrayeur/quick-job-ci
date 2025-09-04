-- Mettre à jour la table subscriptions pour supporter Paystack avec essais gratuits
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS renew_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS plan_id TEXT;

-- Mettre à jour l'enum status pour inclure 'trialing'
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'trialing';

-- Créer une table pour les sessions analytics des interactions chatbot
CREATE TABLE IF NOT EXISTS public.interaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  interaction_type TEXT NOT NULL, -- 'whatsapp', 'contact', 'chatbot_rag', 'openai_assistant'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id TEXT,
  anonymous_user_id TEXT -- pour les users non connectés
);

-- Enable RLS
ALTER TABLE public.interaction_logs ENABLE ROW LEVEL SECURITY;

-- Policies pour interaction_logs
CREATE POLICY "Users can view their own interaction logs" ON public.interaction_logs
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Allow anonymous logging" ON public.interaction_logs
FOR INSERT
WITH CHECK (true);

-- Créer une table pour stocker les sessions AI conversations
CREATE TABLE IF NOT EXISTS public.ai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL, -- 'rag' or 'openai'
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;

-- Policies pour ai_sessions
CREATE POLICY "Users can manage their own AI sessions" ON public.ai_sessions
FOR ALL
USING (user_id = auth.uid());

-- Trigger pour updated_at
CREATE TRIGGER update_ai_sessions_updated_at
BEFORE UPDATE ON public.ai_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();