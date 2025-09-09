-- Add commune and quartier to users table
ALTER TABLE public.users 
ADD COLUMN commune TEXT,
ADD COLUMN quartier TEXT;

-- Add candidate application counter and VIP subscription
ALTER TABLE public.users
ADD COLUMN applications_created_count INTEGER DEFAULT 0,
ADD COLUMN is_vip_candidate BOOLEAN DEFAULT false,
ADD COLUMN vip_expiry_date TIMESTAMP WITH TIME ZONE;

-- Create candidate_posts table for candidates to create their own posts
CREATE TABLE public.candidate_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  skills TEXT[],
  hourly_rate INTEGER,
  currency TEXT DEFAULT 'CFA',
  availability TEXT,
  location TEXT,
  commune TEXT,
  quartier TEXT,
  status TEXT DEFAULT 'active',
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for candidate_posts
ALTER TABLE public.candidate_posts ENABLE ROW LEVEL SECURITY;

-- RLS policies for candidate_posts
CREATE POLICY "Candidates can manage own posts" ON public.candidate_posts
FOR ALL
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE users.user_id = auth.uid() 
  AND users.id = candidate_posts.candidate_id
));

CREATE POLICY "Everyone can view active candidate posts" ON public.candidate_posts
FOR SELECT
USING (status = 'active');

-- Add foreign key constraint
ALTER TABLE public.candidate_posts
ADD CONSTRAINT fk_candidate_posts_candidate_id
FOREIGN KEY (candidate_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Add accomplished status to job_status enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
        CREATE TYPE job_status AS ENUM ('open', 'closed', 'in_progress', 'accomplished');
    ELSE
        -- Add accomplished if it doesn't exist
        BEGIN
            ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'accomplished';
        EXCEPTION WHEN OTHERS THEN
            -- Value already exists, ignore
        END;
    END IF;
END $$;

-- Add accomplished status to application status if not exists
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger for candidate_posts updated_at
CREATE TRIGGER update_candidate_posts_updated_at
BEFORE UPDATE ON public.candidate_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a function to increment application counter
CREATE OR REPLACE FUNCTION public.increment_application_counter()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users 
  SET applications_created_count = applications_created_count + 1
  WHERE id = NEW.student_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for application counter
CREATE TRIGGER increment_application_counter_trigger
AFTER INSERT ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.increment_application_counter();