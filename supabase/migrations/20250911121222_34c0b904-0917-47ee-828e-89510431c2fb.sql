-- ===================================================================
-- MIGRATION DE SÉCURITÉ : Correction des politiques RLS récursives
-- ===================================================================

-- 1. CRÉER DES FONCTIONS SECURITY DEFINER POUR ÉVITER LES RÉCURSIONS
-- ===================================================================

-- Fonction sécurisée pour obtenir le rôle d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_role_secure(user_uuid uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.users WHERE user_id = user_uuid;
$$;

-- Fonction sécurisée pour vérifier si un utilisateur est recruteur
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

-- Fonction sécurisée pour obtenir l'ID interne d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_internal_id(user_uuid uuid DEFAULT auth.uid())
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users WHERE user_id = user_uuid;
$$;

-- Fonction sécurisée pour vérifier si un job appartient à un recruteur
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

-- 2. SUPPRIMER LES POLITIQUES PROBLÉMATIQUES
-- ==========================================

-- Supprimer les politiques récursives sur jobs
DROP POLICY IF EXISTS "Recruiters can manage own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Recruiters can view own jobs with contact info" ON public.jobs;
DROP POLICY IF EXISTS "Applicants can view job contact info after applying" ON public.jobs;

-- Supprimer les politiques récursives sur applications
DROP POLICY IF EXISTS "Un recruteur voit les candidatures à ses jobs" ON public.applications;

-- Supprimer les politiques récursives sur notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- 3. CRÉER DES POLITIQUES RLS SÉCURISÉES POUR LA TABLE USERS
-- ===========================================================

-- Supprimer l'ancienne politique trop restrictive
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

-- Politique : Les utilisateurs voient leur propre profil
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid() = user_id);

-- Politique : Les recruteurs peuvent voir les profils des candidats qui ont postulé à leurs jobs
CREATE POLICY "Recruiters can view candidate profiles who applied"
ON public.users
FOR SELECT
USING (
  role = 'candidate' 
  AND EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE a.student_id = users.id 
    AND public.is_job_owner(j.id)
  )
);

-- Politique : Les recruteurs peuvent voir les profils de candidats avec posts actifs
CREATE POLICY "Recruiters can view active candidate posts profiles"
ON public.users
FOR SELECT
USING (
  role = 'candidate'
  AND public.is_recruiter()
  AND EXISTS (
    SELECT 1 FROM public.candidate_posts cp
    WHERE cp.candidate_id = users.id AND cp.status = 'active'
  )
);

-- 4. RECRÉER LES POLITIQUES JOBS SANS RÉCURSION
-- ==============================================

CREATE POLICY "Recruiters can manage own jobs"
ON public.jobs
FOR ALL
USING (public.get_user_internal_id() = recruiter_id);

CREATE POLICY "Users can view open jobs"
ON public.jobs
FOR SELECT
USING (status = 'open');

CREATE POLICY "Applicants can view job details after applying"
ON public.jobs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.job_id = jobs.id 
    AND a.student_id = public.get_user_internal_id()
  )
);

-- 5. RECRÉER LES POLITIQUES APPLICATIONS SANS RÉCURSION
-- ======================================================

CREATE POLICY "Recruiters can view applications to their jobs"
ON public.applications
FOR SELECT
USING (public.is_job_owner(job_id));

-- 6. RECRÉER LES POLITIQUES NOTIFICATIONS SANS RÉCURSION
-- =======================================================

CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (user_id = public.get_user_internal_id());

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (user_id = public.get_user_internal_id());

-- 7. CORRIGER LA POLITIQUE SUBSCRIPTIONS DÉFECTUEUSE
-- ==================================================

-- Supprimer la politique avec une condition impossible
DROP POLICY IF EXISTS "Users see own subscriptions" ON public.subscriptions;

-- Créer une politique correcte
CREATE POLICY "Users see own subscriptions"
ON public.subscriptions
FOR SELECT
USING (user_id = public.get_user_internal_id());

-- 8. MISE À JOUR DES FONCTIONS EXISTANTES AVEC SEARCH_PATH
-- =========================================================

-- Corriger la fonction get_user_role existante
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE user_id = auth.uid();
$$;

-- Corriger les autres fonctions pour la sécurité
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 9. COMMENTAIRES DE SÉCURITÉ
-- ============================

COMMENT ON FUNCTION public.get_user_role_secure IS 'Fonction sécurisée pour obtenir le rôle utilisateur sans récursion RLS';
COMMENT ON FUNCTION public.is_recruiter IS 'Vérifie si un utilisateur est recruteur de façon sécurisée';
COMMENT ON FUNCTION public.get_user_internal_id IS 'Obtient l''ID interne utilisateur de façon sécurisée';
COMMENT ON FUNCTION public.is_job_owner IS 'Vérifie la propriété d''un job de façon sécurisée';

-- Migration terminée avec succès