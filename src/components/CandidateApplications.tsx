import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus, Eye } from "lucide-react";

interface UserProfile {
  id: string;
  applications_created_count: number;
  is_vip_candidate: boolean;
  vip_expiry_date?: string;
}

interface CandidateApplicationsProps {
  userProfile: UserProfile;
}

const CandidateApplications = ({ userProfile }: CandidateApplicationsProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center">
          <Briefcase className="mr-2 h-6 w-6 text-primary" />
          Mes candidatures
        </h2>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle candidature
        </Button>
      </div>

      <div className="text-center py-12">
        <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
          <Briefcase className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Fonctionnalité en cours de développement
        </h3>
        <p className="text-muted-foreground mb-4">
          Vos candidatures seront bientôt disponibles ici
        </p>
        <Button>
          <Eye className="mr-2 h-4 w-4" />
          Voir les offres disponibles
        </Button>
      </div>
    </div>
  );
};

export default CandidateApplications;