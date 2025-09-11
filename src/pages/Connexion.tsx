import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogIn } from "lucide-react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";

const Connexion = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [signInData, setSignInData] = useState({
    emailOrPhone: "",
    password: "",
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setSignInData(prev => ({ ...prev, [field]: value }));
  };

  // Fonction utilitaire pour détecter si l'input est un email ou téléphone
  const isEmail = (input: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
  };

  // Fonction pour récupérer l'email depuis le téléphone
  const getEmailFromPhone = async (phone: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('phone', phone)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data.email;
  };

  const redirectBasedOnRole = async (userId: string) => {
    try {
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Votre rôle n'est pas défini. Contactez l'administrateur.",
        });
        return;
      }

      if (!userProfile || !userProfile.role) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Votre rôle n'est pas défini. Contactez l'administrateur.",
        });
        return;
      }

      // Redirection basée sur le rôle
      switch (userProfile.role) {
        case 'recruiter':
          navigate("/dashboard/recruteur");
          break;
        case 'candidate':
          navigate("/dashboard/candidat");
          break;
        case 'admin':
          navigate("/dashboard/admin");
          break;
        default:
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Votre rôle n'est pas défini. Contactez l'administrateur.",
          });
      }
    } catch (error) {
      console.error('Error during role-based redirect:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la connexion.",
      });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signInData.emailOrPhone || !signInData.password) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
      });
      return;
    }

    setLoading(true);
    try {
      let emailToUse = signInData.emailOrPhone;

      // Si ce n'est pas un email, c'est probablement un téléphone
      if (!isEmail(signInData.emailOrPhone)) {
        const email = await getEmailFromPhone(signInData.emailOrPhone);
        if (!email) {
          toast({
            variant: "destructive",
            title: "Erreur de connexion",
            description: "Adresse email ou mot de passe incorrect.",
          });
          return;
        }
        emailToUse = email;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: signInData.password,
      });

      if (error) {
        // Message d'erreur unifié comme demandé
        toast({
          variant: "destructive",
          title: "Erreur de connexion",
          description: "Adresse email ou mot de passe incorrect.",
        });
        return;
      }

      if (data.user) {
        toast({
          title: "Connexion réussie !",
          description: "Connexion en cours...",
        });
        
        // Redirection basée sur le rôle
        await redirectBasedOnRole(data.user.id);
      }
    } catch (error: any) {
      console.error('Signin error:', error);
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: "Une erreur est survenue lors de la connexion.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-card flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Button>
        </div>

        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">QJ</span>
            </div>
            <CardTitle className="text-2xl font-bold">Se connecter</CardTitle>
            <CardDescription>
              Accédez à votre compte QuickJob CI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailOrPhone">Email ou Téléphone</Label>
                <Input
                  id="emailOrPhone"
                  type="text"
                  placeholder="exemple@email.com ou +225 01 02 03 04 05"
                  value={signInData.emailOrPhone}
                  onChange={(e) => handleInputChange("emailOrPhone", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={signInData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity" 
                disabled={loading}
              >
                <LogIn className="h-4 w-4 mr-2" />
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-4">
              <Button
                variant="link"
                className="text-sm text-muted-foreground"
                onClick={() => {
                  toast({
                    title: "Fonctionnalité bientôt disponible",
                    description: "La réinitialisation de mot de passe sera disponible prochainement",
                  });
                }}
              >
                Mot de passe oublié ?
              </Button>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Vous n'avez pas encore de compte ?{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary font-semibold"
                    onClick={() => navigate("/inscription")}
                  >
                    Créer un compte
                  </Button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Connexion;