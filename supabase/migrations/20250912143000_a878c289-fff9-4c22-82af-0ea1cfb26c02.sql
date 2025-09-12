-- Corriger le problème de confirmation_token dans auth.users
-- Le problème vient du fait que certains champs requis sont NULL

DO $$
DECLARE
    admin_user_id UUID := 'b0000000-0000-0000-0000-000000000001';
BEGIN
    -- Mettre à jour l'utilisateur admin avec tous les champs requis
    UPDATE auth.users 
    SET 
        confirmation_token = '',
        recovery_token = '',
        email_change_token_new = '',
        email_change_token_current = '',
        confirmed_at = now(),
        recovery_sent_at = NULL,
        email_change_sent_at = NULL,
        email_change_confirm_status = 0,
        banned_until = NULL,
        deleted_at = NULL
    WHERE id = admin_user_id;
    
    -- Si l'utilisateur n'existe pas, le créer avec tous les champs requis
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change_token_current,
        confirmed_at,
        recovery_sent_at,
        email_change_sent_at,
        email_change_confirm_status,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        banned_until,
        deleted_at
    ) VALUES (
        admin_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'admin@quickjobci.com',
        crypt('admin@123@', gen_salt('bf')),
        now(),
        '',
        '',
        '',
        '',
        now(),
        NULL,
        NULL,
        0,
        '{"provider": "email", "providers": ["email"]}',
        '{"first_name": "Admin", "last_name": "QuickJob"}',
        now(),
        now(),
        NULL,
        NULL
    ) ON CONFLICT (id) DO UPDATE SET
        confirmation_token = '',
        recovery_token = '',
        email_change_token_new = '',
        email_change_token_current = '',
        confirmed_at = now(),
        email_change_confirm_status = 0;
        
END $$;