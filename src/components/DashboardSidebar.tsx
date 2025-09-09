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
  Settings
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
      title: "Candidatures & Offres",
      url: "/dashboard",
      icon: Briefcase,
      subItems: [
        { title: "Mes candidatures", url: "/dashboard?tab=applications" },
        { title: "Offres acceptées", url: "/dashboard?tab=accepted" },
        { title: "Offres disponibles", url: "/dashboard?tab=available" }
      ]
    },
    {
      title: "Mon profil",
      url: "/dashboard?tab=profile",
      icon: User,
    },
    {
      title: "Abonnement & Paiement",
      url: "/dashboard?tab=subscription",
      icon: CreditCard,
    }
  ];

  const recruiterItems = [
    {
      title: "Offres & Annonces",
      url: "/dashboard",
      icon: Briefcase,
      subItems: [
        { title: "Jobs publiés", url: "/dashboard?tab=jobs" },
        { title: "Candidatures reçues", url: "/dashboard?tab=applications" },
        { title: "Statistiques", url: "/dashboard?tab=stats" }
      ]
    },
    {
      title: "Base des candidats",
      url: "/dashboard?tab=candidates",
      icon: Users,
      subItems: [
        { title: "Voir tous les profils", url: "/dashboard?tab=all-candidates" },
        { title: "Recherche CV", url: "/dashboard?tab=search-cv" }
      ]
    },
    {
      title: "Mon profil",
      url: "/dashboard?tab=profile",
      icon: User,
    },
    {
      title: "Abonnement & Paiement",
      url: "/dashboard?tab=subscription",
      icon: CreditCard,
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
                  
                  {/* Sub-items pour les éléments expandables */}
                  {item.subItems && state === "expanded" && (
                    <div className="ml-6 mt-2 space-y-1">
                      {item.subItems.map((subItem) => (
                        <NavLink
                          key={subItem.title}
                          to={subItem.url}
                          className={`block p-2 text-sm rounded-md transition-colors ${getNavClass(isActive(subItem.url))}`}
                        >
                          {subItem.title}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}