-- Améliorer le schéma pour QuickJob CI Dashboard

-- Ajouter des colonnes manquantes à la table users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS availability TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS experience TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cv_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Ajouter des colonnes manquantes à la table jobs
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS applications_count INTEGER DEFAULT 0;

-- Améliorer la table subscriptions
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS jobs_published INTEGER DEFAULT 0;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS jobs_limit INTEGER DEFAULT 0;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 7;

-- Créer une table pour les favoris des recruteurs
CREATE TABLE IF NOT EXISTS public.candidate_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(recruiter_id, candidate_id)
);

-- Créer une table pour les commentaires et notes des recruteurs
CREATE TABLE IF NOT EXISTS public.candidate_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Créer une table pour les notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'application', 'subscription', 'general'
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Améliorer les politiques RLS pour candidate_favorites
ALTER TABLE public.candidate_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can manage their favorites" ON public.candidate_favorites
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.user_id = auth.uid() 
    AND users.id = candidate_favorites.recruiter_id
    AND users.role = 'recruiter'
  )
);

-- Améliorer les politiques RLS pour candidate_ratings
ALTER TABLE public.candidate_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can manage their ratings" ON public.candidate_ratings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.user_id = auth.uid() 
    AND users.id = candidate_ratings.recruiter_id
    AND users.role = 'recruiter'
  )
);

-- Améliorer les politiques RLS pour notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.user_id = auth.uid() 
    AND users.id = notifications.user_id
  )
);

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.user_id = auth.uid() 
    AND users.id = notifications.user_id
  )
);

-- Fonction pour notifier les recruteurs des nouvelles candidatures
CREATE OR REPLACE FUNCTION public.notify_recruiter_new_application()
RETURNS TRIGGER AS $$
DECLARE
  job_record RECORD;
  recruiter_user_id UUID;
BEGIN
  -- Récupérer les infos du job et du recruteur
  SELECT j.*, u.user_id as recruiter_user_id
  INTO job_record
  FROM public.jobs j
  JOIN public.users u ON u.id = j.recruiter_id
  WHERE j.id = NEW.job_id;

  -- Créer une notification pour le recruteur
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    job_record.id,
    'Nouvelle candidature',
    'Une nouvelle candidature a été reçue pour votre offre "' || job_record.title || '"',
    'application'
  );

  -- Incrémenter le compteur de candidatures du job
  UPDATE public.jobs
  SET applications_count = applications_count + 1
  WHERE id = NEW.job_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour notifier les recruteurs
DROP TRIGGER IF EXISTS trigger_notify_recruiter ON public.applications;
CREATE TRIGGER trigger_notify_recruiter
  AFTER INSERT ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_recruiter_new_application();

-- Ajouter un utilisateur de test pour les recruteurs (visible uniquement en développement)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
VALUES (
  'test-recruiter-uuid'::uuid,
  'recruteur@test.ci',
  crypt('Recruit123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"first_name": "Test", "last_name": "Recruiter"}'::jsonb
) ON CONFLICT (email) DO NOTHING;

INSERT INTO public.users (id, user_id, email, first_name, last_name, role, location)
VALUES (
  gen_random_uuid(),
  'test-recruiter-uuid'::uuid,
  'recruteur@test.ci',
  'Test',
  'Recruiter',
  'recruiter',
  'Test Environment'
) ON CONFLICT (email) DO NOTHING;