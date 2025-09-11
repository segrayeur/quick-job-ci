import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AuthEnforcer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const enforce = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const path = location.pathname;

      if (session?.user) {
        // Utilisateur connecté: forcer l'accès au dashboard uniquement
        if (path !== "/dashboard") {
          navigate("/dashboard", { replace: true });
        }
      } else {
        // Utilisateur déconnecté: empêcher l'accès au dashboard
        if (path.startsWith("/dashboard")) {
          navigate("/", { replace: true });
        }
      }
    };

    enforce();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate("/dashboard", { replace: true });
      } else if (event === "SIGNED_OUT") {
        navigate("/", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [location.pathname, navigate]);

  return null;
};

export default AuthEnforcer;
