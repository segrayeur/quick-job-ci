import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Settings, Crown, Star, Upload } from "lucide-react";
import locationsData from "@/data/locations.json";
import { UserProfile } from "@/integrations/supabase/types";

interface Commune {
  nom: string;
  quartiers: string[];
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
    experience: userProfile.experience || '',
    sub_sectors: userProfile.sub_sectors?.join(', ') || ''
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [communes, setCommunes] = useState<Commune[]>([]);
  const [quartiers, setQuartiers] = useState<string[]>([]);

  useEffect(() => {
    if (profileForm.location) {
      const selectedVille = locationsData.find(v => v.ville === profileForm.location);
      setCommunes(selectedVille?.communes || []);
    }
  }, [profileForm.location]);

  useEffect(() => {
    if (profileForm.commune) {
      const selectedCommune = communes.find(c => c.nom === profileForm.commune);
      setQuartiers(selectedCommune?.quartiers || []);
    }
  }, [profileForm.commune, communes]);

  const handleVilleChange = (ville: string) => {
    setProfileForm({ ...profileForm, location: ville, commune: '', quartier: '' });
  };

  const handleCommuneChange = (communeNom: string) => {
    setProfileForm({ ...profileForm, commune: communeNom, quartier: '' });
  };

  const handleCvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0]);
    }
  };

  const updateProfile = async () => {
    try {
      setUploading(true);
      let cvUrl = userProfile.cv_url;

      if (cvFile) {
        const fileExt = cvFile.name.split('.').pop();
        const filePath = `${userProfile.user_id}/cv.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('cvs').upload(filePath, cvFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('cvs').getPublicUrl(filePath);
        cvUrl = data.publicUrl;
      }

      const updateData: any = {
        phone: profileForm.phone,
        whatsapp: profileForm.whatsapp,
        location: profileForm.location,
        commune: profileForm.commune,
        quartier: profileForm.quartier,
        cv_url: cvUrl,
      };

      if (userProfile.role === 'candidate') {
        updateData.skills = profileForm.skills.split(',').map(s => s.trim()).filter(Boolean);
        updateData.availability = profileForm.availability;
        updateData.experience = profileForm.experience;
        updateData.sub_sectors = profileForm.sub_sectors.split(',').map(s => s.trim()).filter(Boolean).slice(0, 5);
      }

      const { error } = await supabase.from('users').update(updateData).eq('user_id', userProfile.user_id);

      if (error) throw error;

      toast({ title: "Profil mis à jour", description: "Vos informations ont été sauvegardées avec succès." });
      onProfileUpdate?.();
      setCvFile(null); 
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({ title: "Erreur", description: error.message || "Impossible de mettre à jour le profil", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
        {/* ... (existing CardHeader and CardContent for subscription) ... */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ... (existing fields for name, email, phone, whatsapp) ... */}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {/* ... location selectors ... */}
          </div>

          {userProfile.role === 'candidate' && (
            <>
             <div>
                <Label htmlFor="sub_sectors">Vos sous-secteurs d'activité (5 max)</Label>
                <Input 
                  id="sub_sectors" 
                  value={profileForm.sub_sectors} 
                  onChange={(e) => setProfileForm({ ...profileForm, sub_sectors: e.target.value })}
                  placeholder="Ex: Service en salle, Plonge, Cuisine..."
                />
                <p className="text-xs text-muted-foreground mt-1">Séparez les sous-secteurs par des virgules.</p>
              </div>

              {/* ... (existing candidate-specific fields) ... */}
              
              <div>
                 {/* ... (CV upload logic) ... */}
              </div>
            </>
          )}
          
          <Button onClick={updateProfile} disabled={uploading} className="w-full">
            {uploading ? 'Sauvegarde en cours...' : 'Sauvegarder les modifications'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleProfile;
