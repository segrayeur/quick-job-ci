import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Clock, 
  Briefcase, 
  Search, 
  Filter,
  Send,
  Eye,
  AlertCircle
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  location: string;
  commune?: string;
  district?: string;
  category?: string;
  status: string;
  created_at: string;
  contact_phone?: string;
  contact_whatsapp?: string;
  company_name?: string;
}

interface UserProfile {
  id: string;
  role: string;
  location?: string;
  commune?: string;
  quartier?: string;
  skills?: string[];
}

interface AvailableJobsProps {
  userProfile: UserProfile;
}

const AvailableJobs = ({ userProfile }: AvailableJobsProps) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [applying, setApplying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, locationFilter, categoryFilter, userProfile]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les offres d'emploi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    // Filtre par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.category && job.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtre par localisation
    if (locationFilter !== "all") {
      if (locationFilter === "my-area" && userProfile.location) {
        filtered = filtered.filter(job => 
          job.location === userProfile.location ||
          job.commune === userProfile.commune
        );
      } else {
        filtered = filtered.filter(job => 
          job.location === locationFilter ||
          job.commune === locationFilter
        );
      }
    }

    // Filtre par catégorie
    if (categoryFilter !== "all") {
      filtered = filtered.filter(job => job.category === categoryFilter);
    }

    // Priorité pour les jobs de ma zone
    const myAreaJobs = filtered.filter(job => 
      job.location === userProfile.location ||
      job.commune === userProfile.commune
    );
    const otherJobs = filtered.filter(job => 
      job.location !== userProfile.location &&
      job.commune !== userProfile.commune
    );

    setFilteredJobs([...myAreaJobs, ...otherJobs]);
  };

  const handleApplyToJob = async () => {
    if (!selectedJob) return;

    setApplying(true);
    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          job_id: selectedJob.id,
          student_id: userProfile.id,
          message: applicationMessage,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Candidature envoyée",
        description: "Votre candidature a été envoyée avec succès."
      });

      setShowApplicationDialog(false);
      setApplicationMessage("");
      setSelectedJob(null);
    } catch (error) {
      console.error('Error applying to job:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre candidature",
        variant: "destructive"
      });
    } finally {
      setApplying(false);
    }
  };

  const getUrgencyLevel = (description: string): 'high' | 'medium' | 'low' => {
    const urgentKeywords = ['urgent', 'immédiat', 'rapidement', 'asap', 'aujourd\'hui'];
    const mediumKeywords = ['dans la semaine', 'prochainement', 'bientôt'];
    
    const lowerDesc = description.toLowerCase();
    
    if (urgentKeywords.some(keyword => lowerDesc.includes(keyword))) {
      return 'high';
    } else if (mediumKeywords.some(keyword => lowerDesc.includes(keyword))) {
      return 'medium';
    }
    return 'low';
  };

  const getUrgencyBadge = (urgency: 'high' | 'medium' | 'low') => {
    const config = {
      high: { label: "Urgent", variant: "destructive" as const },
      medium: { label: "Modéré", variant: "secondary" as const },
      low: { label: "Normal", variant: "outline" as const }
    };
    
    const { label, variant } = config[urgency];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const uniqueLocations = Array.from(new Set(jobs.map(job => job.location).filter(Boolean)));
  const uniqueCategories = Array.from(new Set(jobs.map(job => job.category).filter(Boolean)));

  // Séparer les jobs pour ma zone et autres
  const myAreaJobs = filteredJobs.filter(job => 
    job.location === userProfile.location || job.commune === userProfile.commune
  );
  const otherJobs = filteredJobs.filter(job => 
    job.location !== userProfile.location && job.commune !== userProfile.commune
  );

  if (loading) {
    return <div className="flex items-center justify-center p-8">Chargement des offres...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtres de recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Titre, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location">Localisation</Label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger id="location">
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les zones</SelectItem>
                  <SelectItem value="my-area">Ma zone ({userProfile.location})</SelectItem>
                  {uniqueLocations.map((location) => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {uniqueCategories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setLocationFilter("all");
                  setCategoryFilter("all");
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offres pour ma zone */}
      {myAreaJobs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary" />
            Offres disponibles pour ma zone ({myAreaJobs.length})
          </h3>
          <div className="grid gap-4">
            {myAreaJobs.map((job) => {
              const urgency = getUrgencyLevel(job.description);
              return (
                <Card key={job.id} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {job.location} {job.commune && `- ${job.commune}`}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(job.created_at).toLocaleDateString('fr-FR')}
                          </span>
                          {job.category && (
                            <Badge variant="outline" className="text-xs">
                              {job.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-lg font-bold text-primary">
                          {job.amount.toLocaleString()} {job.currency}
                        </p>
                        {getUrgencyBadge(urgency)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {job.description}
                    </p>
                    {job.company_name && (
                      <p className="text-sm font-medium mb-2">
                        Entreprise: {job.company_name}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Contacts masqués jusqu'à acceptation
                        </span>
                      </div>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedJob(job)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir détails
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedJob(job);
                            setShowApplicationDialog(true);
                          }}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Postuler
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Autres offres disponibles */}
      {otherJobs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Briefcase className="h-5 w-5 mr-2" />
            Autres offres disponibles ({otherJobs.length})
          </h3>
          <div className="grid gap-4">
            {otherJobs.map((job) => {
              const urgency = getUrgencyLevel(job.description);
              return (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {job.location} {job.commune && `- ${job.commune}`}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(job.created_at).toLocaleDateString('fr-FR')}
                          </span>
                          {job.category && (
                            <Badge variant="outline" className="text-xs">
                              {job.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-lg font-bold text-primary">
                          {job.amount.toLocaleString()} {job.currency}
                        </p>
                        {getUrgencyBadge(urgency)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {job.description}
                    </p>
                    {job.company_name && (
                      <p className="text-sm font-medium mb-2">
                        Entreprise: {job.company_name}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Contacts masqués jusqu'à acceptation
                        </span>
                      </div>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedJob(job)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir détails
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedJob(job);
                            setShowApplicationDialog(true);
                          }}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Postuler
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {filteredJobs.length === 0 && !loading && (
        <Card>
          <CardContent className="py-8 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Aucune offre trouvée avec les filtres appliqués
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de candidature */}
      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Postuler à cette offre</DialogTitle>
            <DialogDescription>
              {selectedJob?.title} - {selectedJob?.location}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="message">Message de candidature (optionnel)</Label>
              <Textarea
                id="message"
                placeholder="Décrivez pourquoi vous êtes le candidat idéal pour ce poste..."
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowApplicationDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleApplyToJob} disabled={applying}>
                {applying ? "Envoi..." : "Envoyer ma candidature"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog détails du job */}
      <Dialog open={!!selectedJob && !showApplicationDialog} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedJob?.title}</DialogTitle>
            <DialogDescription>
              {selectedJob?.location} {selectedJob?.commune && `- ${selectedJob.commune}`}
            </DialogDescription>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description complète</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedJob.description}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-1">Rémunération</h4>
                  <p className="text-lg font-bold text-primary">
                    {selectedJob.amount.toLocaleString()} {selectedJob.currency}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Catégorie</h4>
                  <p className="text-sm">{selectedJob.category || 'Non spécifiée'}</p>
                </div>
              </div>
              {selectedJob.company_name && (
                <div>
                  <h4 className="font-medium mb-1">Entreprise</h4>
                  <p className="text-sm">{selectedJob.company_name}</p>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedJob(null)}>
                  Fermer
                </Button>
                <Button onClick={() => setShowApplicationDialog(true)}>
                  <Send className="h-4 w-4 mr-1" />
                  Postuler maintenant
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AvailableJobs;