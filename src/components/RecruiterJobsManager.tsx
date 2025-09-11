import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LocationSelector } from "@/components/LocationSelector";
import { 
  Plus, 
  MapPin, 
  Clock, 
  Phone, 
  MessageCircle, 
  CheckCircle, 
  XCircle, 
  Eye,
  Edit,
  Trash2,
  Briefcase,
  Calendar,
  Star,
  Crown
} from "lucide-react";

interface UserProfile {
  id: string;
  role: string;
  jobs_published?: number;
  subscription_plan?: string;
  subscription_end?: string;
}

interface Job {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  location: string;
  commune?: string;
  quartier?: string;
  category?: string;
  contact_phone?: string;
  contact_whatsapp?: string;
  status: string;
  views_count: number;
  applications_count: number;
  created_at: string;
  start_date?: string;
  end_date?: string;
}

interface RecruiterJobsManagerProps {
  userProfile: UserProfile;
}

const RecruiterJobsManager = ({ userProfile }: RecruiterJobsManagerProps) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    amount: '',
    category: '',
    location: '',
    commune: '',
    quartier: '',
    contact_phone: '',
    contact_whatsapp: '',
    start_date: '',
    end_date: ''
  });
  const { toast } = useToast();

  // Subscription limits
  const subscriptionLimits = {
    free: { maxJobs: 10, cvAccess: false, topCandidates: false, price: 0 },
    standard: { maxJobs: 25, cvAccess: true, topCandidates: false, price: 1500 },
    pro: { maxJobs: -1, cvAccess: true, topCandidates: true, price: 3000 } // -1 means unlimited
  };

  const currentPlan = userProfile.subscription_plan || 'free';
  const currentLimit = subscriptionLimits[currentPlan as keyof typeof subscriptionLimits];
  const jobsPublished = userProfile.jobs_published || 0;
  const remainingJobs = currentLimit.maxJobs === -1 ? -1 : currentLimit.maxJobs - jobsPublished;

  const categories = [
    "Livraison", "Ménage", "Déménagement", "Soutien scolaire",
    "Mise en rayon", "Gardiennage", "Informatique", "Marketing",
    "Vente", "Construction", "Restauration", "Transport", "Autre"
  ];

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('recruiter_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les offres",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    if (remainingJobs === 0) {
      toast({
        title: "Limite atteinte",
        description: "Vous avez atteint la limite de publications. Passez à un plan supérieur.",
        variant: "destructive"
      });
      return;
    }

    if (!newJob.title || !newJob.description || !newJob.amount || !newJob.location || !newJob.start_date || !newJob.end_date) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('jobs')
        .insert({
          recruiter_id: userProfile.id,
          title: newJob.title,
          description: newJob.description,
          amount: parseInt(newJob.amount),
          category: newJob.category,
          location: newJob.location,
          commune: newJob.commune,
          quartier: newJob.quartier,
          contact_phone: newJob.contact_phone,
          contact_whatsapp: newJob.contact_whatsapp,
          start_date: newJob.start_date,
          end_date: newJob.end_date,
          status: 'open'
        });

      if (error) throw error;

      toast({
        title: "Offre créée",
        description: "Votre offre d'emploi a été publiée avec succès."
      });

      setShowCreateDialog(false);
      resetForm();
      fetchJobs();
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'offre",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setNewJob({
      title: '',
      description: '',
      amount: '',
      category: '',
      location: '',
      commune: '',
      quartier: '',
      contact_phone: '',
      contact_whatsapp: '',
      start_date: '',
      end_date: ''
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: "Ouvert", variant: "default" as const, icon: CheckCircle },
      closed: { label: "Fermé", variant: "secondary" as const, icon: XCircle },
      in_progress: { label: "En cours", variant: "secondary" as const, icon: Clock },
      archived: { label: "Archivé", variant: "outline" as const, icon: Clock }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const IconComponent = config?.icon || Clock;
    
    return (
      <Badge variant={config?.variant || "secondary"} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config?.label || status}
      </Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const planConfig = {
      free: { label: "Gratuit", variant: "secondary" as const, icon: Briefcase },
      standard: { label: "Standard", variant: "default" as const, icon: Star },
      pro: { label: "Pro", variant: "default" as const, icon: Crown }
    };

    const config = planConfig[plan as keyof typeof planConfig];
    const IconComponent = config?.icon || Briefcase;
    
    return (
      <Badge variant={config?.variant || "secondary"} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config?.label || plan}
      </Badge>
    );
  };

  const groupedJobs = {
    active: jobs.filter(job => job.status === 'open'),
    archived: jobs.filter(job => job.status === 'archived' || job.status === 'closed'),
    all: jobs
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Plan et limites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Jobs & Annonces publiés</span>
            <div className="flex items-center space-x-2">
              {getPlanBadge(currentPlan)}
              <Badge variant={remainingJobs > 0 || remainingJobs === -1 ? "default" : "destructive"}>
                {remainingJobs === -1 ? "Illimité" : `${remainingJobs} restantes`}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Plan {currentPlan}: {currentLimit.maxJobs === -1 ? 'Publications illimitées' : `${currentLimit.maxJobs} publications maximum`}
            {currentLimit.cvAccess && " • Accès CV candidats"}
            {currentLimit.topCandidates && " • Candidats les mieux notés"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Offres publiées: {jobsPublished} / {currentLimit.maxJobs === -1 ? '∞' : currentLimit.maxJobs}
              </p>
              {currentPlan === 'free' && remainingJobs <= 2 && (
                <p className="text-sm text-destructive mt-1">
                  Passez au plan Standard (1500 CFA/mois) ou Pro (3000 CFA/mois)
                </p>
              )}
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button disabled={remainingJobs === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer votre offre
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle offre d'emploi</DialogTitle>
                  <DialogDescription>
                    Publiez votre job rapidement et trouvez des candidats motivés.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Titre du job *</Label>
                    <Input
                      id="title"
                      value={newJob.title}
                      onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                      placeholder="Ex: Aide pour déménagement ce weekend"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={newJob.description}
                      onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                      placeholder="Décrivez précisément le travail à effectuer, les horaires, les conditions..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount">Montant (CFA) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={newJob.amount}
                        onChange={(e) => setNewJob({ ...newJob, amount: e.target.value })}
                        placeholder="Ex: 15000"
                      />
                    </div>
                    <div>
                      <Label>Catégorie</Label>
                      <Select value={newJob.category} onValueChange={(value) => setNewJob({ ...newJob, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="location">Ville *</Label>
                      <Input
                        id="location"
                        value={newJob.location}
                        onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                        placeholder="Ex: Abidjan"
                      />
                    </div>
                    <div>
                      <Label>Commune</Label>
                      <LocationSelector 
                        selectedCommune={newJob.commune}
                        selectedQuartier={newJob.quartier}
                        onCommuneChange={(commune) => setNewJob({ ...newJob, commune })}
                        onQuartierChange={(quartier) => setNewJob({ ...newJob, quartier })}
                        className="col-span-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">Date de début *</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={newJob.start_date}
                        onChange={(e) => setNewJob({ ...newJob, start_date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">Date de fin *</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={newJob.end_date}
                        onChange={(e) => setNewJob({ ...newJob, end_date: e.target.value })}
                        min={newJob.start_date || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact_phone">Téléphone *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="contact_phone"
                          value={newJob.contact_phone}
                          onChange={(e) => setNewJob({ ...newJob, contact_phone: e.target.value })}
                          placeholder="+225 07 XX XX XX XX"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="contact_whatsapp">WhatsApp (optionnel)</Label>
                      <div className="relative">
                        <MessageCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="contact_whatsapp"
                          value={newJob.contact_whatsapp}
                          onChange={(e) => setNewJob({ ...newJob, contact_whatsapp: e.target.value })}
                          placeholder="+225 07 XX XX XX XX"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleCreateJob}>
                      Publier le job
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Actifs ({groupedJobs.active.length})</TabsTrigger>
          <TabsTrigger value="archived">Archivés ({groupedJobs.archived.length})</TabsTrigger>
          <TabsTrigger value="all">Tous ({groupedJobs.all.length})</TabsTrigger>
        </TabsList>

        {Object.entries(groupedJobs).map(([status, jobList]) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {jobList.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Aucune offre {status === 'active' ? 'active' : status === 'archived' ? 'archivée' : ''}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {jobList.map((job) => (
                  <Card key={job.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-lg">{job.title}</CardTitle>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {job.location} {job.commune && `- ${job.commune}`}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {job.start_date && new Date(job.start_date).toLocaleDateString('fr-FR')} 
                              {job.end_date && ` - ${new Date(job.end_date).toLocaleDateString('fr-FR')}`}
                            </span>
                            <span className="flex items-center">
                              <Eye className="h-3 w-3 mr-1" />
                              {job.views_count} vues
                            </span>
                          </div>
                          {job.category && (
                            <Badge variant="outline" className="w-fit">
                              {job.category}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right space-y-2">
                          <p className="text-lg font-bold text-primary">
                            {job.amount.toLocaleString()} {job.currency}
                          </p>
                          {getStatusBadge(job.status)}
                          <p className="text-sm text-muted-foreground">
                            {job.applications_count} candidature{job.applications_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {job.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Publié le {new Date(job.created_at).toLocaleDateString('fr-FR')}</span>
                        <div className="flex items-center space-x-2">
                          {job.contact_phone && (
                            <span className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {job.contact_phone}
                            </span>
                          )}
                          {job.contact_whatsapp && (
                            <span className="flex items-center">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              WhatsApp
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default RecruiterJobsManager;