import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import SimpleProfile from "@/components/SimpleProfile";
import CandidateApplications from "@/components/CandidateApplications";
import NotificationSystem from "@/components/NotificationSystem";
import CrossNotificationSystem from "@/components/CrossNotificationSystem";
import EnhancedChatRAG from "@/components/EnhancedChatRAG";
import { Button } from "@/components/ui/button";

interface UserProfile {
  id: string;
  role: 'candidate';
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
  jobs_published: number;
  subscription_plan: string;
  subscription_end?: string;
}

const DashboardCandidat = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatRAGOpen, setChatRAGOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        console.log("No active session found.");
        navigate("/connexion");
        return;
      }
      setSession(session);
      setUser(session.user);
      await fetchUserData(session.user.id);
      setLoading(false);
    };

    fetchSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/connexion');
      } else if (session) {
        setSession(session);
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchUserData = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'candidate')
        .single();
      
      if (error || !profile) {
        console.error('Error fetching candidate data:', error?.message);
        toast({ title: "Erreur de profil", description: "Profil candidat non trouvé ou erreur de chargement.", variant: "destructive" });
        navigate("/acces-non-autorise");
        return;
      }
      
      setUserProfile({
        ...profile,
        applications_created_count: profile.applications_created_count ?? 0,
        is_vip_candidate: profile.is_vip_candidate ?? false,
        jobs_published: profile.jobs_published ?? 0,
        subscription_plan: profile.subscription_plan ?? 'free',
      } as UserProfile);
    } catch (error: any) {
      console.error('Error in fetchUserData:', error.message);
      navigate("/acces-non-autorise");
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserData(user.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-6"></div>
          <p className="text-lg font-semibold">Chargement de votre espace personnalisé...</p>
          <p className="text-muted-foreground mt-2">Veuillez patienter un instant.</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center p-8 border rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-destructive mb-4">Erreur de chargement du profil</h2>
          <p>Nous n'avons pas pu charger les données de votre profil. Veuillez réessayer.</p>
          <Button onClick={() => window.location.reload()} className="mt-6">Rafraîchir la page</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-cosmic animate-fade-in">
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <DashboardSidebar userRole="candidate" />
          
          <SidebarInset className="flex-1">
            <main className="flex-1 p-6">
              <div className="animate-slide-up">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-foreground">Dashboard Candidat</h1>
                  <p className="text-muted-foreground">Gérez votre profil et vos candidatures</p>
                </div>
                
                <div id="profile" className="mt-8">
                  <SimpleProfile userProfile={userProfile} onProfileUpdate={refreshProfile} />
                </div>
                <div id="applications" className="mt-8">
                  <CandidateApplications userProfile={userProfile} />
                </div>
                <div id="notifications" className="mt-8">
                  <NotificationSystem userProfile={userProfile} />
                </div>
              </div>
            </main>
          </SidebarInset>
          
          <CrossNotificationSystem userProfile={userProfile} />
        </div>
      </SidebarProvider>
      
      <EnhancedChatRAG 
        isOpen={chatRAGOpen} 
        onToggle={() => setChatRAGOpen(!chatRAGOpen)} 
      />
    </div>
  );
};

export default DashboardCandidat;
