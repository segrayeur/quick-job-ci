import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AuthGuard from "@/components/AuthGuard";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import SimpleProfile from "@/components/SimpleProfile";
import RecruiterApplications from "@/components/RecruiterApplications";
import RecruiterJobsManager from "@/components/RecruiterJobsManager";
import RecruiterStats from "@/components/RecruiterStats";
import RecruiterSubscriptionManager from "@/components/RecruiterSubscriptionManager";
import NotificationSystem from "@/components/NotificationSystem";
import CrossNotificationSystem from "@/components/CrossNotificationSystem";
import EnhancedChatRAG from "@/components/EnhancedChatRAG";

interface UserProfile {
  id: string;
  role: 'recruiter';
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  location?: string;
  commune?: string;
  quartier?: string;
  is_verified?: boolean;
  profile_complete?: boolean;
  jobs_published: number;
  subscription_plan: string;
  subscription_end?: string;
  applications_created_count: number;
  is_vip_candidate: boolean;
  vip_expiry_date?: string;
}

const DashboardRecruteur = () => {
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
        .eq('role', 'recruiter')
        .single();
      
      if (error || !profile) {
        console.error('Error fetching recruiter data:', error);
        navigate("/acces-non-autorise");
        return;
      }
      
      profile.jobs_published = profile.jobs_published || 0;
      profile.subscription_plan = profile.subscription_plan || 'free';
      profile.applications_created_count = profile.applications_created_count || 0;
      profile.is_vip_candidate = profile.is_vip_candidate || false;
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
          <p>Chargement de votre dashboard recruteur...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return null;
  }

  return (
    <AuthGuard requiredRole="recruiter">
      <div className="min-h-screen bg-gradient-cosmic animate-fade-in">
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <DashboardSidebar userRole="recruiter" />
            
            <SidebarInset className="flex-1">
              <main className="flex-1 p-6">
                <div className="animate-slide-up">
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold text-foreground">Dashboard Recruteur</h1>
                    <p className="text-muted-foreground">Gérez vos offres d'emploi et candidatures</p>
                  </div>
                  
                  <SimpleProfile userProfile={userProfile} onProfileUpdate={refreshProfile} />
                  <div className="mt-8">
                    <RecruiterStats userProfile={userProfile} />
                  </div>
                  <div className="mt-8">
                    <RecruiterJobsManager userProfile={userProfile} />
                  </div>
                  <div className="mt-8">
                    <RecruiterApplications userProfile={userProfile} />
                  </div>
                  <div className="mt-8">
                    <RecruiterSubscriptionManager userProfile={userProfile} onUpgrade={refreshProfile} />
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

export default DashboardRecruteur;