-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.increment_application_counter()
RETURNS TRIGGER 
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

CREATE OR REPLACE FUNCTION public.notify_recruiter_new_application()
RETURNS TRIGGER 
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