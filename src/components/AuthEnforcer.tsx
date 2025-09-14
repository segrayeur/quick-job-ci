import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthEnforcer = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectBasedOnRole = async (userId: string) => {
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('user_id', userId)
          .single();

        if (error) {
          console.error('Error fetching user role for redirect:', error);
          navigate('/dashboard'); 
          return;
        }

        switch (userData?.role) {
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
            navigate('/dashboard'); 
            break;
        }
      } catch (error) {
        console.error('Redirect error:', error);
        navigate('/dashboard'); 
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        redirectBasedOnRole(session.user.id);
      }

      if (event === 'SIGNED_OUT') {
        navigate('/auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return null;
};

export default AuthEnforcer;
