import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, ArrowLeft, Filter, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import CandidateCard from "@/components/CandidateCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
interface CandidatePost {
  id: string;
  title: string;
  description: string;
  hourly_rate: number;
  currency: string;
  location: string;
  skills: string[];
  availability: string;
  created_at: string;
  candidate_id: string;
  users?: {
    first_name: string;
    last_name: string;
    phone: string;
  } | null;
}
const locations = ["Tous", "Abidjan", "Cocody", "Yopougon", "Adjamé", "Marcory", "Plateau", "Treichville", "Koumassi", "Port-Bouët", "Abobo"];
const availabilityOptions = ["Tous", "Immédiatement", "Dans la semaine", "Dans le mois", "Flexible"];
const TrouverUnCandidat = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Tous");
  const [selectedAvailability, setSelectedAvailability] = useState("Tous");
  const [rateRange, setRateRange] = useState([0]);
  const [sortBy, setSortBy] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [candidates, setCandidates] = useState<CandidatePost[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 6;
  useEffect(() => {
    fetchCandidates();
  }, []);
  const fetchCandidates = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('candidate_posts').select('*').eq('status', 'active').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setCandidates(data || []);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les candidats",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrage des candidats
  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.title.toLowerCase().includes(searchTerm.toLowerCase()) || candidate.description.toLowerCase().includes(searchTerm.toLowerCase()) || candidate.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLocation = selectedLocation === "Tous" || candidate.location === selectedLocation;
    const matchesAvailability = selectedAvailability === "Tous" || candidate.availability === selectedAvailability;
    const matchesRate = rateRange[0] === 0 || candidate.hourly_rate >= rateRange[0] * 1000;
    return matchesSearch && matchesLocation && matchesAvailability && matchesRate;
  });

  // Tri des candidats
  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    switch (sortBy) {
      case "rate":
        return b.hourly_rate - a.hourly_rate;
      case "recent":
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedCandidates.length / itemsPerPage);
  const paginatedCandidates = sortedCandidates.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const handleViewMore = (candidateId: string) => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Connexion requise",
          description: "Vous devez être connecté pour voir le profil complet du candidat",
          variant: "destructive"
        });
        navigate("/connexion");
        return;
      }

      // Redirect to dashboard candidate profile view
      navigate(`/dashboard?view=candidate&id=${candidateId}`);
    };
    checkAuth();
  };
  return <div className="min-h-screen bg-background">
      <Header />
      
      {/* Header de recherche */}
      <section className="bg-gradient-hero text-white py-8 bg-green-600">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate("/")} className="text-white bg-zinc-950 hover:bg-zinc-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Trouvez le candidat idéal
            </h1>
            <p className="text-lg opacity-90">
              {sortedCandidates.length} candidats actifs disponibles
            </p>
          </div>
          
          {/* Barre de recherche principale */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input placeholder="Rechercher par compétence, titre ou mot-clé..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 py-3 text-black bg-white" />
              </div>
              <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="bg-white text-primary hover:bg-white/90">
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Filtres */}
      {showFilters && <section className="bg-accent/30 py-6 border-b">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Localisation</label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(location => <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Disponibilité</label>
                <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availabilityOptions.map(availability => <SelectItem key={availability} value={availability}>
                        {availability}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Tarif minimum: {rateRange[0] * 1000} FCFA/h
                </label>
                <Slider value={rateRange} onValueChange={setRateRange} max={100} step={5} className="mt-2" />
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-6">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">Trier par:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Plus récent</SelectItem>
                    <SelectItem value="rate">Tarif horaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button variant="outline" onClick={() => {
            setSearchTerm("");
            setSelectedLocation("Tous");
            setSelectedAvailability("Tous");
            setRateRange([0]);
            setCurrentPage(1);
          }}>
                Réinitialiser
              </Button>
            </div>
          </div>
        </section>}

      {/* Résultats */}
      <main className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <Users className="mr-2 h-5 w-5 text-primary" />
              {sortedCandidates.length} candidats trouvés
            </h2>
          </div>

          {loading ? <div className="text-center py-12">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-muted-foreground animate-pulse" />
              </div>
              <p className="text-muted-foreground">Chargement des candidats...</p>
            </div> : paginatedCandidates.length > 0 ? <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {paginatedCandidates.map(candidate => <CandidateCard key={candidate.id} candidate={candidate} onViewMore={() => handleViewMore(candidate.id)} />)}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && <div className="flex justify-center space-x-2">
                  <Button variant="outline" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                    Précédent
                  </Button>
                  
                  {[...Array(totalPages)].map((_, i) => <Button key={i + 1} variant={currentPage === i + 1 ? "default" : "outline"} onClick={() => setCurrentPage(i + 1)}>
                      {i + 1}
                    </Button>)}
                  
                  <Button variant="outline" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
                    Suivant
                  </Button>
                </div>}
            </> : <div className="text-center py-12">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                Aucun candidat trouvé
              </h3>
              <p className="text-muted-foreground mb-4">
                Essayez de modifier vos critères de recherche
              </p>
              <Button onClick={() => navigate("/")}>
                Retour à l'accueil
              </Button>
            </div>}
        </div>
      </main>
    </div>;
};
export default TrouverUnCandidat;