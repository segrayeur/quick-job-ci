import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  MapPin, 
  Clock, 
  Building, 
  Phone, 
  MessageCircle,
  Send,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  location: string;
  commune?: string;
  category?: string;
  company_name?: string;
  created_at: string;
}

interface JobContactInfo {
  contact_phone?: string;
  contact_whatsapp?: string;
}

interface JobDetailsModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  userProfile?: {
    id: string;
    role: string;
  };
  onApply?: (job: Job) => void;
}

const JobDetailsModal = ({ job, isOpen, onClose, userProfile, onApply }: JobDetailsModalProps) => {
  const [contactInfo, setContactInfo] = useState<JobContactInfo | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (job && isOpen && userProfile) {
      checkApplicationStatus();
      fetchContactInfo();
    }
  }, [job, isOpen, userProfile]);

  const checkApplicationStatus = async () => {
    if (!job || !userProfile) return;

    try {
      const { data, error } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', job.id)
        .eq('student_id', userProfile.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setHasApplied(!!data);
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const fetchContactInfo = async () => {
    if (!job) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_job_contact_info', {
        job_id: job.id
      });

      if (error) {
        // If error, contact info is not available (user hasn't applied or isn't recruiter)
        setContactInfo(null);
        return;
      }

      setContactInfo(data?.[0] || null);
    } catch (error) {
      console.error('Error fetching contact info:', error);
      setContactInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (job && onApply) {
      onApply(job);
      onClose();
    }
  };

  if (!job) return null;

  const canSeeContactInfo = contactInfo && (contactInfo.contact_phone || contactInfo.contact_whatsapp);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{job.title}</DialogTitle>
          <DialogDescription className="flex items-center space-x-4 text-sm">
            <span className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {job.location} {job.commune && `- ${job.commune}`}
            </span>
            <span className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {new Date(job.created_at).toLocaleDateString('fr-FR')}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations principales */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Rémunération</h3>
                <p className="text-2xl font-bold text-primary">
                  {job.amount.toLocaleString()} {job.currency}
                </p>
              </div>
              {job.category && (
                <Badge variant="outline" className="text-sm">
                  {job.category}
                </Badge>
              )}
            </div>

            {job.company_name && (
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Entreprise: {job.company_name}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description du poste</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
          </div>

          {/* Informations de contact */}
          <div>
            <h3 className="font-semibold mb-2">Contact du recruteur</h3>
            {loading ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Vérification des accès...</p>
              </div>
            ) : canSeeContactInfo ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">
                    Informations de contact disponibles
                  </span>
                </div>
                <div className="space-y-2">
                  {contactInfo?.contact_phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>Téléphone: {contactInfo.contact_phone}</span>
                    </div>
                  )}
                  {contactInfo?.contact_whatsapp && (
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      <span>WhatsApp: {contactInfo.contact_whatsapp}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 mr-2" />
                  <span className="text-orange-800 font-medium">
                    Informations de contact masquées
                  </span>
                </div>
                <p className="text-orange-700 text-sm">
                  {hasApplied 
                    ? "Vos informations de contact seront révélées une fois votre candidature acceptée."
                    : "Postulez à cette offre pour accéder aux informations de contact du recruteur."
                  }
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Fermer
            </Button>
            {userProfile?.role === 'candidate' && !hasApplied && (
              <Button onClick={handleApply} className="flex-1">
                <Send className="h-4 w-4 mr-2" />
                Postuler maintenant
              </Button>
            )}
            {hasApplied && (
              <Button variant="secondary" disabled className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Candidature envoyée
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailsModal;