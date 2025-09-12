-- Create function to fetch email by phone for login flow
CREATE OR REPLACE FUNCTION public.get_email_by_phone(phone_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  input_norm text;
  candidate_email text;
BEGIN
  -- Normalize input by removing non-digits
  input_norm := regexp_replace(coalesce(phone_input, ''), '[^0-9]+', '', 'g');

  -- Try to match against stored phone numbers (also normalized)
  SELECT u.email
  INTO candidate_email
  FROM public.users u
  WHERE 
    -- exact normalized match
    regexp_replace(coalesce(u.phone, ''), '[^0-9]+', '', 'g') = input_norm
    OR
    -- handle presence/absence of +225 country code
    regexp_replace(coalesce(u.phone, ''), '[^0-9]+', '', 'g') = (
      CASE 
        WHEN length(input_norm) > 3 AND left(input_norm, 3) = '225' THEN substr(input_norm, 4)
        ELSE input_norm
      END
    )
    OR
    regexp_replace(coalesce(u.phone, ''), '[^0-9]+', '', 'g') = ('225' || input_norm)
  LIMIT 1;

  RETURN candidate_email; -- may be null if not found
END;
$$;

COMMENT ON FUNCTION public.get_email_by_phone(text) IS 'Returns the email associated with a phone number for login. SECURITY DEFINER to bypass RLS safely.';