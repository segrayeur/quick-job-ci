-- Corriger les champs NULL dans auth.users qui causent l'erreur de scan
-- Mise à jour uniquement des champs modifiables

DO $$
DECLARE
    admin_user_id UUID := 'b0000000-0000-0000-0000-000000000001';
BEGIN
    -- Mettre à jour seulement les champs non-générés et modifiables
    UPDATE auth.users 
    SET 
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change_token_current = COALESCE(email_change_token_current, ''),
        email_change_confirm_status = COALESCE(email_change_confirm_status, 0)
    WHERE id = admin_user_id 
      AND (confirmation_token IS NULL 
           OR recovery_token IS NULL 
           OR email_change_token_new IS NULL 
           OR email_change_token_current IS NULL 
           OR email_change_confirm_status IS NULL);
           
    -- Mettre à jour tous les utilisateurs qui ont des champs NULL problématiques
    UPDATE auth.users 
    SET 
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change_token_current = COALESCE(email_change_token_current, ''),
        email_change_confirm_status = COALESCE(email_change_confirm_status, 0)
    WHERE confirmation_token IS NULL 
       OR recovery_token IS NULL 
       OR email_change_token_new IS NULL 
       OR email_change_token_current IS NULL 
       OR email_change_confirm_status IS NULL;
           
END $$;