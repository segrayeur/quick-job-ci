import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, User, LogIn, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import MobileMenu from "./MobileMenu";

const Header = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

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

  const handlePublishClick = () => {
    if (user) {
      navigate("/publish");
    } else {
      navigate("/connexion");
    }
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  const handleAuthClick = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/connexion");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div 
            className="flex items-center space-x-2 cursor-pointer" 
            onClick={handleLogoClick}
          >
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-foreground font-bold text-sm">QJ</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">QuickJob CI</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="hidden md:flex"
              onClick={() => navigate("/")}
            >
              Accueil
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="hidden md:flex"
              onClick={() => navigate("/faq")}
            >
              FAQ
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="hidden md:flex"
              onClick={() => navigate("/trouver-un-candidat")}
            >
              Trouver un candidat
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="hidden md:flex"
              onClick={() => navigate("/trouver-un-job")}
            >
              <MapPin className="h-4 w-4 mr-1" />
              Trouver un job
            </Button>
            <Button variant="default" size="sm" onClick={handlePublishClick} className="hidden sm:flex">
              <Plus className="h-4 w-4 mr-1" />
              Publier
            </Button>
            {!user && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/inscription")}
                className="hidden md:flex"
              >
                S'inscrire
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleAuthClick} className="hidden sm:flex">
              {user ? (
                <>
                  <User className="h-4 w-4 mr-1" />
                  <span className="hidden md:inline">Dashboard</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-1" />
                  <span className="hidden md:inline">Connexion</span>
                </>
              )}
            </Button>
            <MobileMenu user={user} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;