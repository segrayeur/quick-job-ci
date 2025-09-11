-- Add job publication tracking and subscription fields to users table
ALTER TABLE public.users 
ADD COLUMN jobs_published INTEGER DEFAULT 0,
ADD COLUMN subscription_plan TEXT DEFAULT 'free',
ADD COLUMN subscription_end TIMESTAMP WITH TIME ZONE;

-- Add dates and enhanced location fields to jobs table
ALTER TABLE public.jobs 
ADD COLUMN start_date DATE,
ADD COLUMN end_date DATE,
ADD COLUMN commune TEXT,
ADD COLUMN quartier TEXT;

-- Create trigger to auto-archive jobs when end date is reached
CREATE OR REPLACE FUNCTION public.auto_archive_expired_jobs()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.jobs 
  SET status = 'archived'
  WHERE end_date < CURRENT_DATE 
    AND status = 'open';
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to increment jobs_published counter
CREATE OR REPLACE FUNCTION public.increment_jobs_counter()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users 
  SET jobs_published = jobs_published + 1
  WHERE id = NEW.recruiter_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for job creation
CREATE TRIGGER increment_jobs_on_insert
  AFTER INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_jobs_counter();

-- Create function to send notifications
CREATE OR REPLACE FUNCTION public.send_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (p_user_id, p_title, p_message, p_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to send notification when application status changes
CREATE OR REPLACE FUNCTION public.notify_on_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
  job_title TEXT;
  candidate_user_id UUID;
BEGIN
  -- Only trigger on status updates, not inserts
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Get job title and candidate user_id
    SELECT j.title, u.user_id
    INTO job_title, candidate_user_id
    FROM public.jobs j
    JOIN public.users u ON u.id = NEW.student_id
    WHERE j.id = NEW.job_id;
    
    -- Send notification to candidate
    IF NEW.status = 'accepted' THEN
      PERFORM public.send_notification(
        candidate_user_id,
        'Candidature acceptée',
        'Votre candidature pour "' || job_title || '" a été acceptée !',
        'accepted'
      );
    ELSIF NEW.status = 'rejected' THEN
      PERFORM public.send_notification(
        candidate_user_id,
        'Candidature refusée',
        'Votre candidature pour "' || job_title || '" a été refusée.',
        'rejected'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for application status changes
CREATE TRIGGER notify_application_status_change
  AFTER UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_application_status_change();