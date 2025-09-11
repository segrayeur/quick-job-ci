import { useState } from "react";
import { 
  User, 
  Briefcase, 
  Users, 
  CreditCard, 
  FileText, 
  Search,
  TrendingUp,
  Star,
  Settings,
  Bell
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
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

interface DashboardSidebarProps {
  userRole: 'candidate' | 'recruiter' | 'admin';
}

export function DashboardSidebar({ userRole }: DashboardSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const candidateItems = [
    {
      title: "Mes candidatures",
      url: "/dashboard?tab=applications",
      icon: Briefcase,
    },
    {
      title: "Mon profil",
      url: "/dashboard?tab=profile",
      icon: User,
    },
    {
      title: "Notifications",
      url: "/dashboard?tab=notifications",
      icon: Bell,
    }
  ];

  const recruiterItems = [
    {
      title: "Tableau de bord",
      url: "/dashboard?tab=profile",
      icon: Briefcase,
    },
    {
      title: "Mes offres d'emploi",
      url: "/dashboard?tab=jobs",
      icon: Briefcase,
    },
    {
      title: "Candidatures reçues",
      url: "/dashboard?tab=applications",
      icon: Users,
    },
    {
      title: "Statistiques",
      url: "/dashboard?tab=stats",
      icon: TrendingUp,
    },
    {
      title: "Abonnements",
      url: "/dashboard?tab=subscription",
      icon: CreditCard,
    },
    {
      title: "Notifications",
      url: "/dashboard?tab=notifications",
      icon: Settings,
    }
  ];

  const items = userRole === 'candidate' ? candidateItems : recruiterItems;

  const isActive = (path: string) => {
    if (path === "/dashboard" && currentPath === "/dashboard") return true;
    return currentPath.includes(path) && path !== "/dashboard";
  };

  const getNavClass = (isActive: boolean) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground";

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-60"} collapsible="icon">
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {state === "expanded" && (
          <h2 className="text-lg font-semibold text-sidebar-foreground">
            {userRole === 'candidate' ? 'Espace Candidat' : 'Espace Recruteur'}
          </h2>
        )}
        <SidebarTrigger />
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClass(isActive(item.url))}
                    >
                      <item.icon className="h-4 w-4" />
                      {state === "expanded" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}