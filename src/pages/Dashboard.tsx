import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AuthGuard from "@/components/AuthGuard";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import SimpleProfile from "@/components/SimpleProfile";
import CandidateApplications from "@/components/CandidateApplications";
import RecruiterApplications from "@/components/RecruiterApplications";
import RecruiterJobsManager from "@/components/RecruiterJobsManager";
import RecruiterStats from "@/components/RecruiterStats";
import RecruiterSubscriptionManager from "@/components/RecruiterSubscriptionManager";
import NotificationSystem from "@/components/NotificationSystem";
import CrossNotificationSystem from "@/components/CrossNotificationSystem";
import EnhancedChatRAG from "@/components/EnhancedChatRAG";
import AdminCreateCandidate from "@/components/admin/AdminCreateCandidate";
import AdminPasswordReset from "@/components/admin/AdminPasswordReset";
import AdminDeleteAccount from "@/components/admin/AdminDeleteAccount";

interface UserProfile {
  id: string;
  role: 'admin' | 'recruiter' | 'candidate';
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

const Dashboard = () => {
  // Dashboard principal de l'application
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatRAGOpen, setChatRAGOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserData(session.user.id);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger votre profil. Veuillez rafraîchir la page.",
          variant: "destructive",
        });
        return;
      }
      
      if (profile) {
        profile.applications_created_count = profile.applications_created_count || 0;
        profile.is_vip_candidate = profile.is_vip_candidate || false;
        profile.jobs_published = profile.jobs_published || 0;
        profile.subscription_plan = profile.subscription_plan || 'free';
        setUserProfile(profile);
      } else {
        // Si aucun profil n'existe, rediriger vers la page d'inscription pour compléter le profil
        toast({
          title: "Profil incomplet",
          description: "Veuillez compléter votre profil.",
        });
        navigate('/inscription');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors du chargement du profil.",
        variant: "destructive",
      });
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserData(user.id);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-foreground">Chargement...</div>;
  }

  if (!userProfile) {
    return <div className="min-h-screen flex items-center justify-center text-foreground">Erreur de chargement du profil</div>;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-cosmic animate-fade-in">
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <DashboardSidebar userRole={userProfile?.role || 'candidate'} />
            
            <SidebarInset className="flex-1">
              <main className="flex-1 p-6">
                <div className="animate-slide-up">
                  {activeTab === 'profile' && <SimpleProfile userProfile={userProfile!} onProfileUpdate={refreshProfile} />}
                  {activeTab === 'applications' && userProfile?.role === 'candidate' && (
                    <CandidateApplications userProfile={userProfile} />
                  )}
                  {activeTab === 'applications' && userProfile?.role === 'recruiter' && (
                    <RecruiterApplications userProfile={userProfile} />
                  )}
                  {activeTab === 'jobs' && userProfile?.role === 'recruiter' && (
                    <RecruiterJobsManager userProfile={userProfile} />
                  )}
                  {activeTab === 'stats' && userProfile?.role === 'recruiter' && (
                    <RecruiterStats userProfile={userProfile} />
                  )}
                  {activeTab === 'subscription' && userProfile?.role === 'recruiter' && (
                    <RecruiterSubscriptionManager userProfile={userProfile} onUpgrade={refreshProfile} />
                  )}

                  {/* Admin tools */}
                  {userProfile?.role === 'admin' && activeTab === 'admin-create' && (
                    <AdminCreateCandidate />
                  )}
                  {userProfile?.role === 'admin' && activeTab === 'admin-reset' && (
                    <AdminPasswordReset />
                  )}
                  {userProfile?.role === 'admin' && activeTab === 'admin-delete' && (
                    <AdminDeleteAccount />
                  )}

                  {activeTab === 'notifications' && (
                    <NotificationSystem userProfile={userProfile} />
                  )}
                </div>
              </main>
            </SidebarInset>
            
            {/* Cross-notification system for real-time updates */}
            <CrossNotificationSystem userProfile={userProfile!} />
          </div>
        </SidebarProvider>
        
        {/* Enhanced Chat RAG positioned on the right */}
        <EnhancedChatRAG 
          isOpen={chatRAGOpen} 
          onToggle={() => setChatRAGOpen(!chatRAGOpen)} 
        />
      </div>
    </AuthGuard>
  );
};

export default Dashboard;