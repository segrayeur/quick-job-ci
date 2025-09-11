import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CrossNotificationSystemProps {
  userProfile: {
    id: string;
    role: string;
  };
}

const CrossNotificationSystem = ({ userProfile }: CrossNotificationSystemProps) => {
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to applications for recruiters
    if (userProfile.role === 'recruiter') {
      const applicationsSub = supabase
        .channel('recruiter-applications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'applications',
        }, async (payload) => {
          // Check if this application is for recruiter's job
          const { data: job } = await supabase
            .from('jobs')
            .select('recruiter_id, title')
            .eq('id', payload.new.job_id)
            .maybeSingle();

          if (job && job.recruiter_id === userProfile.id) {
            toast({
              title: "Nouvelle candidature",
              description: `Une nouvelle candidature a été reçue pour "${job.title}"`,
            });
          }
        })
        .subscribe();

      return () => {
        applicationsSub.unsubscribe();
      };
    }

    // Subscribe to application status updates for candidates
    if (userProfile.role === 'candidate') {
      const statusUpdatesSub = supabase
        .channel('candidate-status-updates')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'applications',
          filter: `student_id=eq.${userProfile.id}`
        }, async (payload) => {
          const oldStatus = payload.old.status;
          const newStatus = payload.new.status;
          
          if (oldStatus !== newStatus) {
            const { data: job } = await supabase
              .from('jobs')
              .select('title')
              .eq('id', payload.new.job_id)
              .maybeSingle();

            if (job) {
              const statusMessages = {
                accepted: 'Votre candidature a été acceptée !',
                rejected: 'Votre candidature a été refusée.',
                accomplished: 'Votre mission a été marquée comme accomplie.'
              };

              toast({
                title: job.title,
                description: statusMessages[newStatus as keyof typeof statusMessages] || `Statut mis à jour: ${newStatus}`,
                variant: newStatus === 'accepted' || newStatus === 'accomplished' ? 'default' : 'destructive'
              });
            }
          }
        })
        .subscribe();

      return () => {
        statusUpdatesSub.unsubscribe();
      };
    }

    // Subscribe to new jobs for candidates
    if (userProfile.role === 'candidate') {
      const newJobsSub = supabase
        .channel('new-jobs')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'jobs',
        }, (payload) => {
          toast({
            title: "Nouvelle offre d'emploi",
            description: `"${payload.new.title}" - ${payload.new.amount.toLocaleString()} ${payload.new.currency}`,
          });
        })
        .subscribe();

      return () => {
        newJobsSub.unsubscribe();
      };
    }
  }, [userProfile, toast]);

  return null; // This component doesn't render anything
};

export default CrossNotificationSystem;