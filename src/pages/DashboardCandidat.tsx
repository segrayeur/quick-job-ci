import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AuthGuard from "@/components/AuthGuard";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import SimpleProfile from "@/components/SimpleProfile";
import CandidateApplications from "@/components/CandidateApplications";
import NotificationSystem from "@/components/NotificationSystem";
import CrossNotificationSystem from "@/components/CrossNotificationSystem";
import EnhancedChatRAG from "@/components/EnhancedChatRAG";

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          navigate("/connexion");
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserData(session.user.id);
      } else {
        navigate("/connexion");
      }
      setLoading(false);
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
        console.error('Error fetching candidate data:', error);
        navigate("/acces-non-autorise");
        return;
      }
      
      profile.applications_created_count = profile.applications_created_count || 0;
      profile.is_vip_candidate = profile.is_vip_candidate || false;
      profile.jobs_published = profile.jobs_published || 0;
      profile.subscription_plan = profile.subscription_plan || 'free';
      setUserProfile(profile as UserProfile);
    } catch (error) {
      console.error('Error fetching user data:', error);
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
      <div className="min-h-screen flex items-center justify-center text-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement de votre dashboard candidat...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return null;
  }

  return (
    <AuthGuard requiredRole="candidate">
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
                  
                  <SimpleProfile userProfile={userProfile} onProfileUpdate={refreshProfile} />
                  <div className="mt-8">
                    <CandidateApplications userProfile={userProfile} />
                  </div>
                  <div className="mt-8">
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
    </AuthGuard>
  );
};

export default DashboardCandidat;