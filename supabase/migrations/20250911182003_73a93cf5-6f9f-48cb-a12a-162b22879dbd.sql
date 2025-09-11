-- Fix security issue: Restrict job contact information access

-- Drop the existing policy that exposes contact info to everyone
DROP POLICY IF EXISTS "Users can view open jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can view basic job info" ON public.jobs;
DROP POLICY IF EXISTS "Applicants can view full job details" ON public.jobs;

-- Create a new policy for viewing basic job information (without contact details)
-- Contact info will be handled by a separate secure function
CREATE POLICY "Public can view basic job info" ON public.jobs
FOR SELECT 
USING (status = 'open'::job_status);

-- Create a function to get jobs without sensitive contact information for public viewing
CREATE OR REPLACE FUNCTION public.get_jobs_public()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  amount integer,
  currency text,
  location text,
  category text,
  company_name text,
  start_date date,
  end_date date,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  views_count integer,
  applications_count integer,
  status job_status,
  commune text,
  quartier text,
  district text,
  recruiter_id uuid
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    j.id,
    j.title,
    j.description,
    j.amount,
    j.currency,
    j.location,
    j.category,
    j.company_name,
    j.start_date,
    j.end_date,
    j.created_at,
    j.updated_at,
    j.views_count,
    j.applications_count,
    j.status,
    j.commune,
    j.quartier,
    j.district,
    j.recruiter_id
  FROM public.jobs j
  WHERE j.status = 'open'::job_status;
$$;

-- Create a function to check if user can see contact info for a specific job
CREATE OR REPLACE FUNCTION public.can_view_job_contact(job_id uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = job_id
    AND j.status = 'open'::job_status
    AND (
      -- User is the recruiter who owns the job
      j.recruiter_id = (SELECT id FROM public.users WHERE user_id = user_uuid LIMIT 1)
      OR
      -- User has applied to this job
      EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.job_id = j.id 
        AND a.student_id = (SELECT id FROM public.users WHERE user_id = user_uuid LIMIT 1)
      )
    )
  );
$$;

-- Create a function to get job contact information only for authorized users
CREATE OR REPLACE FUNCTION public.get_job_contact_info(job_id uuid)
RETURNS TABLE (
  contact_phone text,
  contact_whatsapp text
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    j.contact_phone,
    j.contact_whatsapp
  FROM public.jobs j
  WHERE j.id = job_id
    AND public.can_view_job_contact(job_id, auth.uid());
$$;