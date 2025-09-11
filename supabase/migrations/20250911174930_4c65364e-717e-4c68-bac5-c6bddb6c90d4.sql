-- Drop ALL existing RLS policies on users table
DROP POLICY IF EXISTS "Enable read access for users to their own data" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.users;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.users;
DROP POLICY IF EXISTS "Users can manage their own data" ON public.users;
DROP POLICY IF EXISTS "Recruiters can view candidate profiles who applied" ON public.users;
DROP POLICY IF EXISTS "Recruiters can view active candidate posts profiles" ON public.users;
DROP POLICY IF EXISTS "Recruiters can view candidates who applied" ON public.users;
DROP POLICY IF EXISTS "Recruiters can view active candidate profiles" ON public.users;

-- Create new simplified RLS policies without recursive function calls
CREATE POLICY "Users can manage own data" ON public.users
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow recruiters to view candidate profiles who applied to their jobs
CREATE POLICY "Recruiters view candidates who applied" ON public.users
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
CREATE POLICY "Recruiters view active candidates" ON public.users
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