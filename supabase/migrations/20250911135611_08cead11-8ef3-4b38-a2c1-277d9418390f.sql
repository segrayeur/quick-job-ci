-- Drop existing problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Recruiters can view candidate profiles who applied" ON public.users;
DROP POLICY IF EXISTS "Recruiters can view active candidate posts profiles" ON public.users;

-- Drop the problematic functions that cause recursion
DROP FUNCTION IF EXISTS public.is_recruiter();
DROP FUNCTION IF EXISTS public.is_job_owner(uuid);
DROP FUNCTION IF EXISTS public.get_user_internal_id();
DROP FUNCTION IF EXISTS public.get_user_role();

-- Create new security definer functions that avoid recursion
CREATE OR REPLACE FUNCTION public.get_user_internal_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_recruiter()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE user_id = auth.uid() AND role = 'recruiter'::user_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_job_owner(job_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.users u ON u.id = j.recruiter_id
    WHERE j.id = job_id AND u.user_id = auth.uid()
  );
$$;

-- Recreate the policies with simpler logic to avoid recursion
CREATE POLICY "Recruiters can view candidate profiles who applied"
ON public.users
FOR SELECT
USING (
  role = 'candidate'::user_role 
  AND EXISTS (
    SELECT 1 FROM public.users recruiter_user
    WHERE recruiter_user.user_id = auth.uid() 
    AND recruiter_user.role = 'recruiter'::user_role
  )
  AND EXISTS (
    SELECT 1 FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN users recruiter ON recruiter.id = j.recruiter_id
    WHERE a.student_id = users.id 
    AND recruiter.user_id = auth.uid()
  )
);

CREATE POLICY "Recruiters can view active candidate posts profiles"
ON public.users
FOR SELECT
USING (
  role = 'candidate'::user_role 
  AND EXISTS (
    SELECT 1 FROM public.users recruiter_user
    WHERE recruiter_user.user_id = auth.uid() 
    AND recruiter_user.role = 'recruiter'::user_role
  )
  AND EXISTS (
    SELECT 1 FROM candidate_posts cp
    WHERE cp.candidate_id = users.id 
    AND cp.status = 'active'::text
  )
);