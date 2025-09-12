// @ts-nocheck
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter,
  MapPin, 
  Phone, 
  MessageCircle, 
  User,
  Star,
  Heart,
  Eye,
  Users,
  Award,
  Clock
} from "lucide-react";

interface Candidate {
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
  availability?: string;
  is_vip_candidate: boolean;
  applications_created_count: number;
  created_at: string;
}

interface CandidatePost {
  id: string;
  title: string;
  description: string;
  skills: string[];
  hourly_rate: number;
  currency: string;
  availability: string;
  location: string;
  commune?: string;
  quartier?: string;
  views_count: number;
  created_at: string;
  candidate: Candidate;
}

interface CandidateRating {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  role: string;
}

interface CandidateDatabaseProps {
  userProfile: UserProfile;
}

const CandidateDatabase = ({ userProfile }: CandidateDatabaseProps) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidatePosts, setCandidatePosts] = useState<CandidatePost[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<CandidatePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [skillsFilter, setSkillsFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("profiles");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterData();
  }, [candidates, candidatePosts, searchTerm, locationFilter, skillsFilter, availabilityFilter, activeTab]);

  const fetchData = async () => {
    try {
      // Fetch all candidates
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'candidate')
        .order('created_at', { ascending: false });

      if (candidatesError) throw candidatesError;
      setCandidates(candidatesData || []);

      // Fetch candidate posts with candidate info
      const { data: postsData, error: postsError } = await supabase
        .from('candidate_posts')
        .select(`
          *,
          candidate:users(*)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      setCandidatePosts(postsData as any || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    if (activeTab === "profiles") {
      let filtered = candidates;

      // Filter by search term
      if (searchTerm) {
        filtered = filtered.filter(candidate =>
          `${candidate.first_name} ${candidate.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          candidate.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
          candidate.experience?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Filter by location
      if (locationFilter !== "all") {
        filtered = filtered.filter(candidate => 
          candidate.location === locationFilter || candidate.commune === locationFilter
        );
      }

      // Filter by skills
      if (skillsFilter !== "all") {
        filtered = filtered.filter(candidate =>
          candidate.skills?.some(skill => skill.toLowerCase().includes(skillsFilter.toLowerCase()))
        );
      }

      // Filter by availability
      if (availabilityFilter !== "all") {
        filtered = filtered.filter(candidate => candidate.availability === availabilityFilter);
      }

      setFilteredCandidates(filtered);
    } else {
      let filtered = candidatePosts;

      // Filter by search term
      if (searchTerm) {
        filtered = filtered.filter(post =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      // Filter by location
      if (locationFilter !== "all") {
        filtered = filtered.filter(post => 
          post.location === locationFilter || post.commune === locationFilter
        );
      }

      setFilteredPosts(filtered);
    }
  };

  const addToFavorites = async (candidateId: string) => {
    try {
      const { error } = await supabase
        .from('candidate_favorites')
        .insert({
          recruiter_id: userProfile.id,
          candidate_id: candidateId
        });

      if (error) throw error;

      toast({
        title: "Candidat ajouté aux favoris",
        description: "Le candidat a été ajouté à vos favoris."
      });
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter aux favoris",
        variant: "destructive"
      });
    }
  };

  const rateCandidate = async () => {
    if (!selectedCandidate) return;

    try {
      const { error } = await supabase
        .from('candidate_ratings')
        .insert({
          recruiter_id: userProfile.id,
          candidate_id: selectedCandidate.id,
          rating: rating,
          comment: ratingComment
        });

      if (error) throw error;

      toast({
        title: "Évaluation ajoutée",
        description: "L'évaluation du candidat a été enregistrée."
      });

      setShowRatingDialog(false);
      setRating(5);
      setRatingComment("");
    } catch (error) {
      console.error('Error rating candidate:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'évaluation",
        variant: "destructive"
      });
    }
  };

  const uniqueLocations = Array.from(new Set([
    ...candidates.map(c => c.location).filter(Boolean),
    ...candidates.map(c => c.commune).filter(Boolean)
  ]));

  const uniqueSkills = Array.from(new Set(
    candidates.flatMap(c => c.skills || [])
  )).slice(0, 10); // Limit to 10 most common skills

  if (loading) {
    return <div className="flex items-center justify-center p-8">Chargement de la base des candidats...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Recherche de candidats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                variant={activeTab === "profiles" ? "default" : "outline"}
                onClick={() => setActiveTab("profiles")}
                className="flex items-center"
              >
                <Users className="h-4 w-4 mr-2" />
                Tous les profils ({candidates.length})
              </Button>
              <Button
                variant={activeTab === "posts" ? "default" : "outline"}
                onClick={() => setActiveTab("posts")}
                className="flex items-center"
              >
                <Award className="h-4 w-4 mr-2" />
                Candidatures actives ({candidatePosts.length})
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Rechercher</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Nom, compétences..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Localisation</Label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les zones</SelectItem>
                    {uniqueLocations.map((location) => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {activeTab === "profiles" && (
                <>
                  <div>
                    <Label htmlFor="skills">Compétences</Label>
                    <Select value={skillsFilter} onValueChange={setSkillsFilter}>
                      <SelectTrigger id="skills">
                        <SelectValue placeholder="Toutes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les compétences</SelectItem>
                        {uniqueSkills.map((skill) => (
                          <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="availability">Disponibilité</Label>
                    <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                      <SelectTrigger id="availability">
                        <SelectValue placeholder="Toutes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="immédiate">Immédiate</SelectItem>
                        <SelectItem value="dans la semaine">Dans la semaine</SelectItem>
                        <SelectItem value="dans le mois">Dans le mois</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {activeTab === "profiles" ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Profils candidats ({filteredCandidates.length})
          </h3>
          {filteredCandidates.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucun candidat trouvé</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredCandidates.map((candidate) => (
                <Card key={candidate.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center">
                          {candidate.first_name} {candidate.last_name}
                          {candidate.is_vip_candidate && (
                            <Badge className="ml-2" variant="default">VIP</Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {candidate.location} {candidate.commune && `- ${candidate.commune}`}
                          </span>
                          <span className="flex items-center">
                            <Award className="h-3 w-3 mr-1" />
                            {candidate.applications_created_count} candidatures
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {candidate.availability && (
                          <Badge variant="outline" className="mb-2">
                            {candidate.availability}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {candidate.skills && candidate.skills.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {candidate.skills.slice(0, 5).map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {candidate.skills.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{candidate.skills.length - 5} autres
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {candidate.experience && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {candidate.experience}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm">
                        {candidate.phone && (
                          <span className="flex items-center text-muted-foreground">
                            <Phone className="h-3 w-3 mr-1" />
                            Tél. disponible
                          </span>
                        )}
                        {candidate.whatsapp && (
                          <span className="flex items-center text-muted-foreground">
                            <MessageCircle className="h-3 w-3 mr-1" />
                            WhatsApp
                          </span>
                        )}
                        <span className="flex items-center text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          Inscrit le {new Date(candidate.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addToFavorites(candidate.id)}
                        >
                          <Heart className="h-4 w-4 mr-1" />
                          Favoris
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir profil
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setShowRatingDialog(true);
                          }}
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Évaluer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Candidatures actives ({filteredPosts.length})
          </h3>
          {filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucune candidature active</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredPosts.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{post.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Par {post.candidate.first_name} {post.candidate.last_name}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {post.location} {post.commune && `- ${post.commune}`}
                          </span>
                          <span className="flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {post.views_count} vues
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          {post.hourly_rate.toLocaleString()} {post.currency}/h
                        </p>
                        <Badge variant="outline">{post.availability}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {post.description}
                    </p>
                    
                    {post.skills && post.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {post.skills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Publié le {new Date(post.created_at).toLocaleDateString('fr-FR')}
                      </div>
                      
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addToFavorites(post.candidate.id)}
                        >
                          <Heart className="h-4 w-4 mr-1" />
                          Favoris
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedCandidate(post.candidate);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <User className="h-4 w-4 mr-1" />
                          Contacter
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Candidate Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Profil candidat</DialogTitle>
            <DialogDescription>
              Détails du profil de {selectedCandidate?.first_name} {selectedCandidate?.last_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Nom complet</Label>
                  <p className="text-sm">{selectedCandidate.first_name} {selectedCandidate.last_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{selectedCandidate.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Téléphone</Label>
                  <p className="text-sm">{selectedCandidate.phone || "Non renseigné"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">WhatsApp</Label>
                  <p className="text-sm">{selectedCandidate.whatsapp || "Non renseigné"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Localisation</Label>
                  <p className="text-sm">
                    {selectedCandidate.location} 
                    {selectedCandidate.commune && ` - ${selectedCandidate.commune}`}
                    {selectedCandidate.quartier && ` - ${selectedCandidate.quartier}`}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Disponibilité</Label>
                  <p className="text-sm">{selectedCandidate.availability || "Non spécifiée"}</p>
                </div>
              </div>

              {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Compétences</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedCandidate.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedCandidate.experience && (
                <div>
                  <Label className="text-sm font-medium">Expérience</Label>
                  <p className="text-sm mt-1">{selectedCandidate.experience}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => addToFavorites(selectedCandidate.id)}>
                  <Heart className="h-4 w-4 mr-1" />
                  Ajouter aux favoris
                </Button>
                <Button onClick={() => {
                  setShowDetailsDialog(false);
                  setShowRatingDialog(true);
                }}>
                  <Star className="h-4 w-4 mr-1" />
                  Évaluer ce candidat
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Évaluer le candidat</DialogTitle>
            <DialogDescription>
              Évaluez {selectedCandidate?.first_name} {selectedCandidate?.last_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="rating">Note (sur 5)</Label>
              <Select value={rating.toString()} onValueChange={(value) => setRating(parseInt(value))}>
                <SelectTrigger id="rating">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 étoile</SelectItem>
                  <SelectItem value="2">2 étoiles</SelectItem>
                  <SelectItem value="3">3 étoiles</SelectItem>
                  <SelectItem value="4">4 étoiles</SelectItem>
                  <SelectItem value="5">5 étoiles</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="comment">Commentaire (optionnel)</Label>
              <Textarea
                id="comment"
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Votre avis sur ce candidat..."
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowRatingDialog(false)}>
                Annuler
              </Button>
              <Button onClick={rateCandidate}>
                Enregistrer l'évaluation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidateDatabase;