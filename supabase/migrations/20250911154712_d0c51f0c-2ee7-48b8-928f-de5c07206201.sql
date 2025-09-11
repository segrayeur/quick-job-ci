-- Fix infinite recursion in RLS policies by using proper security definer functions
-- This addresses the critical security issue causing dashboard failures

-- First, drop problematic policies that cause recursion
DROP POLICY IF EXISTS "Recruiters can view candidate profiles who applied" ON public.users;
DROP POLICY IF EXISTS "Recruiters can view active candidate posts profiles" ON public.users;

-- Create improved policies using existing security definer functions with correct signatures
CREATE POLICY "Recruiters can view candidate profiles who applied" 
ON public.users 
FOR SELECT 
USING (
  role = 'candidate'::user_role AND 
  EXISTS (
    SELECT 1 FROM applications a
    JOIN jobs j ON j.id = a.job_id
    WHERE a.student_id = users.id 
    AND j.recruiter_id = public.get_user_internal_id(auth.uid())
  )
);

CREATE POLICY "Recruiters can view active candidate posts profiles" 
ON public.users 
FOR SELECT 
USING (
  role = 'candidate'::user_role AND 
  public.get_user_role_secure(auth.uid()) = 'recruiter' AND
  EXISTS (
    SELECT 1 FROM candidate_posts cp
    WHERE cp.candidate_id = users.id 
    AND cp.status = 'active'::text
  )
);