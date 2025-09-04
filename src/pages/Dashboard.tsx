import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { 
  ArrowLeft, 
  Plus, 
  Briefcase, 
  Users, 
  CreditCard, 
  Settings,
  Star,
  MapPin,
  Clock,
  Eye,
  CheckCircle,
  XCircle
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import JobCard from "@/components/JobCard";

interface UserProfile {
  id: string;
  role: 'admin' | 'recruiter' | 'candidate';
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  location?: string;
}

interface Job {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  location: string;
  category: string;
  status: 'open' | 'closed' | 'in_progress';
  created_at: string;
  contact_phone?: string;
  contact_whatsapp?: string;
}

interface Application {
  id: string;
  status: string;
  message?: string;
  created_at: string;
  job: {
    id: string;
    title: string;
    description: string;
    amount: number;
    currency: string;
    location: string;
    category: string;
    status: string;
    created_at: string;
    contact_phone?: string;
    contact_whatsapp?: string;
  };
}

interface Subscription {
  id: string;
  plan: string;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  next_payment_date?: string;
  amount?: number;
  currency: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserData(session.user.id);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      setUserProfile(profile);

      if (profile?.role === 'recruiter') {
        // Fetch jobs for recruiters
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('*')
          .eq('recruiter_id', profile.id)
          .order('created_at', { ascending: false });
        
        setJobs(jobsData || []);

        // Fetch subscription
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', profile.id)
          .single();
        
        setSubscription(subData as any);
      } else if (profile?.role === 'candidate') {
        // Fetch applications for candidates
        const { data: appsData } = await supabase
          .from('applications')
          .select(`
            *,
            job:jobs(*)
          `)
          .eq('student_id', profile.id)
          .order('created_at', { ascending: false });
        
        setApplications(appsData as any || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt sur QuickJob CI !",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive"
      });
    }
  };

  const handleSubscribe = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-paystack-subscription', {
        body: { 
          email: userProfile?.email,
          plan: 'premium'
        }
      });

      if (error) throw error;

      if (data.success) {
        window.open(data.payment_url, '_blank');
        toast({
          title: "Redirection vers Paystack",
          description: "Vous allez être redirigé vers la page de paiement",
        });
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'abonnement",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "En attente", variant: "secondary" as const },
      accepted: { label: "Acceptée", variant: "default" as const },
      rejected: { label: "Refusée", variant: "destructive" as const },
      open: { label: "Ouvert", variant: "default" as const },
      closed: { label: "Fermé", variant: "secondary" as const },
      in_progress: { label: "En cours", variant: "secondary" as const },
      active: { label: "Actif", variant: "default" as const },
      inactive: { label: "Inactif", variant: "secondary" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge variant={config?.variant || "secondary"}>
        {config?.label || status}
      </Badge>
    );
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Accueil
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
                <p className="text-muted-foreground">
                  Bienvenue {userProfile?.first_name} {userProfile?.last_name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <Settings className="h-4 w-4 mr-1" />
                Déconnexion
              </Button>
            </div>
          </div>

          {userProfile?.role === 'recruiter' && (
            <div className="mb-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Abonnement</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subscription?.status === 'active' ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Plan Premium</p>
                        <p className="text-sm text-muted-foreground">
                          Prochain paiement: {subscription.next_payment_date ? 
                            new Date(subscription.next_payment_date).toLocaleDateString('fr-FR') : 
                            'Non défini'
                          }
                        </p>
                      </div>
                      {getStatusBadge(subscription.status)}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Aucun abonnement actif</p>
                        <p className="text-sm text-muted-foreground">
                          Souscrivez au plan premium pour publier des jobs
                        </p>
                      </div>
                      <Button onClick={handleSubscribe} className="bg-gradient-primary hover:opacity-90">
                        Souscrire - 15,000 CFA/mois
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue={userProfile?.role === 'recruiter' ? 'jobs' : 'applications'} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              {userProfile?.role === 'recruiter' ? (
                <>
                  <TabsTrigger value="jobs">Mes Jobs</TabsTrigger>
                  <TabsTrigger value="stats">Statistiques</TabsTrigger>
                </>
              ) : (
                <>
                  <TabsTrigger value="applications">Mes Candidatures</TabsTrigger>
                  <TabsTrigger value="profile">Mon Profil</TabsTrigger>
                </>
              )}
            </TabsList>

            {userProfile?.role === 'recruiter' && (
              <>
                <TabsContent value="jobs" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Mes offres d'emploi</h2>
                    <Button 
                      onClick={() => navigate('/publish')}
                      className="bg-gradient-primary hover:opacity-90"
                      disabled={subscription?.status !== 'active'}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Publier un job
                    </Button>
                  </div>
                  
                  {jobs.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Aucun job publié pour le moment</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {jobs.map((job) => (
                        <Card key={job.id} className="shadow-card">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">{job.title}</CardTitle>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                                  <span className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {job.location}
                                  </span>
                                  <span className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {new Date(job.created_at).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">
                                  {job.amount.toLocaleString()} {job.currency}
                                </p>
                                {getStatusBadge(job.status)}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {job.description}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="stats">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Jobs publiés</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{jobs.length}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Jobs ouverts</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {jobs.filter(j => j.status === 'open').length}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Jobs fermés</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {jobs.filter(j => j.status === 'closed').length}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </>
            )}

            {userProfile?.role === 'candidate' && (
              <>
                <TabsContent value="applications" className="space-y-4">
                  <h2 className="text-xl font-semibold">Mes candidatures</h2>
                  
                  {applications.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Aucune candidature pour le moment</p>
                        <Button 
                          onClick={() => navigate('/')}
                          className="mt-4 bg-gradient-primary hover:opacity-90"
                        >
                          Rechercher des jobs
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {applications.map((application) => (
                        <Card key={application.id} className="shadow-card">
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
                                    Candidature envoyée le {new Date(application.created_at).toLocaleDateString('fr-FR')}
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
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {application.job.description}
                            </p>
                            {application.message && (
                              <div className="mt-2 p-2 bg-muted rounded">
                                <p className="text-sm"><strong>Votre message:</strong> {application.message}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="profile">
                  <Card>
                    <CardHeader>
                      <CardTitle>Mon Profil</CardTitle>
                      <CardDescription>
                        Informations de votre compte QuickJob CI
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Prénom</Label>
                          <p className="text-sm text-muted-foreground">{userProfile?.first_name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Nom</Label>
                          <p className="text-sm text-muted-foreground">{userProfile?.last_name}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Email</Label>
                        <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Téléphone</Label>
                          <p className="text-sm text-muted-foreground">{userProfile?.phone || 'Non renseigné'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">WhatsApp</Label>
                          <p className="text-sm text-muted-foreground">{userProfile?.whatsapp || 'Non renseigné'}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Localisation</Label>
                        <p className="text-sm text-muted-foreground">{userProfile?.location || 'Non renseignée'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Rôle</Label>
                        <p className="text-sm text-muted-foreground capitalize">{userProfile?.role}</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  );
};

export default Dashboard;