-- Fix infinite recursion in RLS policies for users table
-- First, drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create new simple and safe RLS policies
CREATE POLICY "Enable read access for users to their own data" 
ON public.users 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" 
ON public.users 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" 
ON public.users 
FOR DELETE 
USING (auth.uid() = user_id);