-- Fix security vulnerability: Restrict job viewing to authenticated users only
-- This prevents contact information harvesting by anonymous users

-- Drop the existing policy that allows public access
DROP POLICY IF EXISTS "Candidates can view open jobs" ON public.jobs;

-- Create new policy requiring authentication for job viewing
CREATE POLICY "Authenticated users can view open jobs" 
ON public.jobs 
FOR SELECT 
TO authenticated
USING (status = 'open'::job_status);

-- Add a separate policy for public job browsing without contact info
-- This would require a view, but for now we'll just ensure authentication is required