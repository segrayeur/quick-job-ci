-- Insérer des utilisateurs de test dans auth.users
-- CANDIDAT TEST
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'candidat@test.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
) ON CONFLICT (email) DO NOTHING;

-- RECRUTEUR TEST  
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'recruteur@test.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
) ON CONFLICT (email) DO NOTHING;

-- Créer les profils correspondants dans la table users
-- CANDIDAT TEST
INSERT INTO public.users (
    user_id,
    email,
    role,
    first_name,
    last_name,
    phone,
    location
) 
SELECT 
    au.id,
    'candidat@test.com',
    'candidate'::user_role,
    'Marie',
    'Kandidat',
    '+225 01 23 45 67 89',
    'Abidjan'
FROM auth.users au 
WHERE au.email = 'candidat@test.com'
ON CONFLICT (user_id) DO NOTHING;

-- RECRUTEUR TEST
INSERT INTO public.users (
    user_id,
    email,
    role,
    first_name,
    last_name,
    phone,
    location
) 
SELECT 
    au.id,
    'recruteur@test.com',
    'recruiter'::user_role,
    'Jean',
    'Recruteur',
    '+225 09 87 65 43 21',
    'Abidjan'
FROM auth.users au 
WHERE au.email = 'recruteur@test.com'
ON CONFLICT (user_id) DO NOTHING;