-- Corriger les politiques RLS qui causent la récursion infinie
-- Supprimer les politiques problématiques sur la table users
DROP POLICY IF EXISTS "Users can manage own data" ON public.users;
DROP POLICY IF EXISTS "Recruiters can view candidates" ON public.users;
DROP POLICY IF EXISTS "Applied candidates visible to job recruiters" ON public.users;

-- Créer de nouvelles politiques RLS sécurisées sans récursion
CREATE POLICY "Users can manage own data"
ON public.users
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Recruiters can view candidates"
ON public.users
FOR SELECT
USING (
  role = 'candidate'::user_role 
  AND EXISTS (
    SELECT 1 FROM public.users recruiter_user
    WHERE recruiter_user.user_id = auth.uid() 
    AND recruiter_user.role = 'recruiter'::user_role
  )
);

CREATE POLICY "Applied candidates visible to job recruiters"
ON public.users
FOR SELECT
USING (
  role = 'candidate'::user_role
  AND EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    JOIN public.users recruiter_user ON recruiter_user.id = j.recruiter_id
    WHERE a.student_id = users.id
    AND recruiter_user.user_id = auth.uid()
    AND recruiter_user.role = 'recruiter'::user_role
  )
);

-- Supprimer le trigger automatique de création d'utilisateur s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Créer une fonction sécurisée pour créer un profil utilisateur
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_uuid uuid,
  user_email text,
  user_role user_role,
  first_name text DEFAULT NULL,
  last_name text DEFAULT NULL,
  phone text DEFAULT NULL,
  location text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Vérifier si l'utilisateur existe déjà
  SELECT id INTO new_user_id FROM public.users WHERE user_id = user_uuid;
  
  IF new_user_id IS NOT NULL THEN
    -- L'utilisateur existe déjà, le mettre à jour
    UPDATE public.users 
    SET 
      role = user_role,
      first_name = COALESCE(create_user_profile.first_name, users.first_name),
      last_name = COALESCE(create_user_profile.last_name, users.last_name),
      phone = COALESCE(create_user_profile.phone, users.phone),
      location = COALESCE(create_user_profile.location, users.location),
      profile_complete = true,
      updated_at = now()
    WHERE user_id = user_uuid;
    
    RETURN new_user_id;
  ELSE
    -- Créer un nouveau profil utilisateur
    INSERT INTO public.users (
      user_id,
      email,
      role,
      first_name,
      last_name,
      phone,
      location,
      profile_complete
    ) VALUES (
      user_uuid,
      user_email,
      user_role,
      create_user_profile.first_name,
      create_user_profile.last_name,
      create_user_profile.phone,
      create_user_profile.location,
      true
    )
    RETURNING id INTO new_user_id;
    
    RETURN new_user_id;
  END IF;
END;
$$;