import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Search, MapPin, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/integrations/supabase/types';

interface AvailableJobsProps {
  userProfile: UserProfile;
  onProfileUpdate?: () => void;
}

const CANDIDATE_PLAN_LIMITS = {
  free: 20,
  standard: 45,
  pro: 100,
};

const AvailableJobs = ({ userProfile, onProfileUpdate }: AvailableJobsProps) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [userApplications, setUserApplications] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchJobs();
    fetchUserApplications();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, company_name:users(company_name)')
        .eq('status', 'open')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      toast({ title: 'Erreur', description: "Impossible de charger les offres.", variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserApplications = async () => {
    if (!userProfile?.user_id) return;
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('job_id')
        .eq('candidate_id', userProfile.user_id);
      if (error) throw error;
      setUserApplications(data.map(app => app.job_id));
    } catch (error) {
      console.error("Erreur lors de la récupération des candidatures de l'utilisateur:", error);
    }
  };

  const handleApply = async (job: any) => {
    setIsApplying(true);
    try {
      const { data: latestUserData, error: userError } = await supabase
        .from('users')
        .select('applications_created_count, subscription_plan')
        .eq('user_id', userProfile.user_id)
        .single();

      if (userError || !latestUserData) throw userError || new Error("Utilisateur non trouvé");

      const limit = CANDIDATE_PLAN_LIMITS[latestUserData.subscription_plan as keyof typeof CANDIDATE_PLAN_LIMITS] || 20;
      if (latestUserData.applications_created_count >= limit) {
        toast({
          title: "Limite de candidatures atteinte",
          description: "Passez à un plan supérieur pour postuler à plus d'offres.",
          variant: "destructive",
        });
        return;
      }

      const { error: applyError } = await supabase.from('applications').insert({
        candidate_id: userProfile.user_id,
        job_id: job.id,
        recruiter_id: job.user_id,
        status: 'pending'
      });

      if (applyError) throw applyError;
      
      const newCount = latestUserData.applications_created_count + 1;
      await supabase.from('users').update({ applications_created_count: newCount }).eq('user_id', userProfile.user_id);

      toast({ title: "Candidature envoyée!", description: `Votre candidature pour le poste de ${job.title} a été envoyée.` });
      setUserApplications(prev => [...prev, job.id]);
      setSelectedJob(null);
      onProfileUpdate?.();

    } catch (error: any) {
      toast({ title: "Erreur de candidature", description: error.message, variant: "destructive" });
    } finally {
      setIsApplying(false);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rechercher des Offres d'Emploi</CardTitle>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Rechercher par titre, mot-clé ou catégorie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <p>Chargement des offres...</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{job.title}</CardTitle>
                <CardDescription>{job.company_name?.company_name}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{job.description}</p>
                <div className="flex items-center text-sm mt-4"><Briefcase className="w-4 h-4 mr-2" /> {job.category}</div>
                <div className="flex items-center text-sm mt-2"><MapPin className="w-4 h-4 mr-2" /> {job.location}, {job.commune}</div>
              </CardContent>
              <div className="p-6 pt-0">
                 <Button className="w-full" onClick={() => setSelectedJob(job)} disabled={userApplications.includes(job.id)}>
                   {userApplications.includes(job.id) ? 'Candidature envoyée' : 'Voir les détails'}
                 </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedJob} onOpenChange={(isOpen) => !isOpen && setSelectedJob(null)}>
        <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{selectedJob?.title}</DialogTitle>
              <DialogDescription>{selectedJob?.company_name?.company_name} - {selectedJob?.location}, {selectedJob?.commune}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedJob?.description}</p>
              <div><Badge variant="outline">{selectedJob?.category}</Badge></div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setSelectedJob(null)}>Fermer</Button>
              <Button onClick={() => handleApply(selectedJob)} disabled={isApplying}>
                {isApplying ? 'Envoi en cours...' : 'Postuler'}
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AvailableJobs;
