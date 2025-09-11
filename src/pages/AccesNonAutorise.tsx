import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Home, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AccesNonAutorise = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
      });
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-card flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold text-destructive">
              Accès Non Autorisé
            </CardTitle>
            <CardDescription className="text-center">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page ou votre rôle n'est pas défini.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              <p>Cela peut arriver si :</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Votre profil n'a pas de rôle défini</li>
                <li>Vous tentez d'accéder à une section non autorisée</li>
                <li>Votre session a expiré</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => navigate("/")} 
                className="w-full bg-gradient-primary"
                variant="default"
              >
                <Home className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Button>
              
              <Button 
                onClick={handleSignOut} 
                className="w-full"
                variant="outline"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Se déconnecter
              </Button>
            </div>
            
            <div className="pt-4 border-t text-center">
              <p className="text-sm text-muted-foreground">
                Besoin d'aide ? {" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-primary font-semibold"
                  onClick={() => navigate("/contact")}
                >
                  Contactez le support
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccesNonAutorise;