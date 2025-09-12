-- Créer un compte administrateur réel
-- Note: Utilisation d'un email valide pour l'authentification, le numéro sera dans le profil

DO $$
DECLARE
    admin_user_id UUID := 'b0000000-0000-0000-0000-000000000001';
BEGIN
    -- Créer l'utilisateur administrateur dans auth.users
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
            admin_user_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'admin@quickjobci.com',
            crypt('admin@123@', gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{"first_name": "Admin", "last_name": "QuickJob"}',
            now(),
            now()
        );
    EXCEPTION 
        WHEN unique_violation THEN 
            -- L'utilisateur existe déjà, mettre à jour le mot de passe
            UPDATE auth.users 
            SET 
                encrypted_password = crypt('admin@123@', gen_salt('bf')),
                updated_at = now()
            WHERE id = admin_user_id;
    END;

    -- Créer le profil administrateur dans public.users
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
            admin_user_id,
            'admin@quickjobci.com',
            'admin'::user_role,
            'Admin',
            'QuickJob CI',
            '+2250778518902',
            'Abidjan'
        );
    EXCEPTION 
        WHEN unique_violation THEN 
            -- Le profil existe déjà, le mettre à jour
            UPDATE public.users 
            SET 
                role = 'admin'::user_role,
                first_name = 'Admin',
                last_name = 'QuickJob CI',
                phone = '+2250778518902',
                location = 'Abidjan',
                updated_at = now()
            WHERE user_id = admin_user_id;
    END;
END $$;