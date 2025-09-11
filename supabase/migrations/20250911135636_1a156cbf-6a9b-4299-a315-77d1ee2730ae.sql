-- Drop existing problematic policies and functions with CASCADE
DROP POLICY IF EXISTS "Recruiters can view candidate profiles who applied" ON public.users;
DROP POLICY IF EXISTS "Recruiters can view active candidate posts profiles" ON public.users;
DROP POLICY IF EXISTS "Admins manage knowledge base" ON public.knowledge_base;
DROP POLICY IF EXISTS "Admins can manage tenants" ON public.tenants;

-- Drop the problematic functions with CASCADE
DROP FUNCTION IF EXISTS public.is_recruiter() CASCADE;
DROP FUNCTION IF EXISTS public.is_job_owner(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_internal_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;

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

-- Recreate the policies that were dropped
CREATE POLICY "Admins manage knowledge base"
ON public.knowledge_base
FOR ALL
USING (public.get_user_role() = 'admin'::user_role);

CREATE POLICY "Admins can manage tenants"
ON public.tenants
FOR ALL
USING (public.get_user_role() = 'admin'::user_role);

-- Create simplified policies that don't cause recursion
CREATE POLICY "Recruiters can view candidate profiles who applied"
ON public.users
FOR SELECT
USING (
  role = 'candidate'::user_role 
  AND auth.uid() IN (
    SELECT recruiter.user_id
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN users recruiter ON recruiter.id = j.recruiter_id
    WHERE a.student_id = users.id
  )
);

CREATE POLICY "Recruiters can view active candidate posts profiles"
ON public.users
FOR SELECT
USING (
  role = 'candidate'::user_role 
  AND auth.uid() IN (
    SELECT u.user_id
    FROM users u
    WHERE u.role = 'recruiter'::user_role
  )
  AND EXISTS (
    SELECT 1 FROM candidate_posts cp
    WHERE cp.candidate_id = users.id 
    AND cp.status = 'active'::text
  )
);