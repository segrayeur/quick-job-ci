-- Drop existing RLS policies that cause infinite recursion
DROP POLICY IF EXISTS "Recruiters can view candidate profiles who applied" ON public.users;
DROP POLICY IF EXISTS "Recruiters can view active candidate posts profiles" ON public.users;

-- Create simplified RLS policies without recursive function calls
CREATE POLICY "Users can manage their own data" ON public.users
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow recruiters to view candidate profiles who applied to their jobs
CREATE POLICY "Recruiters can view candidates who applied" ON public.users
FOR SELECT 
USING (
  role = 'candidate'::user_role 
  AND EXISTS (
    SELECT 1 FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN users recruiter ON recruiter.id = j.recruiter_id
    WHERE a.student_id = users.id 
    AND recruiter.user_id = auth.uid()
  )
);

-- Allow recruiters to view candidate profiles with active posts
CREATE POLICY "Recruiters can view active candidate profiles" ON public.users
FOR SELECT 
USING (
  role = 'candidate'::user_role 
  AND EXISTS (
    SELECT 1 FROM users recruiter
    WHERE recruiter.user_id = auth.uid() 
    AND recruiter.role = 'recruiter'::user_role
  )
  AND EXISTS (
    SELECT 1 FROM candidate_posts cp
    WHERE cp.candidate_id = users.id 
    AND cp.status = 'active'::text
  )
);

-- Update security functions to be more efficient and avoid recursion
CREATE OR REPLACE FUNCTION public.get_user_role_secure(user_uuid uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role::text FROM public.users WHERE user_id = user_uuid LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_internal_id(user_uuid uuid DEFAULT auth.uid())
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.users WHERE user_id = user_uuid LIMIT 1;
$$;