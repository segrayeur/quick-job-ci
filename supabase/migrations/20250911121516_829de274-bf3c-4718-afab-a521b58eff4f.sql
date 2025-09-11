-- ===================================================================
-- MIGRATION DE SÉCURITÉ - PHASE 2 : Recréer les politiques sécurisées
-- ===================================================================

-- 1. POLITIQUES POUR LA TABLE USERS (Accès contrôlé aux profils)
-- ================================================================

-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leur profil
CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Les recruteurs peuvent voir les profils des candidats qui ont postulé à leurs jobs
CREATE POLICY "Recruiters can view candidate profiles who applied"
ON public.users
FOR SELECT
TO authenticated
USING (
  role = 'candidate' 
  AND public.is_recruiter()
  AND EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE a.student_id = users.id 
    AND public.is_job_owner(j.id)
  )
);

-- Les recruteurs peuvent voir les profils des candidats avec posts actifs
CREATE POLICY "Recruiters can view active candidate posts profiles"
ON public.users
FOR SELECT
TO authenticated
USING (
  role = 'candidate'
  AND public.is_recruiter()
  AND EXISTS (
    SELECT 1 FROM public.candidate_posts cp
    WHERE cp.candidate_id = users.id AND cp.status = 'active'
  )
);

-- 2. POLITIQUES POUR LA TABLE JOBS (Gestion des offres d'emploi)
-- ===============================================================

-- Les recruteurs peuvent gérer leurs propres jobs
CREATE POLICY "Recruiters can manage own jobs"
ON public.jobs
FOR ALL
TO authenticated
USING (public.get_user_internal_id() = recruiter_id)
WITH CHECK (public.get_user_internal_id() = recruiter_id);

-- Tout le monde peut voir les jobs ouverts (informations de base)
CREATE POLICY "Users can view open jobs"
ON public.jobs
FOR SELECT
TO authenticated, anon
USING (status = 'open');

-- Les candidats qui ont postulé peuvent voir les informations complètes du job
CREATE POLICY "Applicants can view job details after applying"
ON public.jobs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.job_id = jobs.id 
    AND a.student_id = public.get_user_internal_id()
  )
);

-- 3. POLITIQUES POUR LA TABLE APPLICATIONS (Gestion des candidatures)
-- ====================================================================

-- Les candidats peuvent voir leurs propres candidatures
CREATE POLICY "Candidates can view own applications"
ON public.applications
FOR SELECT
TO authenticated
USING (student_id = public.get_user_internal_id());

-- Les candidats peuvent créer des candidatures
CREATE POLICY "Candidates can create applications"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (student_id = public.get_user_internal_id());

-- Les recruteurs peuvent voir les candidatures à leurs jobs
CREATE POLICY "Recruiters can view applications to their jobs"
ON public.applications
FOR SELECT
TO authenticated
USING (public.is_job_owner(job_id));

-- Les recruteurs peuvent mettre à jour le statut des candidatures à leurs jobs
CREATE POLICY "Recruiters can update applications to their jobs"
ON public.applications
FOR UPDATE
TO authenticated
USING (public.is_job_owner(job_id))
WITH CHECK (public.is_job_owner(job_id));

-- 4. POLITIQUES POUR LA TABLE NOTIFICATIONS (Système de notifications)
-- ======================================================================

-- Les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = public.get_user_internal_id());

-- Les utilisateurs peuvent mettre à jour leurs propres notifications (marquer comme lu)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = public.get_user_internal_id())
WITH CHECK (user_id = public.get_user_internal_id());

-- 5. POLITIQUES POUR LA TABLE SUBSCRIPTIONS (Abonnements)
-- =========================================================

-- Les utilisateurs peuvent voir leurs propres abonnements
CREATE POLICY "Users can view own subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (user_id = public.get_user_internal_id());

-- Les utilisateurs peuvent créer leurs propres abonnements
CREATE POLICY "Users can create own subscriptions"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (user_id = public.get_user_internal_id());

-- 6. COMMENTAIRES DE SÉCURITÉ
-- ============================

COMMENT ON POLICY "Users can view own profile" ON public.users IS 
'Sécurité : Les utilisateurs ne voient que leur propre profil par défaut';

COMMENT ON POLICY "Recruiters can view candidate profiles who applied" ON public.users IS 
'Sécurité : Les recruteurs ne voient les profils candidats que s''ils ont postulé à leurs jobs';

COMMENT ON POLICY "Recruiters can view active candidate posts profiles" ON public.users IS 
'Sécurité : Les recruteurs peuvent parcourir les candidats avec posts actifs pour le recrutement';

COMMENT ON POLICY "Users can view open jobs" ON public.jobs IS 
'Sécurité : Jobs ouverts visibles à tous pour faciliter la recherche d''emploi';

COMMENT ON POLICY "Recruiters can view applications to their jobs" ON public.applications IS 
'Sécurité : Les recruteurs ne voient que les candidatures à leurs propres jobs';

-- Migration de sécurité terminée avec succès
-- Les erreurs de récursion infinie sont maintenant corrigées
-- L'accès aux données personnelles est maintenant contrôlé et sécurisé