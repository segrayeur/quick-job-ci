-- ===================================================================
-- MIGRATION DE SÉCURITÉ - PHASE 1 : Nettoyage complet des politiques
-- ===================================================================

-- Supprimer TOUTES les politiques existantes pour recréer proprement
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users; 
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Recruiters can view candidate profiles who applied" ON public.users;
DROP POLICY IF EXISTS "Recruiters can view active candidate posts profiles" ON public.users;

DROP POLICY IF EXISTS "Recruiters can manage own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can view basic job info" ON public.jobs;
DROP POLICY IF EXISTS "Users can view open jobs" ON public.jobs;
DROP POLICY IF EXISTS "Applicants can view job details after applying" ON public.jobs;
DROP POLICY IF EXISTS "Recruiters can view own jobs with contact info" ON public.jobs;
DROP POLICY IF EXISTS "Applicants can view job contact info after applying" ON public.jobs;

DROP POLICY IF EXISTS "Un étudiant voit ses candidatures" ON public.applications;
DROP POLICY IF EXISTS "Un étudiant postule à un job" ON public.applications;
DROP POLICY IF EXISTS "Un recruteur voit les candidatures à ses jobs" ON public.applications;
DROP POLICY IF EXISTS "Recruiters can view applications to their jobs" ON public.applications;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

DROP POLICY IF EXISTS "Users see own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;

-- ===================================================================
-- PHASE 2 : Créer les fonctions sécurisées
-- ===================================================================

-- Fonction pour obtenir l'ID interne utilisateur
CREATE OR REPLACE FUNCTION public.get_user_internal_id(user_uuid uuid DEFAULT auth.uid())
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users WHERE user_id = user_uuid;
$$;

-- Fonction pour vérifier si utilisateur est recruteur
CREATE OR REPLACE FUNCTION public.is_recruiter(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE user_id = user_uuid AND role = 'recruiter'
  );
$$;

-- Fonction pour vérifier propriété d'un job
CREATE OR REPLACE FUNCTION public.is_job_owner(job_id uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.users u ON u.id = j.recruiter_id
    WHERE j.id = job_id AND u.user_id = user_uuid
  );
$$;

-- Mise à jour fonction get_user_role existante
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE user_id = auth.uid();
$$;