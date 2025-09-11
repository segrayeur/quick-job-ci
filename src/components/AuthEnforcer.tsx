import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AuthEnforcer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const redirectToRole = async (userId: string) => {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      switch (profile?.role) {
        case 'recruiter':
          navigate('/dashboard/recruteur', { replace: true });
          break;
        case 'candidate':
          navigate('/dashboard/candidat', { replace: true });
          break;
        case 'admin':
          navigate('/dashboard/admin', { replace: true });
          break;
        default:
          // Rester et afficher une alerte si le rôle n'est pas défini
          toast({
            variant: 'destructive',
            title: 'Erreur',
            description: "Votre rôle n'est pas défini. Contactez l'administrateur.",
          });
      }
    };

    const enforce = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const path = location.pathname;

      if (session?.user) {
        if (path === '/' || path === '/connexion' || path === '/login' || path === '/inscription') {
          await redirectToRole(session.user.id);
        }
      } else if (path.startsWith('/dashboard')) {
        toast({ title: 'Session expirée', description: 'Votre session a expiré. Veuillez vous reconnecter.' });
        navigate('/login', { replace: true });
      }
    };

    enforce();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && (location.pathname === '/' || location.pathname === '/connexion' || location.pathname === '/login' || location.pathname === '/inscription')) {
        // Ne pas faire d'appel Supabase directement ici
        setTimeout(() => {
          redirectToRole(session.user!.id);
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        toast({ title: 'Session expirée', description: 'Votre session a expiré. Veuillez vous reconnecter.' });
        navigate('/login', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [location.pathname, navigate, toast]);

  return null;
};

export default AuthEnforcer;
