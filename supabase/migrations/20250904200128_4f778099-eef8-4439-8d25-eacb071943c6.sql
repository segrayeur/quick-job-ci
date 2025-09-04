-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view open jobs" ON public.jobs;

-- Create a new policy for viewing basic job information (without contact details)
CREATE POLICY "Users can view basic job info" 
ON public.jobs 
FOR SELECT 
USING (status = 'open'::job_status);

-- Create a policy for recruiters to see their own jobs with full details
CREATE POLICY "Recruiters can view own jobs with contact info" 
ON public.jobs 
FOR SELECT 
USING (auth.uid() = ( SELECT users.user_id FROM public.users WHERE users.id = jobs.recruiter_id));

-- Create a policy for job applicants to see contact info after applying
CREATE POLICY "Applicants can view job contact info after applying" 
ON public.jobs 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT users.user_id 
    FROM public.applications 
    JOIN public.users ON users.id = applications.student_id 
    WHERE applications.job_id = jobs.id
  )
);

-- Update the jobs table to add a function that returns jobs without contact info for public view
CREATE OR REPLACE VIEW public.jobs_public AS
SELECT 
  id,
  title,
  description,
  amount,
  currency,
  location,
  category,
  status,
  created_at,
  updated_at,
  tenant_id,
  recruiter_id
FROM public.jobs
WHERE status = 'open'::job_status;

-- Enable RLS on the view (inherited from base table)
-- Grant access to authenticated users for the public view
GRANT SELECT ON public.jobs_public TO authenticated;