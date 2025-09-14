import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Briefcase, LogIn, UserPlus } from "lucide-react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";

const Auth = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");

  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath.includes('inscription')) {
      setActiveTab('signup');
    } else {
      setActiveTab('signin');
    }
  }, [location.pathname]);

  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    location: "Abidjan",
    role: "" as "candidate" | "recruiter" | ""
  });

  const [signInData, setSignInData] = useState({
    emailOrPhone: "",
    password: "",
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN' && session) {
          redirectBasedOnRole(session.user.id);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // If there's a session on load, redirect if not on a dashboard page already
        if (!location.pathname.startsWith("/dashboard")) {
          redirectBasedOnRole(session.user.id);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const redirectBasedOnRole = async (userId: string) => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        navigate('/dashboard'); 
        return;
      }

      if (userData?.role === 'candidate') {
        navigate('/dashboard/candidat');
      } else if (userData?.role === 'recruiter') {
        navigate('/dashboard/recruteur');
      } else if (userData?.role === 'admin') {
        navigate('/dashboard/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Redirect error:', error);
      navigate('/dashboard');
    }
  };

  const handleSignUpInputChange = (field: string, value: string) => {
    setSignUpData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignInInputChange = (field: string, value: string) => {
    setSignInData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (signUpData.password !== signUpData.confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    if (!signUpData.role) {
      toast({ title: "Erreur", description: "Veuillez sélectionner votre rôle", variant: "destructive" });
      return;
    }
    if (!signUpData.email || !signUpData.password || !signUpData.firstName) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs requis", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          emailRedirectTo: `${window.location.origin}`
        }
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase.rpc('create_user_profile', {
          user_uuid: data.user.id, user_email: signUpData.email, user_role: signUpData.role,
          first_name: signUpData.firstName, last_name: signUpData.lastName, 
          phone: signUpData.phone, location: signUpData.location
        });

        if (profileError) throw profileError;

        if (data.session) {
          toast({ title: "Inscription réussie !", description: "Vous êtes maintenant connecté." });
          redirectBasedOnRole(data.user.id);
        } else {
          toast({ title: "Inscription presque terminée !", description: "Veuillez consulter vos e-mails pour confirmer votre compte avant de vous connecter." });
          navigate('/connexion');
        }
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      const message = error.message.includes('duplicate key value') 
        ? "Un utilisateur avec cet email existe déjà."
        : (error.message || "Une erreur est survenue lors de l'inscription");
      toast({ title: "Erreur d'inscription", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (input: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
  const isValidPhone = (input: string) => /^(\+225|225)?[\s-]?[0-9\s-]{8,10}$/.test(input.replace(/\s/g, ''));

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!signInData.emailOrPhone || !signInData.password) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      let email = signInData.emailOrPhone;
      if (!isValidEmail(signInData.emailOrPhone) && isValidPhone(signInData.emailOrPhone)) {
        const { data: foundEmail, error: emailError } = await supabase
          .rpc('get_email_by_phone', { phone_input: signInData.emailOrPhone.replace(/\s/g, '') });
        if (emailError) throw emailError;
        if (!foundEmail) {
          toast({ title: "Erreur", description: "Aucun compte trouvé avec ce numéro de téléphone", variant: "destructive" });
          setLoading(false);
          return;
        }
        email = foundEmail;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password: signInData.password });

      if (error) throw error;

      if (data.user) {
        toast({ title: "Connexion réussie !", description: "Vous êtes maintenant connecté." });
        redirectBasedOnRole(data.user.id);
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      const defaultMessage = "Email ou mot de passe incorrect. Veuillez réessayer.";
      const displayMessage = (error?.message && !error.message.includes('schema')) ? error.message : defaultMessage;
      toast({ title: "Erreur de connexion", description: displayMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const locations = ["Abidjan", "Bouaké", "Daloa", "San Pedro", "Yamoussoukro", "Korhogo", "Man", "Gagnoa", "Divo", "Abengourou"];

  const handleTabChange = (value: string) => {
    const path = value === 'signup' ? '/inscription' : '/connexion';
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'accueil
        </Button>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>QuickJob CI</CardTitle>
            <CardDescription>Connectez-vous ou créez votre compte</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin"><LogIn className="mr-2 h-4 w-4" />Connexion</TabsTrigger>
                <TabsTrigger value="signup"><UserPlus className="mr-2 h-4 w-4" />Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-emailOrPhone">Email ou téléphone</Label>
                    <Input id="signin-emailOrPhone" type="text" placeholder="votre@email.com ou +225XXXXXXXX" value={signInData.emailOrPhone} onChange={(e) => handleSignInInputChange("emailOrPhone", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Mot de passe</Label>
                    <Input id="signin-password" type="password" placeholder="Votre mot de passe" value={signInData.password} onChange={(e) => handleSignInInputChange("password", e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}><LogIn className="mr-2 h-4 w-4" />{loading ? "Connexion..." : "Se connecter"}</Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Sélectionnez votre profil</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button type="button" variant={signUpData.role === "candidate" ? "default" : "outline"} onClick={() => handleSignUpInputChange("role", "candidate")} className="h-auto p-4 flex flex-col"><User className="h-6 w-6 mb-2" /><span className="text-sm">Candidat</span><span className="text-xs opacity-70">Chercher un job</span></Button>
                      <Button type="button" variant={signUpData.role === "recruiter" ? "default" : "outline"} onClick={() => handleSignUpInputChange("role", "recruiter")} className="h-auto p-4 flex flex-col"><Briefcase className="h-6 w-6 mb-2" /><span className="text-sm">Recruteur</span><span className="text-xs opacity-70">Publier des jobs</span></Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="firstName">Prénom*</Label><Input id="firstName" type="text" placeholder="Votre prénom" value={signUpData.firstName} onChange={(e) => handleSignUpInputChange("firstName", e.target.value)} required /></div>
                    <div className="space-y-2"><Label htmlFor="lastName">Nom</Label><Input id="lastName" type="text" placeholder="Votre nom" value={signUpData.lastName} onChange={(e) => handleSignUpInputChange("lastName", e.target.value)} /></div>
                  </div>
                  <div className="space-y-2"><Label htmlFor="email">Email*</Label><Input id="email" type="email" placeholder="votre@email.com" value={signUpData.email} onChange={(e) => handleSignUpInputChange("email", e.target.value)} required /></div>
                  <div className="space-y-2"><Label htmlFor="phone">Téléphone</Label><Input id="phone" type="tel" placeholder="+225 XX XX XX XX XX" value={signUpData.phone} onChange={(e) => handleSignUpInputChange("phone", e.target.value)} /></div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Ville</Label>
                    <select id="location" value={signUpData.location} onChange={(e) => handleSignUpInputChange("location", e.target.value)} className="w-full p-2 border border-border rounded-md bg-background">
                      {locations.map((location) => (<option key={location} value={location}>{location}</option>))}
                    </select>
                  </div>
                  <div className="space-y-2"><Label htmlFor="password">Mot de passe*</Label><Input id="password" type="password" placeholder="Votre mot de passe" value={signUpData.password} onChange={(e) => handleSignUpInputChange("password", e.target.value)} required /></div>
                  <div className="space-y-2"><Label htmlFor="confirmPassword">Confirmer*</Label><Input id="confirmPassword" type="password" placeholder="Confirmez votre mot de passe" value={signUpData.confirmPassword} onChange={(e) => handleSignUpInputChange("confirmPassword", e.target.value)} required /></div>
                  <Button type="submit" className="w-full" disabled={loading}><UserPlus className="mr-2 h-4 w-4" />{loading ? "Inscription..." : "Créer mon compte"}</Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
