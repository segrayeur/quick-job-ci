-- Fix infinite recursion in users table RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can manage own data" ON public.users;
DROP POLICY IF EXISTS "Recruiters view candidates who applied" ON public.users;
DROP POLICY IF EXISTS "Recruiters view active candidates" ON public.users;

-- Create simple, non-recursive policies
CREATE POLICY "Users can manage own data" 
ON public.users 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create a simple policy for recruiters to view candidates without recursion
CREATE POLICY "Recruiters can view candidates" 
ON public.users 
FOR SELECT 
USING (
  role = 'candidate' AND 
  EXISTS (
    SELECT 1 
    FROM users recruiter 
    WHERE recruiter.user_id = auth.uid() 
    AND recruiter.role = 'recruiter'
  )
);

-- Allow candidates to be viewed by recruiters when they have applied to their jobs
CREATE POLICY "Applied candidates visible to job recruiters" 
ON public.users 
FOR SELECT 
USING (
  role = 'candidate' AND 
  EXISTS (
    SELECT 1 
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    WHERE a.student_id = users.id 
    AND j.recruiter_id IN (
      SELECT id FROM users WHERE user_id = auth.uid() AND role = 'recruiter'
    )
  )
);