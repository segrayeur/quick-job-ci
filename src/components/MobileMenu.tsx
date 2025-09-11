import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, MapPin, User, LogIn, Briefcase, Home, Phone, Info, Users, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface MobileMenuProps {
  user: SupabaseUser | null;
}

const MobileMenu = ({ user }: MobileMenuProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };


  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
  };

  const menuItems = [
    {
      icon: Home,
      label: "Accueil",
      path: "/",
    },
    {
      icon: HelpCircle,
      label: "FAQ",
      path: "/faq",
    },
    {
      icon: Users,
      label: "Trouver un candidat",
      path: "/trouver-un-candidat",
    },
    {
      icon: Briefcase,
      label: "Trouver un job",
      path: "/trouver-un-job",
    },
    ...(!user ? [
      {
        icon: LogIn,
        label: "Se connecter",
        path: "/connexion",
      },
      {
        icon: User,
        label: "S'inscrire",
        path: "/inscription",
      }
    ] : []),
    {
      icon: Info,
      label: "À propos",
      path: "/about",
    },
    {
      icon: Phone,
      label: "Contact",
      path: "/contact",
    },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-foreground font-bold text-sm">QJ</span>
            </div>
            <span>QuickJob CI</span>
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-8 space-y-2">
          {menuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start h-12"
              onClick={() => handleNavigation(item.path)}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </Button>
          ))}
        </div>

        {user && (
          <div className="mt-8 pt-8 border-t">
            <div className="text-sm text-muted-foreground mb-4">
              Connecté en tant que {user.email}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLogout}
            >
              Se déconnecter
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;