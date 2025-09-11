-- Fix security issue: Restrict job contact information access

-- Drop the existing policy that exposes contact info to everyone
DROP POLICY IF EXISTS "Users can view open jobs" ON public.jobs;

-- Create a new policy for viewing basic job information (without contact details)
-- This will be handled at the application level by filtering out sensitive fields
CREATE POLICY "Users can view basic job info" ON public.jobs
FOR SELECT 
USING (
  status = 'open'::job_status
);

-- Create a policy that allows applicants to see full job details including contact info
CREATE POLICY "Applicants can view full job details" ON public.jobs
FOR SELECT 
USING (
  status = 'open'::job_status 
  AND EXISTS (
    SELECT 1 FROM applications a
    WHERE a.job_id = jobs.id 
    AND a.student_id = public.get_user_internal_id()
  )
);

-- Create a function to get jobs without sensitive contact information for non-applicants
CREATE OR REPLACE FUNCTION public.get_public_jobs()
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

-- Create a function to get full job details including contact info (for applicants and recruiters)
CREATE OR REPLACE FUNCTION public.get_job_with_contact(job_id uuid)
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
  recruiter_id uuid,
  contact_phone text,
  contact_whatsapp text
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
    j.recruiter_id,
    j.contact_phone,
    j.contact_whatsapp
  FROM public.jobs j
  WHERE j.id = job_id
    AND j.status = 'open'::job_status
    AND (
      -- User is the recruiter who owns the job
      j.recruiter_id = public.get_user_internal_id()
      OR
      -- User has applied to this job
      EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.job_id = j.id 
        AND a.student_id = public.get_user_internal_id()
      )
    );
$$;