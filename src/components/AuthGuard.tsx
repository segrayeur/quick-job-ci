import { useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
  requiredRole: 'admin' | 'recruiter' | 'candidate';
}

const AuthGuard = ({ children, requiredRole }: AuthGuardProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        navigate("/connexion");
        return;
      }

      setUser(session.user);

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      if (profileError || !profile) {
        console.error("Error fetching profile or profile doesn't exist:", profileError);
        navigate("/acces-non-autorise");
        return;
      }

      setUserRole(profile.role);
      
      if (profile.role !== requiredRole) {
        console.log(`Role mismatch: required ${requiredRole}, user has ${profile.role}`);
        // Instead of redirecting to a generic dashboard, let's redirect based on their actual role.
        switch (profile.role) {
          case 'candidate':
            navigate('/dashboard/candidat');
            break;
          case 'recruiter':
            navigate('/dashboard/recruteur');
            break;
          case 'admin':
            navigate('/dashboard/admin');
            break;
          default:
            navigate('/acces-non-autorise'); // Fallback if role is unknown
        }
        return;
      }

      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/connexion');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [requiredRole, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-lg text-foreground">Vérification de l'accès...</p>
        </div>
      </div>
    );
  }

  // Render children only if loading is complete and role matches
  return user && userRole === requiredRole ? <>{children}</> : null;
};

export default AuthGuard;
