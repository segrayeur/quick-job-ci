import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import SimpleProfile from "@/components/SimpleProfile";
import RecruiterStats from "@/components/RecruiterStats";
import RecruiterJobsManager from "@/components/RecruiterJobsManager";
import RecruiterApplications from "@/components/RecruiterApplications";
import RecruiterSubscriptionManager from "@/components/RecruiterSubscriptionManager";

interface UserProfile {
  id: string;
  user_id: string;
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

// Define the possible views
type ActiveView = 'profile' | 'stats' | 'jobs' | 'applications' | 'subscription' | 'notifications';

const DashboardRecruteur = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State for single-view navigation
  const [activeView, setActiveView] = useState<ActiveView>('profile'); 
  const navigate = useNavigate();

  const fetchUserData = async (userId: string) => {
    setLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'recruiter')
        .single();
      if (error || !profile) {
        throw new Error(error?.message || "Profil recruteur non trouvé.");
      }
      setUserProfile(profile as UserProfile);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user.id) {
      await fetchUserData(session.user.id);
    }
  };

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/connexion");
        return;
      }
      await fetchUserData(session.user.id);
    };
    fetchSessionAndProfile();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') navigate('/connexion');
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading || !userProfile) return <div className="flex h-screen items-center justify-center">Chargement de votre espace...</div>;
  if (error) return <div className="flex h-screen items-center justify-center">Erreur: {error}. Veuillez vous reconnecter.</div>;

  // Function to render only the active component
  const renderActiveView = () => {
    switch (activeView) {
      case 'profile':
        return <section id="profile"><SimpleProfile userProfile={userProfile} onProfileUpdate={refreshProfile} /></section>;
      case 'stats':
        return <section id="stats"><RecruiterStats userProfile={userProfile} /></section>;
      case 'jobs':
        return <section id="jobs"><RecruiterJobsManager userProfile={userProfile} /></section>;
      case 'applications':
        return <section id="applications"><RecruiterApplications recruiterId={userProfile.id} /></section>;
      case 'subscription':
        return <section id="subscription"><RecruiterSubscriptionManager userProfile={userProfile} onSubscriptionChange={refreshProfile} /></section>;
      case 'notifications':
        return <section id="notifications"><div className="text-center py-10">La section des notifications est en cours de construction.</div></section>; // Placeholder
      default:
        return <section id="profile"><SimpleProfile userProfile={userProfile} onProfileUpdate={refreshProfile} /></section>;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar 
          userRole="recruiter" 
          activeView={activeView}
          onViewChange={(view) => setActiveView(view as ActiveView)}
        />
        <SidebarInset className="flex-1">
          <main className="flex-1 p-6 space-y-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground">Dashboard Recruteur</h1>
                <p className="text-muted-foreground">Gérez vos offres d'emploi et candidatures depuis un seul endroit.</p>
              </div>
              
              {/* Render only the active view */}
              {renderActiveView()}

          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardRecruteur;
