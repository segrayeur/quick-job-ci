-- Supprimer la table users existante et toutes ses dépendances
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.candidate_favorites CASCADE;
DROP TABLE IF EXISTS public.candidate_posts CASCADE;
DROP TABLE IF EXISTS public.candidate_ratings CASCADE;

-- Recréer le type user_role
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('candidate', 'recruiter', 'admin');

-- Recréer la table users avec une structure simplifiée
CREATE TABLE public.users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'candidate',
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur la table users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Créer les policies pour la table users
CREATE POLICY "Users can manage own data" 
ON public.users 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Créer une fonction pour créer un profil utilisateur
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
      location
    ) VALUES (
      user_uuid,
      user_email,
      user_role,
      create_user_profile.first_name,
      create_user_profile.last_name,
      create_user_profile.phone,
      create_user_profile.location
    )
    RETURNING id INTO new_user_id;
    
    RETURN new_user_id;
  END IF;
END;
$$;

-- Créer des fonctions utilitaires
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_internal_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Créer un trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();