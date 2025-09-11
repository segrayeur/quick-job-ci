-- =====================================================================
-- CORRECTION DES AVERTISSEMENTS DE SÉCURITÉ RESTANTS
-- =====================================================================

-- 1. CORRIGER LES FONCTIONS SANS SEARCH_PATH SÉCURISÉ
-- ====================================================

-- Corriger la fonction send_notification
CREATE OR REPLACE FUNCTION public.send_notification(p_user_id uuid, p_title text, p_message text, p_type text DEFAULT 'info'::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (p_user_id, p_title, p_message, p_type);
END;
$$;

-- Corriger la fonction handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Corriger la fonction increment_application_counter
CREATE OR REPLACE FUNCTION public.increment_application_counter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users 
  SET applications_created_count = applications_created_count + 1
  WHERE id = NEW.student_id;
  RETURN NEW;
END;
$$;

-- Corriger la fonction increment_jobs_counter
CREATE OR REPLACE FUNCTION public.increment_jobs_counter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users 
  SET jobs_published = jobs_published + 1
  WHERE id = NEW.recruiter_id;
  
  RETURN NEW;
END;
$$;

-- Corriger la fonction auto_archive_expired_jobs
CREATE OR REPLACE FUNCTION public.auto_archive_expired_jobs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.jobs 
  SET status = 'archived'
  WHERE end_date < CURRENT_DATE 
    AND status = 'open';
  
  RETURN NULL;
END;
$$;

-- Corriger la fonction notify_recruiter_new_application
CREATE OR REPLACE FUNCTION public.notify_recruiter_new_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  job_record RECORD;
BEGIN
  -- Récupérer les infos du job et du recruteur
  SELECT j.*, u.id as recruiter_user_id
  INTO job_record
  FROM public.jobs j
  JOIN public.users u ON u.id = j.recruiter_id
  WHERE j.id = NEW.job_id;

  -- Créer une notification pour le recruteur
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    job_record.recruiter_user_id,
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
$$;

-- Corriger la fonction notify_on_application_status_change
CREATE OR REPLACE FUNCTION public.notify_on_application_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  job_title TEXT;
  candidate_user_id UUID;
BEGIN
  -- Only trigger on status updates, not inserts
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Get job title and candidate user_id
    SELECT j.title, u.user_id
    INTO job_title, candidate_user_id
    FROM public.jobs j
    JOIN public.users u ON u.id = NEW.student_id
    WHERE j.id = NEW.job_id;
    
    -- Send notification to candidate
    IF NEW.status = 'accepted' THEN
      PERFORM public.send_notification(
        candidate_user_id,
        'Candidature acceptée',
        'Votre candidature pour "' || job_title || '" a été acceptée !',
        'accepted'
      );
    ELSIF NEW.status = 'rejected' THEN
      PERFORM public.send_notification(
        candidate_user_id,
        'Candidature refusée',
        'Votre candidature pour "' || job_title || '" a été refusée.',
        'rejected'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. AJOUTER DES COMMENTAIRES DE SÉCURITÉ SUR TOUTES LES FONCTIONS
-- ================================================================

COMMENT ON FUNCTION public.send_notification IS 'Fonction sécurisée pour envoyer des notifications - SECURITY DEFINER avec search_path fixe';
COMMENT ON FUNCTION public.handle_new_user IS 'Fonction sécurisée pour créer un profil utilisateur - SECURITY DEFINER avec search_path fixe';
COMMENT ON FUNCTION public.increment_application_counter IS 'Fonction sécurisée pour incrémenter le compteur de candidatures - SECURITY DEFINER avec search_path fixe';
COMMENT ON FUNCTION public.increment_jobs_counter IS 'Fonction sécurisée pour incrémenter le compteur de jobs - SECURITY DEFINER avec search_path fixe';
COMMENT ON FUNCTION public.auto_archive_expired_jobs IS 'Fonction sécurisée pour archiver les jobs expirés - SECURITY DEFINER avec search_path fixe';
COMMENT ON FUNCTION public.notify_recruiter_new_application IS 'Fonction sécurisée pour notifier les recruteurs - SECURITY DEFINER avec search_path fixe';
COMMENT ON FUNCTION public.notify_on_application_status_change IS 'Fonction sécurisée pour les notifications de changement de statut - SECURITY DEFINER avec search_path fixe';

-- 3. CRÉER UNE FONCTION DE VALIDATION DE SÉCURITÉ
-- ===============================================

CREATE OR REPLACE FUNCTION public.validate_security_setup()
RETURNS TABLE(
  function_name text,
  is_security_definer boolean,
  has_search_path boolean,
  security_status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.proname::text as function_name,
    p.prosecdef as is_security_definer,
    (p.proconfig IS NOT NULL AND array_to_string(p.proconfig, ',') LIKE '%search_path%') as has_search_path,
    CASE 
      WHEN p.prosecdef AND (p.proconfig IS NOT NULL AND array_to_string(p.proconfig, ',') LIKE '%search_path%') 
        THEN '✅ SÉCURISÉ' 
      ELSE '⚠️ À CORRIGER' 
    END as security_status
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'send_notification', 'handle_new_user', 'increment_application_counter',
      'increment_jobs_counter', 'auto_archive_expired_jobs', 
      'notify_recruiter_new_application', 'notify_on_application_status_change',
      'get_user_role', 'get_user_role_secure', 'is_recruiter', 
      'get_user_internal_id', 'is_job_owner'
    )
  ORDER BY security_status DESC, function_name;
$$;

-- Migration de sécurité complètement terminée
SELECT 'Migration de sécurité terminée avec succès !' as status;