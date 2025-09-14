import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@supabase/supabase-js";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AuthGuard from "@/components/AuthGuard";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import SimpleProfile from "@/components/SimpleProfile";
import CandidateApplications from "@/components/CandidateApplications";
import AvailableJobs from "@/components/AvailableJobs";
import CandidateStats from "@/components/CandidateStats";
import CandidateSubscriptionManager from "@/components/CandidateSubscriptionManager";
import RecruiterApplications from "@/components/RecruiterApplications";
import RecruiterJobsManager from "@/components/RecruiterJobsManager";
import RecruiterStats from "@/components/RecruiterStats";
import RecruiterSubscriptionManager from "@/components/RecruiterSubscriptionManager";
import NotificationSystem from "@/components/NotificationSystem";
import CrossNotificationSystem from "@/components/CrossNotificationSystem";
import EnhancedChatRAG from "@/components/EnhancedChatRAG";
import CandidateDatabase from "@/components/CandidateDatabase";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import AdminJobsManagement from "@/components/admin/AdminJobsManagement";
import AdminApplicationsManagement from "@/components/admin/AdminApplicationsManagement";
import AdminSubscriptionsManagement from "@/components/admin/AdminSubscriptionsManagement"; // Import the new component
import InternalMessaging from "@/components/InternalMessaging";
import { UserProfile } from "@/integrations/supabase/types";

const Dashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatRAGOpen, setChatRAGOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate('/auth');
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (error && error.code !== 'PGRST116') throw error;

          if (data) {
            setUserProfile(data);
          } else if (!error) {
             navigate('/auth');
          }
        } catch (error: any) {
          toast({ title: "Erreur de chargement du profil", description: error.message, variant: "destructive" });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [session, navigate, toast]);

  const activeTab = searchParams.get('tab') || (userProfile?.role === 'admin' ? 'dashboard' : 'profile');

  const handleViewChange = (view: string) => {
    setSearchParams({ tab: view });
  };

  const refreshProfile = async () => {
    if (session?.user) {
       const { data } = await supabase.from('users').select('*').eq('user_id', session.user.id).single();
       if(data) setUserProfile(data);
    }
  }

  const renderContent = () => {
    if (!userProfile) return null;

    switch (activeTab) {
      // Common
      case 'profile':
        return <SimpleProfile userProfile={userProfile} onProfileUpdate={refreshProfile} />;
      case 'notifications':
        return <NotificationSystem userProfile={userProfile} />;
      case 'messaging':
        if (userProfile.role === 'candidate' || userProfile.role === 'recruiter') {
          return <InternalMessaging userProfile={userProfile} />;
        }
        return null;

      // Role-based routing
      case 'applications':
        if (userProfile.role === 'candidate') return <CandidateApplications userProfile={userProfile} />;
        if (userProfile.role === 'recruiter') return <RecruiterApplications userProfile={userProfile} />;
        if (userProfile.role === 'admin') return <AdminApplicationsManagement />;
        return null;
      
      case 'stats':
        if (userProfile.role === 'candidate') return <CandidateStats userProfile={userProfile} />;
        if (userProfile.role === 'recruiter') return <RecruiterStats userProfile={userProfile} />;
        return null;

       case 'subscription':
        if (userProfile.role === 'candidate') return <CandidateSubscriptionManager userProfile={userProfile} onUpgrade={refreshProfile} />;
        if (userProfile.role === 'recruiter') return <RecruiterSubscriptionManager userProfile={userProfile} onUpgrade={refreshProfile} />;
        if (userProfile.role === 'admin') return <AdminSubscriptionsManagement />;
        return null;

      // Candidate specific
      case 'available-jobs':
        return userProfile.role === 'candidate' && <AvailableJobs userProfile={userProfile} />;

      // Recruiter and Admin
      case 'jobs':
        if (userProfile.role === 'recruiter') return <RecruiterJobsManager userProfile={userProfile} />;
        if (userProfile.role === 'admin') return <AdminJobsManagement />;
        return null;

      // Recruiter specific
      case 'candidate-database':
        return userProfile.role === 'recruiter' && <CandidateDatabase userProfile={userProfile} />;

      // Admin specific
      case 'dashboard':
         return userProfile.role === 'admin' && <AdminDashboard />;
      case 'users':
         return userProfile.role === 'admin' && <AdminUserManagement />;

      default:
        return <SimpleProfile userProfile={userProfile} onProfileUpdate={refreshProfile} />;
    }
  }

  if (loading || !userProfile) {
    return <div className="min-h-screen flex items-center justify-center">Chargement de votre espace...</div>;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <DashboardSidebar userRole={userProfile.role} activeView={activeTab} onViewChange={handleViewChange} />
            
            <SidebarInset className="flex-1 bg-gradient-to-br from-background to-muted/20">
              <main className="flex-1 p-4 sm:p-6 lg:p-8">
                <div className="animate-fade-in-up">
                 {renderContent()}
                </div>
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
        
        <EnhancedChatRAG 
          isOpen={chatRAGOpen} 
          onToggle={() => setChatRAGOpen(!chatRAGOpen)} 
        />
         <CrossNotificationSystem userProfile={userProfile} />
      </div>
    </AuthGuard>
  );
};

export default Dashboard;
