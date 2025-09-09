import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  Briefcase
} from "lucide-react";

interface UserProfile {
  id: string;
  applications_created_count: number;
  is_vip_candidate: boolean;
  vip_expiry_date?: string;
}

interface CandidatePost {
  id: string;
  title: string;
  description: string;
  skills: string[];
  hourly_rate: number;
  currency: string;
  availability: string;
  location: string;
  commune?: string;
  quartier?: string;
  status: string;
  views_count: number;
  created_at: string;
}

interface Application {
  id: string;
  status: string;
  message?: string;
  created_at: string;
  status_updated_at?: string;
  job: {
    id: string;
    title: string;
    description: string;
    amount: number;
    currency: string;
    location: string;
    category?: string;
    contact_phone?: string;
    contact_whatsapp?: string;
  };
}

interface CandidateApplicationsProps {
  userProfile: UserProfile;
}

const CandidateApplications = ({ userProfile }: CandidateApplicationsProps) => {
  const [candidatePosts, setCandidatePosts] = useState<CandidatePost[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    description: '',
    skills: '',
    hourly_rate: '',
    availability: '',
    location: '',
    commune: '',
    quartier: ''
  });
  const { toast } = useToast();

  const maxFreeApplications = 10;
  const maxVipApplications = 15;
  const remainingApplications = userProfile.is_vip_candidate 
    ? maxVipApplications - userProfile.applications_created_count
    : maxFreeApplications - userProfile.applications_created_count;

  useEffect(() => {
    fetchCandidatePosts();
    fetchApplications();
  }, []);

  const fetchCandidatePosts = async () => {
    try {
      const { data, error } = await supabase
        .from('candidate_posts')
        .select('*')
        .eq('candidate_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCandidatePosts(data || []);
    } catch (error) {
      console.error('Error fetching candidate posts:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          job:jobs(*)
        `)
        .eq('student_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data as any || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (remainingApplications <= 0) {
      toast({
        title: "Limite atteinte",
        description: "Vous avez atteint la limite de candidatures. Souscrivez au plan VIP-Cant pour plus de candidatures.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('candidate_posts')
        .insert({
          candidate_id: userProfile.id,
          title: newPost.title,
          description: newPost.description,
          skills: newPost.skills.split(',').map(s => s.trim()),
          hourly_rate: parseInt(newPost.hourly_rate),
          availability: newPost.availability,
          location: newPost.location,
          commune: newPost.commune,
          quartier: newPost.quartier
        });

      if (error) throw error;

      toast({
        title: "Candidature créée",
        description: "Votre candidature a été publiée avec succès."
      });

      setShowCreateDialog(false);
      setNewPost({
        title: '',
        description: '',
        skills: '',
        hourly_rate: '',
        availability: '',
        location: '',
        commune: '',
        quartier: ''
      });
      fetchCandidatePosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la candidature",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "En attente", variant: "secondary" as const },
      accepted: { label: "Acceptée", variant: "default" as const },
      rejected: { label: "Refusée", variant: "destructive" as const },
      accomplished: { label: "Accomplie", variant: "default" as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge variant={config?.variant || "secondary"}>
        {config?.label || status}
      </Badge>
    );
  };

  const groupedApplications = {
    accepted: applications.filter(app => app.status === 'accepted'),
    rejected: applications.filter(app => app.status === 'rejected'),
    pending: applications.filter(app => app.status === 'pending'),
    accomplished: applications.filter(app => app.status === 'accomplished')
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Compteur de candidatures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Mes candidatures</span>
            <Badge variant={remainingApplications > 0 ? "default" : "destructive"}>
              {remainingApplications} restantes
            </Badge>
          </CardTitle>
          <CardDescription>
            {userProfile.is_vip_candidate 
              ? `Plan VIP-Cant: ${maxVipApplications} candidatures maximum`
              : `Plan gratuit: ${maxFreeApplications} candidatures maximum`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Candidatures créées: {userProfile.applications_created_count}
              </p>
              {!userProfile.is_vip_candidate && remainingApplications <= 2 && (
                <p className="text-sm text-destructive mt-1">
                  Souscrivez au plan VIP-Cant pour 15 candidatures supplémentaires
                </p>
              )}
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button disabled={remainingApplications <= 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une candidature
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle candidature</DialogTitle>
                  <DialogDescription>
                    Décrivez vos compétences et votre disponibilité pour attirer les recruteurs.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Titre de votre candidature</Label>
                    <Input
                      id="title"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      placeholder="Ex: Développeur web junior disponible"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newPost.description}
                      onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
                      placeholder="Décrivez vos compétences, expériences et motivations..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="skills">Compétences (séparées par des virgules)</Label>
                    <Input
                      id="skills"
                      value={newPost.skills}
                      onChange={(e) => setNewPost({ ...newPost, skills: e.target.value })}
                      placeholder="Ex: HTML, CSS, JavaScript, React"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hourly_rate">Tarif horaire (CFA)</Label>
                      <Input
                        id="hourly_rate"
                        type="number"
                        value={newPost.hourly_rate}
                        onChange={(e) => setNewPost({ ...newPost, hourly_rate: e.target.value })}
                        placeholder="2000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="availability">Disponibilité</Label>
                      <Select value={newPost.availability} onValueChange={(value) => setNewPost({ ...newPost, availability: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immédiate">Immédiate</SelectItem>
                          <SelectItem value="dans la semaine">Dans la semaine</SelectItem>
                          <SelectItem value="dans le mois">Dans le mois</SelectItem>
                          <SelectItem value="flexible">Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="location">Ville</Label>
                      <Input
                        id="location"
                        value={newPost.location}
                        onChange={(e) => setNewPost({ ...newPost, location: e.target.value })}
                        placeholder="Abidjan"
                      />
                    </div>
                    <div>
                      <Label htmlFor="commune">Commune</Label>
                      <Input
                        id="commune"
                        value={newPost.commune}
                        onChange={(e) => setNewPost({ ...newPost, commune: e.target.value })}
                        placeholder="Cocody"
                      />
                    </div>
                    <div>
                      <Label htmlFor="quartier">Quartier</Label>
                      <Input
                        id="quartier"
                        value={newPost.quartier}
                        onChange={(e) => setNewPost({ ...newPost, quartier: e.target.value })}
                        placeholder="Riviera"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleCreatePost}>
                      Publier la candidature
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="my-posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-posts">Mes candidatures</TabsTrigger>
          <TabsTrigger value="applications">Candidatures envoyées</TabsTrigger>
          <TabsTrigger value="by-status">Par statut</TabsTrigger>
        </TabsList>

        <TabsContent value="my-posts" className="space-y-4">
          {candidatePosts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Plus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucune candidature créée pour le moment</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {candidatePosts.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{post.title}</CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {post.location} {post.commune && `- ${post.commune}`}
                          </span>
                          <span className="flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {post.views_count} vues
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          {post.hourly_rate.toLocaleString()} {post.currency}/h
                        </p>
                        <Badge variant={post.status === 'active' ? 'default' : 'secondary'}>
                          {post.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {post.description}
                    </p>
                    {post.skills && post.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {post.skills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Créé le {new Date(post.created_at).toLocaleDateString('fr-FR')}</span>
                      <span>Disponibilité: {post.availability}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          {applications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucune candidature envoyée pour le moment</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {applications.map((application) => (
                <Card key={application.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{application.job.title}</CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {application.job.location}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Candidature du {new Date(application.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          {application.job.amount.toLocaleString()} {application.job.currency}
                        </p>
                        {getStatusBadge(application.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {application.job.description}
                    </p>
                    {application.message && (
                      <div className="bg-muted p-3 rounded-md mb-3">
                        <p className="text-sm"><strong>Votre message:</strong> {application.message}</p>
                      </div>
                    )}
                    {application.status === 'accepted' && application.job.contact_phone && (
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="flex items-center text-primary">
                          <Phone className="h-4 w-4 mr-1" />
                          {application.job.contact_phone}
                        </span>
                        {application.job.contact_whatsapp && (
                          <span className="flex items-center text-green-600">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            {application.job.contact_whatsapp}
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="by-status" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Offres acceptées ({groupedApplications.accepted.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groupedApplications.accepted.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucune offre acceptée</p>
                ) : (
                  <div className="space-y-3">
                    {groupedApplications.accepted.slice(0, 3).map((app) => (
                      <div key={app.id} className="p-3 border rounded-md">
                        <h4 className="font-medium text-sm">{app.job.title}</h4>
                        <p className="text-xs text-muted-foreground">{app.job.location}</p>
                        {app.job.contact_phone && (
                          <p className="text-xs text-primary mt-1">📞 {app.job.contact_phone}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-600">
                  <Clock className="h-5 w-5 mr-2" />
                  En attente ({groupedApplications.pending.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groupedApplications.pending.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucune candidature en attente</p>
                ) : (
                  <div className="space-y-3">
                    {groupedApplications.pending.slice(0, 3).map((app) => (
                      <div key={app.id} className="p-3 border rounded-md">
                        <h4 className="font-medium text-sm">{app.job.title}</h4>
                        <p className="text-xs text-muted-foreground">{app.job.location}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <XCircle className="h-5 w-5 mr-2" />
                  Refusées ({groupedApplications.rejected.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groupedApplications.rejected.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucune candidature refusée</p>
                ) : (
                  <div className="space-y-3">
                    {groupedApplications.rejected.slice(0, 3).map((app) => (
                      <div key={app.id} className="p-3 border rounded-md">
                        <h4 className="font-medium text-sm">{app.job.title}</h4>
                        <p className="text-xs text-muted-foreground">{app.job.location}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-blue-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Accomplies ({groupedApplications.accomplished.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groupedApplications.accomplished.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucune offre accomplie</p>
                ) : (
                  <div className="space-y-3">
                    {groupedApplications.accomplished.slice(0, 3).map((app) => (
                      <div key={app.id} className="p-3 border rounded-md">
                        <h4 className="font-medium text-sm">{app.job.title}</h4>
                        <p className="text-xs text-muted-foreground">{app.job.location}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CandidateApplications;