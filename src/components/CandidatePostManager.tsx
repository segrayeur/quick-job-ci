import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserProfile } from "@/integrations/supabase/types";
import { Edit, Plus, Trash2, Eye } from "lucide-react";

interface CandidatePostManagerProps {
  userProfile: UserProfile;
}

interface CandidatePost {
  id?: string;
  title: string;
  description: string;
  hourly_rate: number;
  currency: string;
  location: string;
  skills: string[];
  availability: string;
}

const CandidatePostManager = ({ userProfile }: CandidatePostManagerProps) => {
  const [post, setPost] = useState<CandidatePost | null>(null);
  const [formData, setFormData] = useState<Partial<CandidatePost>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPost();
  }, []);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('candidate_posts')
        .select('*')
        .eq('candidate_id', userProfile.user_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
      
      if (data) {
        setPost(data);
        setFormData(data);
      }
    } catch (error: any) {
      toast({ title: "Erreur", description: "Impossible de charger votre profil public.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const skillsArray = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
      handleFormChange('skills', skillsArray);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description || !formData.hourly_rate || !formData.location || !formData.availability) {
        toast({ title: "Champs requis", description: "Veuillez remplir tous les champs obligatoires.", variant: "destructive" });
        return;
    }

    try {
        const postData = {
            ...formData,
            candidate_id: userProfile.user_id,
            currency: formData.currency || 'FCFA',
        };

        let result;
        if (post?.id) {
            // Update
            const { data, error } = await supabase.from('candidate_posts').update(postData).eq('id', post.id).select().single();
            if (error) throw error;
            result = data;
        } else {
            // Create
            const { data, error } = await supabase.from('candidate_posts').insert(postData).select().single();
            if (error) throw error;
            result = data;
        }

        setPost(result);
        setFormData(result);
        setIsEditing(false);
        toast({ title: "Succès", description: "Votre profil public a été sauvegardé.", });

    } catch (error: any) {
        toast({ title: "Erreur de sauvegarde", description: error.message, variant: "destructive" });
    }
  };
  
  const handleDelete = async () => {
      if (!post?.id) return;
      try {
          const { error } = await supabase.from('candidate_posts').delete().eq('id', post.id);
          if (error) throw error;
          
          setPost(null);
          setFormData({});
          setIsEditing(false);
          toast({ title: "Profil supprimé", description: "Votre profil public a été supprimé." });
      } catch (error: any) {
          toast({ title: "Erreur", description: error.message, variant: "destructive" });
      }
  };
  
  if (loading) return <p>Chargement de votre profil public...</p>;

  if (!isEditing && post) {
      return (
          <Card>
              <CardHeader>
                  <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Votre Profil Public</CardTitle>
                        <CardDescription>Ce que les recruteurs voient. Maintenez-le à jour.</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4 mr-2"/>Modifier</Button>
                  </div>
              </CardHeader>
              <CardContent className="space-y-4">
                  <h3 className="text-lg font-semibold">{post.title}</h3>
                  <p className="text-muted-foreground">{post.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                        <div><strong>Taux horaire:</strong> {post.hourly_rate} {post.currency}</div>
                        <div><strong>Lieu:</strong> {post.location}</div>
                        <div><strong>Disponibilité:</strong> {post.availability}</div>
                  </div>
                  <div>
                      <strong>Compétences:</strong>
                      <div className="flex flex-wrap gap-2 mt-2">
                          {post.skills.map(s => <Badge key={s}>{s}</Badge>)}
                      </div>
                  </div>
              </CardContent>
              <CardFooter>
                <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="h-4 w-4 mr-2"/>Supprimer le profil</Button>
              </CardFooter>
          </Card>
      );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{post ? 'Modifier' : 'Créer'} votre Profil Public</CardTitle>
        <CardDescription>Ce profil sera visible par les recruteurs. Soignez-le !</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Titre du profil</Label>
          <Input id="title" value={formData.title || ''} onChange={e => handleFormChange('title', e.target.value)} placeholder="Ex: Développeur Web Full-Stack" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={formData.description || ''} onChange={e => handleFormChange('description', e.target.value)} placeholder="Décrivez brièvement votre expérience et vos objectifs."/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="hourly_rate">Taux Horaire</Label>
                <Input id="hourly_rate" type="number" value={formData.hourly_rate || ''} onChange={e => handleFormChange('hourly_rate', parseFloat(e.target.value))} placeholder="2500" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <Input id="currency" value={formData.currency || 'FCFA'} onChange={e => handleFormChange('currency', e.target.value)} />
            </div>
        </div>
         <div className="space-y-2">
          <Label htmlFor="location">Ville</Label>
          <Input id="location" value={formData.location || userProfile.location || ''} onChange={e => handleFormChange('location', e.target.value)} placeholder="Abidjan" />
        </div>
        <div className="space-y-2">
            <Label htmlFor="availability">Disponibilité</Label>
            <Select onValueChange={value => handleFormChange('availability', value)} value={formData.availability}>
                <SelectTrigger><SelectValue placeholder="Sélectionnez votre disponibilité" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="immediate">Immédiate</SelectItem>
                    <SelectItem value="1-week">Sous 1 semaine</SelectItem>
                    <SelectItem value="2-weeks">Sous 2 semaines</SelectItem>
                    <SelectItem value="1-month">Sous 1 mois</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="space-y-2">
            <Label htmlFor="skills">Compétences (séparées par des virgules)</Label>
            <Input id="skills" value={(formData.skills || []).join(', ')} onChange={handleSkillsChange} placeholder="Ex: JavaScript, React, Vente, ..."/>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {post && <Button variant="ghost" onClick={() => { setIsEditing(false); setFormData(post); }}>Annuler</Button>}
        <Button onClick={handleSave}>Sauvegarder</Button>
      </CardFooter>
    </Card>
  );
};

export default CandidatePostManager;
