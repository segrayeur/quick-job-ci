import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { DashboardSidebar } from "@/components/DashboardSidebar";
import CandidateApplications from "@/components/CandidateApplications";
import AvailableJobs from "@/components/AvailableJobs";
import RecruiterApplications from "@/components/RecruiterApplications";
import CandidateDatabase from "@/components/CandidateDatabase";
import RecruiterStats from "@/components/RecruiterStats";
import NotificationCenter from "@/components/NotificationCenter";
import { LocationSelector } from "@/components/LocationSelector";

interface UserProfile {
  id: string;
  role: 'admin' | 'recruiter' | 'candidate';
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  location?: string;
  commune?: string;
  quartier?: string;
  skills?: string[];
  availability?: string;
  experience?: string;
  cv_url?: string;
  is_verified?: boolean;
  profile_complete?: boolean;
  applications_created_count: number;
  is_vip_candidate: boolean;
  vip_expiry_date?: string;
}

interface Job {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  location: string;
  category: string;
  status: 'open' | 'closed' | 'in_progress' | 'accomplished';
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
  const [profileForm, setProfileForm] = useState({
    phone: '',
    whatsapp: '',
    location: '',
    commune: '',
    quartier: ''
  });
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'default';
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
      
      if (profile) {
        // Ensure applications_created_count and is_vip_candidate have default values
        profile.applications_created_count = profile.applications_created_count || 0;
        profile.is_vip_candidate = profile.is_vip_candidate || false;
        
        // Initialize profile form with current values
        setProfileForm({
          phone: profile.phone || '',
          whatsapp: profile.whatsapp || '',
          location: profile.location || '',
          commune: profile.commune || '',
          quartier: profile.quartier || ''
        });
      }
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

  const updateProfile = async () => {
    if (!userProfile) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          phone: profileForm.phone,
          whatsapp: profileForm.whatsapp,
          location: profileForm.location,
          commune: profileForm.commune,
          quartier: profileForm.quartier
        })
        .eq('id', userProfile.id);

      if (error) throw error;

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès."
      });
      
      // Refresh user data
      await fetchUserData(user.id);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
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

  const renderContent = () => {
    if (!userProfile) return null;

    // Contenu pour les candidats
    if (userProfile.role === 'candidate') {
      switch (activeTab) {
        case 'applications':
          return <CandidateApplications userProfile={userProfile} />;
        case 'accepted':
        case 'available':
          return <AvailableJobs userProfile={userProfile} />;
        case 'profile':
          return (
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
                    <Label htmlFor="first_name">Prénom</Label>
                    <Input id="first_name" value={userProfile.first_name} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Nom</Label>
                    <Input id="last_name" value={userProfile.last_name} readOnly />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={userProfile.email} readOnly />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input 
                      id="phone" 
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                      placeholder="Ex: +225 01 02 03 04 05" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input 
                      id="whatsapp" 
                      value={profileForm.whatsapp}
                      onChange={(e) => setProfileForm({...profileForm, whatsapp: e.target.value})}
                      placeholder="Ex: +225 01 02 03 04 05" 
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="location">Ville</Label>
                    <Input 
                      id="location" 
                      value={profileForm.location}
                      onChange={(e) => setProfileForm({...profileForm, location: e.target.value})}
                      placeholder="Ex: Abidjan" 
                    />
                  </div>
                  <LocationSelector
                    selectedCommune={profileForm.commune}
                    selectedQuartier={profileForm.quartier}
                    onCommuneChange={(commune) => setProfileForm({...profileForm, commune})}
                    onQuartierChange={(quartier) => setProfileForm({...profileForm, quartier})}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Statut d'abonnement</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={userProfile.is_vip_candidate ? "default" : "secondary"}>
                      {userProfile.is_vip_candidate ? "VIP-Cant" : "Gratuit"}
                    </Badge>
                    {userProfile.is_vip_candidate && userProfile.vip_expiry_date && (
                      <span className="text-sm text-muted-foreground">
                        Expire le {new Date(userProfile.vip_expiry_date).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
                <Button onClick={updateProfile} className="w-full mt-4">
                  Sauvegarder les modifications
                </Button>
              </CardContent>
            </Card>
          );
        case 'subscription':
          return (
            <Card>
              <CardHeader>
                <CardTitle>Abonnement VIP-Cant</CardTitle>
                <CardDescription>
                  Passez au plan VIP-Cant pour débloquer 15 candidatures supplémentaires
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Plan Gratuit</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 10 candidatures maximum</li>
                      <li>• Accès aux offres de base</li>
                      <li>• Support communautaire</li>
                    </ul>
                  </div>
                  <div className="p-4 border-2 border-primary rounded-lg">
                    <h4 className="font-medium mb-2 text-primary">Plan VIP-Cant - 5,000 CFA/mois</h4>
                    <ul className="text-sm space-y-1">
                      <li>• 25 candidatures maximum (10 + 15 bonus)</li>
                      <li>• Priorité dans les recherches</li>
                      <li>• Accès aux offres premium</li>
                      <li>• Support prioritaire</li>
                    </ul>
                    <Button className="w-full mt-4" disabled={userProfile.is_vip_candidate}>
                      {userProfile.is_vip_candidate ? "Déjà abonné" : "Souscrire maintenant"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        default:
          return <CandidateApplications userProfile={userProfile} />;
      }
    }

    // Contenu pour les recruteurs
    if (userProfile.role === 'recruiter') {
      switch (activeTab) {
        case 'jobs':
          return (
            <div className="space-y-4">
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
            </div>
          );
        case 'applications':
          return <RecruiterApplications userProfile={userProfile} />;
        case 'candidates':
        case 'all-candidates':
        case 'search-cv':
          return <CandidateDatabase userProfile={userProfile} />;
        case 'stats':
          return <RecruiterStats userProfile={userProfile} />;
        case 'notifications':
          return <NotificationCenter userProfile={userProfile} />;
        case 'profile':
          return (
            <Card>
              <CardHeader>
                <CardTitle>Mon Profil Recruteur</CardTitle>
                <CardDescription>
                  Informations de votre compte recruteur QuickJob CI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Prénom</Label>
                    <Input id="first_name" value={userProfile.first_name} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Nom</Label>
                    <Input id="last_name" value={userProfile.last_name} readOnly />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={userProfile.email} readOnly />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input 
                      id="phone" 
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                      placeholder="Ex: +225 01 02 03 04 05" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input 
                      id="whatsapp" 
                      value={profileForm.whatsapp}
                      onChange={(e) => setProfileForm({...profileForm, whatsapp: e.target.value})}
                      placeholder="Ex: +225 01 02 03 04 05" 
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="location">Ville</Label>
                    <Input 
                      id="location" 
                      value={profileForm.location}
                      onChange={(e) => setProfileForm({...profileForm, location: e.target.value})}
                      placeholder="Ex: Abidjan" 
                    />
                  </div>
                  <LocationSelector
                    selectedCommune={profileForm.commune}
                    selectedQuartier={profileForm.quartier}
                    onCommuneChange={(commune) => setProfileForm({...profileForm, commune})}
                    onQuartierChange={(quartier) => setProfileForm({...profileForm, quartier})}
                  />
                </div>
                <Button onClick={updateProfile} className="w-full mt-4">
                  Sauvegarder les modifications
                </Button>
              </CardContent>
            </Card>
          );
        case 'subscription':
          return (
            <Card>
              <CardHeader>
                <CardTitle>Abonnement Recruteur</CardTitle>
                <CardDescription>
                  Gérez votre abonnement pour publier des offres d'emploi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Plan Gratuit</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 3 offres d'emploi maximum</li>
                      <li>• Candidatures limitées</li>
                      <li>• Support communautaire</li>
                    </ul>
                  </div>
                  <div className="p-4 border-2 border-primary rounded-lg">
                    <h4 className="font-medium mb-2 text-primary">Plan Premium - 25,000 CFA/mois</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Offres d'emploi illimitées</li>
                      <li>• Accès à la base de candidats</li>
                      <li>• Statistiques avancées</li>
                      <li>• Support prioritaire</li>
                      <li>• Gestion des favoris candidats</li>
                    </ul>
                    <Button className="w-full mt-4" onClick={handleSubscribe} disabled={subscription?.status === 'active'}>
                      {subscription?.status === 'active' ? "Abonné" : "Souscrire maintenant"}
                    </Button>
                  </div>
                  {subscription && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Statut actuel: {getStatusBadge(subscription.status)}</p>
                      {subscription.next_payment_date && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Prochain paiement: {new Date(subscription.next_payment_date).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        case 'stats':
          return (
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
          );
        case 'profile':
          return (
            <Card>
              <CardHeader>
                <CardTitle>Mon Profil Recruteur</CardTitle>
                <CardDescription>
                  Informations de votre compte recruteur QuickJob CI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Prénom</Label>
                    <Input id="first_name" value={userProfile.first_name} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Nom</Label>
                    <Input id="last_name" value={userProfile.last_name} readOnly />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={userProfile.email} readOnly />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input id="phone" value={userProfile.phone || ''} placeholder="Non renseigné" />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input id="whatsapp" value={userProfile.whatsapp || ''} placeholder="Non renseigné" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="location">Ville</Label>
                    <Input id="location" value={userProfile.location || ''} placeholder="Ex: Abidjan" />
                  </div>
                  <div>
                    <Label htmlFor="commune">Commune</Label>
                    <Select value={userProfile.commune || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une commune" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cocody">Cocody</SelectItem>
                        <SelectItem value="yopougon">Yopougon</SelectItem>
                        <SelectItem value="adjame">Adjamé</SelectItem>
                        <SelectItem value="plateau">Plateau</SelectItem>
                        <SelectItem value="marcory">Marcory</SelectItem>
                        <SelectItem value="koumassi">Koumassi</SelectItem>
                        <SelectItem value="treichville">Treichville</SelectItem>
                        <SelectItem value="port-bouet">Port-Bouët</SelectItem>
                        <SelectItem value="abobo">Abobo</SelectItem>
                        <SelectItem value="attécoubé">Attécoubé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="quartier">Quartier</Label>
                    <Input id="quartier" value={userProfile.quartier || ''} placeholder="Ex: Riviera" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Statut d'abonnement</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={subscription?.status === 'active' ? "default" : "secondary"}>
                      {subscription?.status === 'active' ? "Premium" : "Gratuit"}
                    </Badge>
                    {subscription?.next_payment_date && (
                      <span className="text-sm text-muted-foreground">
                        Prochaine facturation: {new Date(subscription.next_payment_date).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        case 'subscription':
          return (
            <Card>
              <CardHeader>
                <CardTitle>Abonnement Premium Recruteur</CardTitle>
                <CardDescription>
                  Gérez votre abonnement pour publier vos offres d'emploi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Plan Gratuit (Période d'essai)</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 7 jours d'essai gratuit</li>
                      <li>• Publication limitée</li>
                      <li>• Support communautaire</li>
                    </ul>
                  </div>
                  <div className="p-4 border-2 border-primary rounded-lg">
                    <h4 className="font-medium mb-2 text-primary">Plan Premium - 15,000 CFA/mois</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Publication illimitée d'offres</li>
                      <li>• Accès à la base de candidats</li>
                      <li>• Statistiques avancées</li>
                      <li>• Support prioritaire</li>
                    </ul>
                    <Button 
                      className="w-full mt-4" 
                      onClick={handleSubscribe}
                      disabled={subscription?.status === 'active'}
                    >
                      {subscription?.status === 'active' ? "Déjà abonné" : "S'abonner maintenant"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        default:
          return (
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
          );
      }
    }

    return <div>Chargement...</div>;
  };

  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <DashboardSidebar userRole={userProfile?.role || 'candidate'} />
          
          <SidebarInset className="flex-1">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => window.location.href = '/dashboard'}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Dashboard
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {userProfile?.role === 'candidate' ? 'Espace Candidat' : 'Espace Recruteur'}
                  </h1>
                  <p className="text-muted-foreground">
                    Bienvenue {userProfile?.first_name} {userProfile?.last_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {userProfile?.role === 'recruiter' && subscription?.status === 'active' && (
                  <Badge variant="default">Plan Premium</Badge>
                )}
                {userProfile?.role === 'candidate' && userProfile?.is_vip_candidate && (
                  <Badge variant="default">VIP-Cant</Badge>
                )}
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <Settings className="h-4 w-4 mr-1" />
                  Déconnexion
                </Button>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Chargement de votre espace...</p>
                  </div>
                </div>
              ) : (
                renderContent()
              )}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
};

export default Dashboard;