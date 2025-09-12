-- Créer des utilisateurs de test via insertion directe dans auth.users et users
-- Note: Ces insertions utiliseront les triggers existants

-- Créer un UUID fixe pour le candidat de test
DO $$
DECLARE
    candidate_user_id UUID := 'a0000000-0000-0000-0000-000000000001';
    recruiter_user_id UUID := 'a0000000-0000-0000-0000-000000000002';
BEGIN
    -- Candidat de test
    BEGIN
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            candidate_user_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'candidat@test.com',
            crypt('password123', gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{}',
            now(),
            now()
        );
    EXCEPTION 
        WHEN unique_violation THEN 
            -- L'utilisateur existe déjà, l'ignorer
            NULL;
    END;

    -- Profile du candidat
    BEGIN
        INSERT INTO public.users (
            user_id,
            email,
            role,
            first_name,
            last_name,
            phone,
            location
        ) VALUES (
            candidate_user_id,
            'candidat@test.com',
            'candidate'::user_role,
            'Marie',
            'Kandidat',
            '+225 01 23 45 67 89',
            'Abidjan'
        );
    EXCEPTION 
        WHEN unique_violation THEN 
            -- Le profil existe déjà, l'ignorer
            NULL;
    END;

    -- Recruteur de test
    BEGIN
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            recruiter_user_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'recruteur@test.com',
            crypt('password123', gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{}',
            now(),
            now()
        );
    EXCEPTION 
        WHEN unique_violation THEN 
            -- L'utilisateur existe déjà, l'ignorer
            NULL;
    END;

    -- Profile du recruteur
    BEGIN
        INSERT INTO public.users (
            user_id,
            email,
            role,
            first_name,
            last_name,
            phone,
            location
        ) VALUES (
            recruiter_user_id,
            'recruteur@test.com',
            'recruiter'::user_role,
            'Jean',
            'Recruteur',
            '+225 09 87 65 43 21',
            'Abidjan'
        );
    EXCEPTION 
        WHEN unique_violation THEN 
            -- Le profil existe déjà, l'ignorer
            NULL;
    END;
END $$;