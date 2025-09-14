import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter as DialogFooterComponent, 
  DialogHeader, 
  DialogTitle, 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LocationSelector } from "@/components/LocationSelector";
import { 
  Plus, MapPin, Briefcase, Crown, Star, 
  Edit, Trash2
} from "lucide-react";
import { UserProfile } from "@/integrations/supabase/types";

interface Job {
  id: string; created_at: string; title: string; description: string;
  category: string; location: string; commune?: string; quartier?: string;
  amount?: number; currency?: string; status: 'open' | 'closed';
  is_featured: boolean;
}

interface RecruiterJobsManagerProps {
  userProfile: UserProfile;
  onProfileUpdate?: () => void;
}

const PLAN_LIMITS = {
  free: 30,
  standard: 65,
  pro: Infinity,
};

const RecruiterJobsManager = ({ userProfile, onProfileUpdate }: RecruiterJobsManagerProps) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<Job>>({});
  const [isEditing, setIsEditing] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

  const { toast } = useToast();

  const planLimit = PLAN_LIMITS[userProfile.subscription_plan as keyof typeof PLAN_LIMITS] || 0;
  const remainingJobs = Math.max(0, planLimit - userProfile.jobs_published);
  const canPostJob = remainingJobs > 0;

  useEffect(() => {
    if (userProfile?.user_id) {
      fetchJobs();
    }
  }, [userProfile]);

  const fetchJobs = async () => {
    if (!userProfile?.user_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('recruiter_id', userProfile.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setJobs(data);
    } catch (error: any) {
      toast({ title: "Erreur de récupération", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => { setFormData({}); setIsEditing(false); };
  const openCreateDialog = () => { resetForm(); setShowFormDialog(true); };
  const openEditDialog = (job: Job) => { setFormData(job); setIsEditing(true); setShowFormDialog(true); };
  const handleFormChange = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleLocationChange = (location: any) => {
    handleFormChange("location", location.city);
    handleFormChange("commune", location.commune);
    handleFormChange("quartier", location.quartier);
  };

  const handleFormSubmit = async () => {
    if (isEditing) await handleUpdateJob(); else await handleCreateJob();
  };

  const handleCreateJob = async () => {
    try {
       const { data: latestUserData, error: userError } = await supabase
        .from('users')
        .select('jobs_published, subscription_plan')
        .eq('user_id', userProfile.user_id)
        .single();

      if (userError || !latestUserData) throw userError || new Error("Utilisateur non trouvé");

      const currentLimit = PLAN_LIMITS[latestUserData.subscription_plan as keyof typeof PLAN_LIMITS] || 0;
      if (latestUserData.jobs_published >= currentLimit) {
        toast({ title: "Limite atteinte", description: "Passez au plan supérieur pour publier plus d'offres.", variant: "destructive"});
        return;
      }

      const { data, error } = await supabase.from('jobs').insert({ 
        ...formData, recruiter_id: userProfile.user_id, status: 'open'
      }).select().single();

      if (error) throw error;
      
      await supabase.rpc('increment_jobs_published', { user_id_param: userProfile.user_id });
      
      toast({ title: "Offre créée!" });
      setShowFormDialog(false);
      fetchJobs();
      onProfileUpdate?.();
    } catch (error: any) {
      toast({ title: "Erreur de création", description: error.message, variant: "destructive" });
    }
  };
  
  const handleUpdateJob = async () => {
    // ... existing update logic ...
  };

  const handleDeleteConfirmation = (job: Job) => { setJobToDelete(job); setShowDeleteConfirm(true); };
  const handleDeleteJob = async () => { /* ... existing delete logic ... */ };

  const handleToggleFeatured = async (job: Job) => {
    if (userProfile.subscription_plan !== 'pro') {
      toast({ title: "Fonctionnalité Pro", description: "Passez au plan Pro pour mettre vos offres en avant.", variant: "destructive"});
      return;
    }
    // ... existing toggle logic ...
  };

  const JobCardComponent = ({ job }: { job: Job }) => (
    <Card className={`transition-all hover:shadow-md ${job.is_featured ? 'border-primary border-2' : ''}`}>
        {/* ... Card content ... */}
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gestion de vos Offres</CardTitle>
            <CardDescription>
              {userProfile.subscription_plan === 'pro' ? 'Vous avez des publications illimitées.' : `Vous pouvez publier ${remainingJobs} offre(s) supplémentaire(s).`}
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog} disabled={!canPostJob}>
            <Plus className="mr-2 h-4 w-4" /> Publier une offre
          </Button>
        </CardHeader>
      </Card>

        {/* ... Dialogs and Tabs ... */}
    </div>
  );
};

export default RecruiterJobsManager;
