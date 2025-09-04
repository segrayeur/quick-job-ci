-- Create tenants table for multi-tenant support
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'recruiter', 'candidate');

-- Create subscription status enum  
CREATE TYPE public.subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'past_due');

-- Create job status enum
CREATE TYPE public.job_status AS ENUM ('open', 'closed', 'in_progress');

-- Create application status enum
CREATE TYPE public.application_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create users table (profiles)
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  whatsapp TEXT,
  role user_role NOT NULL DEFAULT 'candidate',
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CFA',
  location TEXT NOT NULL,
  category TEXT,
  status job_status NOT NULL DEFAULT 'open',
  contact_phone TEXT,
  contact_whatsapp TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create applications table
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_id, candidate_id)
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  status subscription_status NOT NULL DEFAULT 'inactive',
  paystack_subscription_id TEXT,
  next_payment_date TIMESTAMP WITH TIME ZONE,
  amount INTEGER,
  currency TEXT DEFAULT 'NGN',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create knowledge_base table for chatbot RAG
CREATE TABLE public.knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- USERS policies
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid() = user_id);

-- JOBS policies
CREATE POLICY "Recruiters can manage own jobs"
ON public.jobs FOR ALL
USING (auth.uid() = (SELECT user_id FROM public.users WHERE id = recruiter_id));

CREATE POLICY "Candidates can view open jobs"
ON public.jobs FOR SELECT
USING (status = 'open');

-- APPLICATIONS policies
CREATE POLICY "Candidates manage their applications"
ON public.applications FOR ALL
USING (auth.uid() = (SELECT user_id FROM public.users WHERE id = candidate_id));

CREATE POLICY "Recruiters can view applications for their jobs"
ON public.applications FOR SELECT
USING (auth.uid() = (SELECT u.user_id FROM public.users u JOIN public.jobs j ON j.recruiter_id = u.id WHERE j.id = job_id));

-- SUBSCRIPTIONS policies
CREATE POLICY "Users see own subscriptions"
ON public.subscriptions FOR SELECT
USING (auth.uid() = (SELECT user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert own subscription"
ON public.subscriptions FOR INSERT
WITH CHECK (auth.uid() = (SELECT user_id FROM public.users WHERE id = user_id));

-- KNOWLEDGE BASE policies
CREATE POLICY "Everyone can read knowledge base"
ON public.knowledge_base FOR SELECT
USING (true);

CREATE POLICY "Admins manage knowledge base"
ON public.knowledge_base FOR ALL
USING (public.get_user_role() = 'admin');

-- Create function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default knowledge base entries for chatbot
INSERT INTO public.knowledge_base (question, answer, category, keywords) VALUES
('Comment s''inscrire sur QuickJob CI ?', 'Pour vous inscrire, cliquez sur "S''inscrire" en haut de la page, choisissez votre rôle (recruteur ou candidat) et remplissez vos informations. L''inscription est gratuite pour les candidats.', 'inscription', ARRAY['inscription', 's''inscrire', 'compte', 'créer']),
('Est-ce gratuit pour les jeunes ?', 'Oui ! L''inscription et la candidature aux jobs sont entièrement gratuites pour les jeunes candidats. Seuls les recruteurs payent un abonnement pour publier des offres.', 'tarifs', ARRAY['gratuit', 'prix', 'jeunes', 'candidats', 'coût']),
('Comment poster un job ?', 'Après inscription en tant que recruteur, cliquez sur "Publier un job", remplissez les détails (titre, description, rémunération, localisation) et publiez. Un abonnement premium est requis.', 'publication', ARRAY['poster', 'publier', 'job', 'offre', 'annonce']),
('Comment fonctionne l''abonnement ?', 'L''abonnement premium pour recruteurs coûte 15,000 CFA/mois et permet de publier des jobs illimités, accéder au tableau de bord avancé et contacter directement les candidats.', 'abonnement', ARRAY['abonnement', 'premium', 'prix', 'paiement', 'coût']),
('Les paiements sont-ils sécurisés ?', 'Oui, tous les paiements sont sécurisés via Paystack, leader du paiement en ligne en Afrique. Nous acceptons les cartes bancaires et Mobile Money.', 'sécurité', ARRAY['sécurité', 'paiement', 'paystack', 'sécurisé', 'protection']);

-- Create update triggers for timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON public.knowledge_base FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();