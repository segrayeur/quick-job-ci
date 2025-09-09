import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Clock, 
  Phone, 
  MessageCircle, 
  CheckCircle, 
  XCircle, 
  Eye,
  User,
  Star,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";

interface Application {
  id: string;
  status: string;
  message?: string;
  created_at: string;
  status_updated_at?: string;
  job: {
    id: string;
    title: string;
    description: string;
    amount: number;
    currency: string;
    location: string;
    category?: string;
  };
  student: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    whatsapp?: string;
    location?: string;
    commune?: string;
    quartier?: string;
    skills?: string[];
    experience?: string;
  };
}

interface UserProfile {
  id: string;
  role: string;
}

interface RecruiterApplicationsProps {
  userProfile: UserProfile;
}

const RecruiterApplications = ({ userProfile }: RecruiterApplicationsProps) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          job:jobs(*),
          student:users(*)
        `)
        .eq('job.recruiter_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data as any || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les candidatures",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ 
          status: newStatus,
          status_updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `La candidature a été ${newStatus === 'accepted' ? 'acceptée' : 'refusée'}.`
      });

      fetchApplications();
      setShowDetailsDialog(false);
    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "En attente", variant: "secondary" as const, icon: Clock },
      accepted: { label: "Acceptée", variant: "default" as const, icon: CheckCircle },
      rejected: { label: "Refusée", variant: "destructive" as const, icon: XCircle },
      accomplished: { label: "Accomplie", variant: "outline" as const, icon: Star }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const IconComponent = config?.icon || Clock;
    
    return (
      <Badge variant={config?.variant || "secondary"} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config?.label || status}
      </Badge>
    );
  };

  const groupedApplications = {
    pending: applications.filter(app => app.status === 'pending'),
    accepted: applications.filter(app => app.status === 'accepted'),
    rejected: applications.filter(app => app.status === 'rejected'),
    accomplished: applications.filter(app => app.status === 'accomplished')
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Chargement des candidatures...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Candidatures reçues</CardTitle>
          <CardDescription>
            Gérez les candidatures pour vos offres d'emploi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-secondary/20 rounded-lg">
              <p className="text-2xl font-bold text-secondary-foreground">{groupedApplications.pending.length}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </div>
            <div className="text-center p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{groupedApplications.accepted.length}</p>
              <p className="text-sm text-muted-foreground">Acceptées</p>
            </div>
            <div className="text-center p-4 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{groupedApplications.rejected.length}</p>
              <p className="text-sm text-muted-foreground">Refusées</p>
            </div>
            <div className="text-center p-4 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{groupedApplications.accomplished.length}</p>
              <p className="text-sm text-muted-foreground">Accomplies</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">En attente ({groupedApplications.pending.length})</TabsTrigger>
          <TabsTrigger value="accepted">Acceptées ({groupedApplications.accepted.length})</TabsTrigger>
          <TabsTrigger value="rejected">Refusées ({groupedApplications.rejected.length})</TabsTrigger>
          <TabsTrigger value="accomplished">Accomplies ({groupedApplications.accomplished.length})</TabsTrigger>
        </TabsList>

        {Object.entries(groupedApplications).map(([status, apps]) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {apps.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune candidature {status === 'pending' ? 'en attente' : status === 'accepted' ? 'acceptée' : status === 'rejected' ? 'refusée' : 'accomplie'}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {apps.map((application) => (
                  <Card key={application.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">
                            {application.student.first_name} {application.student.last_name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Candidature pour: {application.job.title}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {application.student.location} {application.student.commune && `- ${application.student.commune}`}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(application.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          {getStatusBadge(application.status)}
                          <p className="text-sm font-medium">
                            {application.job.amount.toLocaleString()} {application.job.currency}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {application.message && (
                        <div className="mb-4 p-3 bg-muted rounded-md">
                          <p className="text-sm font-medium mb-1">Message du candidat:</p>
                          <p className="text-sm text-muted-foreground">{application.message}</p>
                        </div>
                      )}
                      
                      {application.student.skills && application.student.skills.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2">Compétences:</p>
                          <div className="flex flex-wrap gap-1">
                            {application.student.skills.map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm">
                          {application.student.phone && (
                            <span className="flex items-center text-muted-foreground">
                              <Phone className="h-3 w-3 mr-1" />
                              {application.student.phone}
                            </span>
                          )}
                          {application.student.whatsapp && (
                            <span className="flex items-center text-muted-foreground">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              WhatsApp
                            </span>
                          )}
                        </div>
                        
                        <div className="space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedApplication(application);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir détails
                          </Button>
                          
                          {application.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => updateApplicationStatus(application.id, 'accepted')}
                              >
                                <ThumbsUp className="h-4 w-4 mr-1" />
                                Accepter
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateApplicationStatus(application.id, 'rejected')}
                              >
                                <ThumbsDown className="h-4 w-4 mr-1" />
                                Refuser
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog de détails */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la candidature</DialogTitle>
            <DialogDescription>
              {selectedApplication?.student.first_name} {selectedApplication?.student.last_name} - {selectedApplication?.job.title}
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Candidat</Label>
                  <p className="text-sm">{selectedApplication.student.first_name} {selectedApplication.student.last_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{selectedApplication.student.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Téléphone</Label>
                  <p className="text-sm">{selectedApplication.student.phone || "Non renseigné"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">WhatsApp</Label>
                  <p className="text-sm">{selectedApplication.student.whatsapp || "Non renseigné"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Localisation</Label>
                  <p className="text-sm">
                    {selectedApplication.student.location} 
                    {selectedApplication.student.commune && ` - ${selectedApplication.student.commune}`}
                    {selectedApplication.student.quartier && ` - ${selectedApplication.student.quartier}`}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Statut</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedApplication.status)}
                  </div>
                </div>
              </div>

              {selectedApplication.student.experience && (
                <div>
                  <Label className="text-sm font-medium">Expérience</Label>
                  <p className="text-sm mt-1">{selectedApplication.student.experience}</p>
                </div>
              )}

              {selectedApplication.message && (
                <div>
                  <Label className="text-sm font-medium">Message de candidature</Label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">{selectedApplication.message}</p>
                </div>
              )}

              {selectedApplication.status === 'pending' && (
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected')}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Refuser
                  </Button>
                  <Button
                    onClick={() => updateApplicationStatus(selectedApplication.id, 'accepted')}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Accepter
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecruiterApplications;