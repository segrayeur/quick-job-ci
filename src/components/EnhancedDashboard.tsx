import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  BellDot,
  Eye, 
  Users, 
  Calendar,
  Star,
  Heart,
  MessageSquare,
  Phone,
  Mail,
  Download,
  Edit,
  Copy,
  Trash2,
  Award,
  TrendingUp,
  DollarSign,
  Clock,
  MapPin,
  Briefcase,
  UserCheck,
  Filter,
  Search
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface CandidateProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  location?: string;
  skills?: string[];
  availability?: string;
  experience?: string;
  cv_url?: string;
  is_verified: boolean;
  profile_complete: boolean;
}

interface JobWithApplications {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  location: string;
  district?: string;
  company_name?: string;
  category: string;
  status: string;
  created_at: string;
  views_count: number;
  applications_count: number;
  applications?: {
    id: string;
    status: string;
    created_at: string;
    candidate: CandidateProfile;
  }[];
}

interface EnhancedDashboardProps {
  userProfile: any;
  subscription: any;
  jobs: any[];
  applications: any[];
  onRefresh: () => void;
}

const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({
  userProfile,
  subscription,
  jobs,
  applications,
  onRefresh
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchFilters, setSearchFilters] = useState({
    location: '',
    skills: '',
    availability: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (userProfile) {
      fetchNotifications();
      if (userProfile.role === 'recruiter') {
        fetchCandidates();
        fetchFavorites();
      }
    }
  }, [userProfile]);

  const fetchNotifications = async () => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchCandidates = async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'candidate')
        .eq('profile_complete', true)
        .order('created_at', { ascending: false });
      
      setCandidates(data || []);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    }
  };

  const fetchFavorites = async () => {
    try {
      const { data } = await supabase
        .from('candidate_favorites')
        .select('candidate_id')
        .eq('recruiter_id', userProfile.id);
      
      setFavorites(data?.map(f => f.candidate_id) || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const toggleFavorite = async (candidateId: string) => {
    try {
      if (favorites.includes(candidateId)) {
        await supabase
          .from('candidate_favorites')
          .delete()
          .eq('recruiter_id', userProfile.id)
          .eq('candidate_id', candidateId);
        
        setFavorites(prev => prev.filter(id => id !== candidateId));
        toast({ title: "Retiré des favoris" });
      } else {
        await supabase
          .from('candidate_favorites')
          .insert({
            recruiter_id: userProfile.id,
            candidate_id: candidateId
          });
        
        setFavorites(prev => [...prev, candidateId]);
        toast({ title: "Ajouté aux favoris" });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({ 
        title: "Erreur", 
        description: "Impossible de modifier les favoris",
        variant: "destructive" 
      });
    }
  };

  const contactCandidate = (candidate: CandidateProfile, method: 'whatsapp' | 'email' | 'phone') => {
    if (method === 'whatsapp' && candidate.whatsapp) {
      const message = encodeURIComponent(`Bonjour ${candidate.first_name}, nous avons vu votre profil sur QuickJob CI et nous sommes intéressés par vos compétences.`);
      window.open(`https://wa.me/${candidate.whatsapp}?text=${message}`, '_blank');
    } else if (method === 'email' && candidate.email) {
      window.open(`mailto:${candidate.email}?subject=Opportunité d'emploi via QuickJob CI`, '_blank');
    } else if (method === 'phone' && candidate.phone) {
      window.open(`tel:${candidate.phone}`, '_blank');
    }
  };

  const getSubscriptionStatus = (subscription: any) => {
    if (!subscription || subscription.status !== 'active') {
      return {
        plan: 'Gratuit',
        description: '50 annonces/mois, accès limité aux CV',
        color: 'secondary' as const,
        jobsLimit: 50,
        features: ['50 annonces par mois', 'Accès limité aux CV', 'Support basique']
      };
    }

    if (subscription.plan === 'standard') {
      return {
        plan: 'Standard',
        description: '10 annonces actives, accès complet aux CV',
        color: 'default' as const,
        jobsLimit: 10,
        features: ['10 annonces actives', 'Accès complet aux CV', 'Gestion candidatures', 'Badge vérifié']
      };
    }

    return {
      plan: 'Pro',
      description: 'Annonces illimitées, accès premium',
      color: 'default' as const,
      jobsLimit: 999,
      features: ['Annonces illimitées', 'Accès illimité profils', 'Mise en avant', 'Support WhatsApp + email', 'Badge Recruteur Pro']
    };
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesLocation = !searchFilters.location || 
      candidate.location?.toLowerCase().includes(searchFilters.location.toLowerCase());
    
    const matchesSkills = !searchFilters.skills || 
      candidate.skills?.some(skill => 
        skill.toLowerCase().includes(searchFilters.skills.toLowerCase())
      );
    
    const matchesAvailability = !searchFilters.availability || 
      candidate.availability?.toLowerCase().includes(searchFilters.availability.toLowerCase());

    return matchesLocation && matchesSkills && matchesAvailability;
  });

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const subscriptionInfo = getSubscriptionStatus(subscription);

  if (userProfile?.role === 'recruiter') {
    return (
      <div className="space-y-6">
        {/* Vue d'ensemble */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Annonces publiées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobs.length}</div>
              <p className="text-xs text-muted-foreground">
                {jobs.filter(j => j.status === 'open').length} actives
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Candidatures reçues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {jobs.reduce((acc, job) => acc + (job.applications_count || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4" />
                Abonnement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{subscriptionInfo.plan}</div>
              <p className="text-xs text-muted-foreground">
                {subscription?.next_payment_date ? 
                  `Jusqu'au ${new Date(subscription.next_payment_date).toLocaleDateString('fr-FR')}` :
                  'Gratuit'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {unreadNotifications.length > 0 ? (
                  <BellDot className="h-4 w-4 text-primary" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadNotifications.length}</div>
              <p className="text-xs text-muted-foreground">Non lues</p>
            </CardContent>
          </Card>
        </div>

        {/* Notifications récentes */}
        {unreadNotifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellDot className="h-5 w-5 text-primary" />
                Notifications récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {unreadNotifications.slice(0, 3).map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div className="flex-1">
                      <h4 className="font-medium">{notification.title}</h4>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="jobs" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="jobs">Mes offres</TabsTrigger>
            <TabsTrigger value="applications">Candidatures</TabsTrigger>
            <TabsTrigger value="candidates">Base candidats</TabsTrigger>
            <TabsTrigger value="subscription">Abonnement</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Gestion des offres</h2>
              <Button 
                onClick={() => window.location.href = '/publish'}
                className="bg-gradient-primary hover:opacity-90"
                disabled={subscription?.status !== 'active' && jobs.length >= subscriptionInfo.jobsLimit}
              >
                Publier une annonce
              </Button>
            </div>
            
            {jobs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune offre publiée</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {jobs.map((job) => (
                  <Card key={job.id} className="shadow-card">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{job.title}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {job.views_count} vues
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {job.applications_count} candidatures
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            {job.amount?.toLocaleString()} {job.currency}
                          </p>
                          <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                            {job.status === 'open' ? 'Active' : 'Fermée'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {job.description}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3 mr-1" />
                          Modifier
                        </Button>
                        <Button size="sm" variant="outline">
                          <Copy className="h-3 w-3 mr-1" />
                          Dupliquer
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-3 w-3 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="candidates" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Base de candidats</h2>
              {subscription?.status !== 'active' && (
                <Badge variant="secondary">Fonctionnalité Premium</Badge>
              )}
            </div>

            {subscription?.status === 'active' ? (
              <>
                {/* Filtres de recherche */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Filtres de recherche
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="location">Ville</Label>
                        <Input
                          id="location"
                          placeholder="Ex: Abidjan"
                          value={searchFilters.location}
                          onChange={(e) => setSearchFilters(prev => ({ ...prev, location: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="skills">Compétences</Label>
                        <Input
                          id="skills"
                          placeholder="Ex: Marketing"
                          value={searchFilters.skills}
                          onChange={(e) => setSearchFilters(prev => ({ ...prev, skills: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="availability">Disponibilité</Label>
                        <Input
                          id="availability"
                          placeholder="Ex: Immédiate"
                          value={searchFilters.availability}
                          onChange={(e) => setSearchFilters(prev => ({ ...prev, availability: e.target.value }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Liste des candidats */}
                <div className="grid gap-4">
                  {filteredCandidates.map((candidate) => (
                    <Card key={candidate.id} className="shadow-card">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                              <UserCheck className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                {candidate.first_name} {candidate.last_name}
                                {candidate.is_verified && (
                                  <Badge variant="default" className="text-xs">
                                    Vérifié
                                  </Badge>
                                )}
                              </CardTitle>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {candidate.location}
                                </span>
                                {candidate.availability && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {candidate.availability}
                                  </span>
                                )}
                              </div>
                              {candidate.skills && candidate.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {candidate.skills.slice(0, 3).map((skill, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {candidate.skills.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{candidate.skills.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={favorites.includes(candidate.id) ? "default" : "outline"}
                              onClick={() => toggleFavorite(candidate.id)}
                            >
                              <Heart className={`h-3 w-3 mr-1 ${favorites.includes(candidate.id) ? 'fill-current' : ''}`} />
                              {favorites.includes(candidate.id) ? 'Retiré' : 'Favoris'}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {candidate.experience && (
                          <p className="text-sm text-muted-foreground mb-3">
                            <strong>Expérience:</strong> {candidate.experience}
                          </p>
                        )}
                        <div className="flex gap-2">
                          {candidate.whatsapp && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => contactCandidate(candidate, 'whatsapp')}
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              WhatsApp
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => contactCandidate(candidate, 'email')}
                          >
                            <Mail className="h-3 w-3 mr-1" />
                            Email
                          </Button>
                          {candidate.phone && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => contactCandidate(candidate, 'phone')}
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              Appeler
                            </Button>
                          )}
                          {candidate.cv_url && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(candidate.cv_url, '_blank')}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              CV
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Accédez à la base de candidats avec un abonnement Premium
                  </p>
                  <Button className="bg-gradient-primary hover:opacity-90">
                    Souscrire maintenant
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="subscription" className="space-y-4">
            <h2 className="text-xl font-semibold">Abonnement & Paiement</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Plan actuel: {subscriptionInfo.plan}</CardTitle>
                <CardDescription>{subscriptionInfo.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Fonctionnalités incluses:</h4>
                    <ul className="space-y-1">
                      {subscriptionInfo.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {subscription?.status !== 'active' && (
                    <div className="pt-4">
                      <h4 className="font-medium mb-3">Choisir un plan:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-2 border-primary/20">
                          <CardHeader>
                            <CardTitle className="text-lg">Standard</CardTitle>
                            <CardDescription>
                              <span className="text-2xl font-bold">1 500 FCFA</span>/mois
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Button className="w-full bg-gradient-primary hover:opacity-90">
                              Souscrire - 7 jours gratuits
                            </Button>
                          </CardContent>
                        </Card>

                        <Card className="border-2 border-primary">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              Pro
                              <Badge>Populaire</Badge>
                            </CardTitle>
                            <CardDescription>
                              <span className="text-2xl font-bold">3 000 FCFA</span>/mois
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Button className="w-full bg-gradient-primary hover:opacity-90">
                              Souscrire - 7 jours gratuits
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Dashboard candidat
  return (
    <div className="space-y-6">
      {/* Vue d'ensemble candidat */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Offres disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245</div>
            <p className="text-xs text-muted-foreground">Dans votre ville</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Mes candidatures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Envoyées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Réponses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications?.filter(a => a.status !== 'pending').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Reçues</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="applications" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="applications">Candidatures</TabsTrigger>
          <TabsTrigger value="profile">Mon Profil</TabsTrigger>
          <TabsTrigger value="jobs">Offres disponibles</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-4">
          <h2 className="text-xl font-semibold">Mes candidatures</h2>
          
          {!applications?.length ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Aucune candidature pour le moment</p>
                <Button 
                  onClick={() => window.location.href = '/trouver-un-job'}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  Rechercher des jobs
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {applications.map((application: any) => (
                <Card key={application.id} className="shadow-card">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{application.job.title}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {application.job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(application.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          {application.job.amount?.toLocaleString()} {application.job.currency}
                        </p>
                        <Badge variant={
                          application.status === 'accepted' ? 'default' :
                          application.status === 'rejected' ? 'destructive' : 'secondary'
                        }>
                          {application.status === 'accepted' ? 'Acceptée' :
                           application.status === 'rejected' ? 'Refusée' : 'En attente'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {application.job.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <h2 className="text-xl font-semibold">Mon Profil</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input id="firstName" value={userProfile?.first_name || ''} readOnly />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom</Label>
                  <Input id="lastName" value={userProfile?.last_name || ''} readOnly />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={userProfile?.email || ''} readOnly />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input id="phone" value={userProfile?.phone || ''} placeholder="Non renseigné" />
                </div>
                <div>
                  <Label htmlFor="location">Ville</Label>
                  <Input id="location" value={userProfile?.location || ''} placeholder="Non renseigné" />
                </div>
                <div>
                  <Label htmlFor="availability">Disponibilité</Label>
                  <Input id="availability" value={userProfile?.availability || ''} placeholder="Ex: Immédiate" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="skills">Compétences (séparées par des virgules)</Label>
                <Input 
                  id="skills" 
                  value={userProfile?.skills?.join(', ') || ''} 
                  placeholder="Ex: Marketing, Vente, Communication" 
                />
              </div>
              
              <div>
                <Label htmlFor="experience">Expérience</Label>
                <Textarea 
                  id="experience" 
                  value={userProfile?.experience || ''} 
                  placeholder="Décrivez votre expérience professionnelle..."
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="cv">CV (optionnel)</Label>
                <div className="flex gap-2">
                  <Input type="file" accept=".pdf,.doc,.docx,image/*" />
                  <Button variant="outline">Télécharger</Button>
                </div>
              </div>
              
              <Button className="bg-gradient-primary hover:opacity-90">
                Mettre à jour le profil
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Offres disponibles</h2>
            <Button 
              onClick={() => window.location.href = '/trouver-un-job'}
              variant="outline"
            >
              <Search className="h-4 w-4 mr-2" />
              Recherche avancée
            </Button>
          </div>
          
          <Card>
            <CardContent className="py-8 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Utilisez la recherche avancée pour trouver des offres adaptées à votre profil
              </p>
              <Button 
                onClick={() => window.location.href = '/trouver-un-job'}
                className="bg-gradient-primary hover:opacity-90"
              >
                Rechercher des jobs
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedDashboard;