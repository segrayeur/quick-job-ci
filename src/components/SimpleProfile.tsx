import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LocationSelector } from "@/components/LocationSelector";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Settings, Crown, Star } from "lucide-react";

interface UserProfile {
  id: string;
  role: 'admin' | 'recruiter' | 'candidate';
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  location?: string;
  commune?: string;
  quartier?: string;
  skills?: string[];
  availability?: string;
  experience?: string;
  cv_url?: string;
  is_verified?: boolean;
  profile_complete?: boolean;
  applications_created_count: number;
  is_vip_candidate: boolean;
  vip_expiry_date?: string;
  jobs_published: number;
  subscription_plan: string;
  subscription_end?: string;
}

interface SimpleProfileProps {
  userProfile: UserProfile;
  onProfileUpdate?: () => void;
}

const SimpleProfile = ({ userProfile, onProfileUpdate }: SimpleProfileProps) => {
  const [profileForm, setProfileForm] = useState({
    phone: userProfile.phone || '',
    whatsapp: userProfile.whatsapp || '',
    location: userProfile.location || '',
    commune: userProfile.commune || '',
    quartier: userProfile.quartier || '',
    skills: userProfile.skills?.join(', ') || '',
    availability: userProfile.availability || '',
    experience: userProfile.experience || ''
  });
  const { toast } = useToast();

  const updateProfile = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          phone: profileForm.phone,
          whatsapp: profileForm.whatsapp,
          location: profileForm.location,
          commune: profileForm.commune,
          quartier: profileForm.quartier,
          skills: profileForm.skills.split(',').map(s => s.trim()).filter(Boolean),
          availability: profileForm.availability,
          experience: profileForm.experience
        })
        .eq('id', userProfile.id);

      if (error) throw error;

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès."
      });
      
      onProfileUpdate?.();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
        variant: "destructive"
      });
    }
  };

  const getSubscriptionInfo = () => {
    if (userProfile.role === 'candidate') {
      return {
        title: userProfile.is_vip_candidate ? 'VIP-Cant' : 'Gratuit',
        variant: userProfile.is_vip_candidate ? 'default' : 'secondary',
        description: userProfile.is_vip_candidate ? '25 candidatures maximum' : '10 candidatures maximum',
        icon: userProfile.is_vip_candidate ? Star : User
      };
    } else {
      const planConfig = {
        free: { title: 'Gratuit', variant: 'secondary', description: '10 publications', icon: User },
        standard: { title: 'Standard', variant: 'default', description: '25 publications', icon: Crown },
        pro: { title: 'Pro', variant: 'default', description: 'Publications illimitées', icon: Star }
      };
      return planConfig[userProfile.subscription_plan as keyof typeof planConfig] || planConfig.free;
    }
  };

  const subInfo = getSubscriptionInfo();
  const SubIcon = subInfo.icon;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Mon Profil {userProfile.role === 'candidate' ? 'Candidat' : 'Recruteur'}
              </CardTitle>
              <CardDescription>
                Gérez vos informations personnelles et votre abonnement
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={subInfo.variant as any} className="flex items-center gap-1">
                <SubIcon className="h-3 w-3" />
                {subInfo.title}
              </Badge>
              {userProfile.is_verified && (
                <Badge variant="outline" className="text-green-600">
                  Vérifié
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-foreground/70 space-y-1">
            <p>{subInfo.description}</p>
            {userProfile.role === 'candidate' && (
              <p>Candidatures utilisées: {userProfile.applications_created_count}</p>
            )}
            {userProfile.role === 'recruiter' && (
              <p>Publications utilisées: {userProfile.jobs_published}</p>
            )}
            {userProfile.subscription_end && (
              <p>Expire le: {new Date(userProfile.subscription_end).toLocaleDateString('fr-FR')}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Prénom</Label>
              <Input id="first_name" value={userProfile.first_name} readOnly />
            </div>
            <div>
              <Label htmlFor="last_name">Nom</Label>
              <Input id="last_name" value={userProfile.last_name} readOnly />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={userProfile.email} readOnly />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input 
                id="phone" 
                value={profileForm.phone}
                onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                placeholder="Ex: +225 01 02 03 04 05" 
              />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input 
                id="whatsapp" 
                value={profileForm.whatsapp}
                onChange={(e) => setProfileForm({...profileForm, whatsapp: e.target.value})}
                placeholder="Ex: +225 01 02 03 04 05" 
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="location">Ville</Label>
              <Input 
                id="location" 
                value={profileForm.location}
                onChange={(e) => setProfileForm({...profileForm, location: e.target.value})}
                placeholder="Ex: Abidjan" 
              />
            </div>
            <LocationSelector
              selectedCommune={profileForm.commune}
              selectedQuartier={profileForm.quartier}
              onCommuneChange={(commune) => setProfileForm({...profileForm, commune})}
              onQuartierChange={(quartier) => setProfileForm({...profileForm, quartier})}
            />
          </div>

          {userProfile.role === 'candidate' && (
            <>
              <div>
                <Label htmlFor="skills">Compétences (séparées par des virgules)</Label>
                <Input 
                  id="skills" 
                  value={profileForm.skills}
                  onChange={(e) => setProfileForm({...profileForm, skills: e.target.value})}
                  placeholder="Ex: Marketing, Vente, Communication" 
                />
              </div>
              
              <div>
                <Label htmlFor="availability">Disponibilité</Label>
                <Input 
                  id="availability" 
                  value={profileForm.availability}
                  onChange={(e) => setProfileForm({...profileForm, availability: e.target.value})}
                  placeholder="Ex: Immédiate, Dans la semaine" 
                />
              </div>
              
              <div>
                <Label htmlFor="experience">Expérience</Label>
                <Textarea 
                  id="experience" 
                  value={profileForm.experience}
                  onChange={(e) => setProfileForm({...profileForm, experience: e.target.value})}
                  placeholder="Décrivez votre expérience professionnelle..."
                  rows={4}
                />
              </div>
            </>
          )}
          
          <Button onClick={updateProfile} className="w-full">
            Sauvegarder les modifications
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleProfile;