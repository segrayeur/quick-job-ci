import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Search, MapPin, DollarSign, Briefcase, Clock, ArrowLeft, Filter, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
interface Job {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  location: string;
  category: string | null;
  created_at: string;
}
const locations = ["Tous", "Abidjan", "Cocody", "Yopougon", "Adjamé", "Marcory", "Plateau", "Treichville", "Koumassi", "Port-Bouët", "Abobo"];
const categories = ["Tous", "Déménagement", "Soutien scolaire", "Livraison", "Commerce", "Ménage", "Enseignement", "Informatique", "Santé", "Restauration", "Autres"];
const TrouverUnJob = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Tous");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [salaryRange, setSalaryRange] = useState([0]);
  const [sortBy, setSortBy] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 6;
  useEffect(() => {
    fetchJobs();
  }, []);
  const fetchJobs = async () => {
    try {
      // Use secure function to get jobs without contact information
      const { data, error } = await supabase.rpc('get_public_jobs');
      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les offres d'emploi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrage des emplois
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation === "Tous" || job.location === selectedLocation;
    const matchesCategory = selectedCategory === "Tous" || job.category === selectedCategory;
    const matchesSalary = salaryRange[0] === 0 || job.amount >= salaryRange[0] * 1000;
    return matchesSearch && matchesLocation && matchesCategory && matchesSalary;
  });

  // Tri des emplois
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case "salary":
        return b.amount - a.amount;
      case "recent":
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedJobs.length / itemsPerPage);
  const paginatedJobs = sortedJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const formatSalary = (amount: number, currency: string) => {
    return `${amount.toLocaleString()} ${currency}`;
  };
  const handleViewMore = (jobId: string) => {
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
          description: "Vous devez être connecté pour voir les détails complets du job",
          variant: "destructive"
        });
        navigate("/connexion");
        return;
      }

      // Redirect to dashboard job details
      navigate(`/dashboard?view=job&id=${jobId}`);
    };
    checkAuth();
  };
  const JobCard = ({
    job
  }: {
    job: Job;
  }) => <Card className="hover:shadow-elevated transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{job.title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {job.category || "Autre"}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary">{formatSalary(job.amount, job.currency)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {job.description}
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{new Date(job.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
          
          {job.category && <Badge variant="outline">{job.category}</Badge>}
          
          <div className="pt-2">
            <Button size="sm" className="w-full bg-gradient-primary hover:opacity-90 transition-opacity" onClick={() => handleViewMore(job.id)}>
              Voir plus d'informations
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>;
  return <div className="min-h-screen bg-background">
      <Header />
      
      {/* Header de recherche */}
      <section className="bg-gradient-hero text-white py-8">
        <div className="container mx-auto px-4 bg-orange-500">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate("/")} className="text-white bg-gray-950 hover:bg-gray-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Trouvez votre job idéal
            </h1>
            <p className="text-lg opacity-90">
              {sortedJobs.length} offres d'emploi disponibles
            </p>
          </div>
          
          {/* Barre de recherche principale */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input placeholder="Rechercher par titre, entreprise ou mot-clé..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 py-3 text-black bg-white" />
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
                <label className="text-sm font-medium mb-2 block">Catégorie</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Salaire minimum: {salaryRange[0] * 1000} FCFA
                </label>
                <Slider value={salaryRange} onValueChange={setSalaryRange} max={500} step={10} className="mt-2" />
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
                    <SelectItem value="salary">Salaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button variant="outline" onClick={() => {
            setSearchTerm("");
            setSelectedLocation("Tous");
            setSelectedCategory("Tous");
            setSalaryRange([0]);
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
              <Briefcase className="mr-2 h-5 w-5 text-primary" />
              {sortedJobs.length} emplois trouvés
            </h2>
          </div>

          {loading ? <div className="text-center py-12">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-muted-foreground animate-pulse" />
              </div>
              <p className="text-muted-foreground">Chargement des offres...</p>
            </div> : paginatedJobs.length > 0 ? <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {paginatedJobs.map(job => <JobCard key={job.id} job={job} />)}
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
                Aucun emploi trouvé
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
export default TrouverUnJob;