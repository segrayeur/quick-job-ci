
import { 
  User, 
  Briefcase, 
  Users, 
  CreditCard, 
  Settings,
  TrendingUp,
  Bell,
  LogOut,
  Search,
  LayoutDashboard,
  FileText,
  BarChart,
  MessageSquare,
  Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";

interface DashboardSidebarProps {
  userRole: 'candidate' | 'recruiter' | 'admin';
  activeView: string;
  onViewChange: (view: string) => void;
}

export function DashboardSidebar({ userRole, activeView, onViewChange }: DashboardSidebarProps) {
  const { state } = useSidebar();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
      navigate('/');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de se déconnecter",
        variant: "destructive"
      });
    }
  };

  const candidateItems = [
    { id: 'profile', title: "Mon Profil", icon: User },
    { id: 'applications', title: "Mes Candidatures", icon: Briefcase },
    { id: 'available-jobs', title: "Offres Disponibles", icon: Search },
    { id: 'stats', title: "Statistiques", icon: TrendingUp },
    { id: 'subscription', title: "Abonnement", icon: CreditCard },
    { id: 'notifications', title: "Notifications", icon: Bell },
  ];

  const recruiterItems = [
    { id: 'profile', title: "Mon Profil", icon: User },
    { id: 'jobs', title: "Gestion des Offres", icon: Briefcase },
    { id: 'applications', title: "Candidatures Reçues", icon: Users },
    { id: 'candidate-database', title: "Base de Candidats", icon: Search },
    { id: 'stats', title: "Statistiques", icon: TrendingUp },
    { id: 'subscription', title: "Abonnement", icon: CreditCard },
    { id: 'notifications', title: "Notifications", icon: Bell },
  ];

  const adminItems = [
    { id: 'dashboard', title: "Vue d'ensemble", icon: LayoutDashboard },
    { id: 'users', title: "Utilisateurs", icon: Users },
    { id: 'jobs', title: "Offres & Jobs", icon: Briefcase },
    { id: 'applications', title: "Candidatures", icon: FileText },
    { id: 'subscriptions', title: "Abonnements", icon: CreditCard },
    { id: 'stats', title: "Statistiques & KPI", icon: BarChart },
    { id: 'messaging', title: "Messagerie", icon: MessageSquare },
    { id: 'system-settings', title: "Paramètres", icon: Settings },
    { id: 'logs', title: "Logs & Audit", icon: Shield },
  ];

  let items = candidateItems;
  let sidebarTitle = "Espace Candidat";

  switch (userRole) {
    case 'recruiter':
      items = recruiterItems;
      sidebarTitle = "Espace Recruteur";
      break;
    case 'admin':
      items = adminItems;
      sidebarTitle = "Admin Panel";
      break;
    case 'candidate':
    default:
      items = candidateItems;
      sidebarTitle = "Espace Candidat";
      break;
  }

  const SidebarLink = ({ item }: { item: { id: string; title: string; icon: React.ElementType } }) => {
    const isActive = activeView === item.id;
    const activeClass = isActive ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted text-muted-foreground";

    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton 
          onClick={() => onViewChange(item.id)}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${activeClass}`}
        >
          <item.icon className="h-4 w-4" />
          {state === "expanded" && <span>{item.title}</span>}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar className={`border-r bg-muted/40 ${state === "collapsed" ? "w-16" : "w-64"}`} collapsible="icon">
      <div className="flex h-16 items-center justify-between p-4 border-b">
        {state === "expanded" && (
          <h2 className="text-lg font-semibold text-foreground">
            {sidebarTitle}
          </h2>
        )}
        <SidebarTrigger className="ml-auto" />
      </div>

      <SidebarContent className="flex flex-col justify-between h-[calc(100vh-4rem)]">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="p-2 space-y-1">
              {items.map((item) => <SidebarLink key={item.id} item={item} />)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="p-2 border-t mt-auto">
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground w-full">
                <LogOut className="h-4 w-4" />
                {state === "expanded" && <span>Déconnexion</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
