import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Search, MapPin, DollarSign, Briefcase, Clock, ArrowLeft, Filter, Star, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Updated interface to include is_featured
interface Job {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  location: string;
  commune?: string;
  category: string | null;
  created_at: string;
  is_featured: boolean; // Added field
}

const locations = ["Tous", "Abidjan", "Cocody", "Yopougon", "Adjamé", "Marcory", "Plateau", "Treichville", "Koumassi", "Port-Bouët", "Abobo"];
const categories = ["Tous", "Déménagement", "Soutien scolaire", "Livraison", "Commerce", "Ménage", "Enseignement", "Informatique", "Santé", "Restauration", "Autres"];

const TrouverUnJob = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Tous");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [salaryRange, setSalaryRange] = useState([0]);
  const [sortBy, setSortBy] = useState("featured"); // Default sort by featured
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      // Fetch directly from the 'jobs' table, only open jobs
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, description, amount, currency, location, commune, category, created_at, is_featured')
        .eq('status', 'open');

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
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

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation === "Tous" || job.location === selectedLocation || job.commune === selectedLocation;
    const matchesCategory = selectedCategory === "Tous" || job.category === selectedCategory;
    const matchesSalary = salaryRange[0] === 0 || job.amount >= salaryRange[0] * 1000;
    return matchesSearch && matchesLocation && matchesCategory && matchesSalary;
  });

  // Sort jobs: featured first, then by the selected criteria
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    
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
    return amount ? `${amount.toLocaleString()} ${currency}`: 'Non spécifié';
  };

  const handleViewMore = (jobId: string) => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Connexion requise",
          description: "Créez un compte ou connectez-vous pour voir les détails de l'offre.",
          variant: "destructive"
        });
        navigate("/auth");
        return;
      }
      navigate(`/dashboard?view=job&id=${jobId}`);
    };
    checkAuth();
  };

  // Updated JobCard to show featured status
  const JobCard = ({ job }: { job: Job }) => (
    <Card className={`hover:shadow-lg transition-all duration-300 ${job.is_featured ? 'border-primary border-2 shadow-primary/20' : ''}`}>
       {job.is_featured && (
        <div className="absolute top-3 right-3 bg-primary text-primary-foreground p-1.5 rounded-full z-10">
          <Crown className="w-5 h-5" />
        </div>
      )}
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1 pr-10">{job.title}</CardTitle>
             <CardDescription className="text-sm text-muted-foreground flex items-center">
                <MapPin className="h-4 w-4 mr-1.5" /> {job.location}{job.commune ? `, ${job.commune}` : ''}
            </CardDescription>
          </div>
          <div className="text-right pl-2">
            <p className="text-lg font-bold text-primary">{formatSalary(job.amount, job.currency)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {job.description}
        </p>
        
        <div className="flex flex-wrap items-center gap-2 mb-4">
            {job.category && <Badge variant="secondary">{job.category}</Badge>}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-1 ">
              <Clock className="h-4 w-4" />
              <span>Publié le {new Date(job.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
        </div>
          
        <div className="pt-4">
          <Button size="sm" className="w-full font-semibold" onClick={() => handleViewMore(job.id)}>
            Consulter l'offre
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <section className="bg-orange-500 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
              Découvrez votre prochain Job
            </h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Parcourez des dizaines d'offres et trouvez celle qui vous correspond parfaitement.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto bg-white/10 p-4 rounded-lg">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input placeholder="Rechercher un poste, un mot-clé..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 py-3 h-12 text-black bg-white w-full" />
              </div>
              <Button onClick={() => setShowFilters(!showFilters)} size="lg" variant="secondary" className="shrink-0">
                <Filter className="h-5 w-5 md:mr-2" />
                <span className="hidden md:inline">Filtres</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {showFilters && (
        <section className="bg-white border-b py-6">
          <div className="container mx-auto px-4">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Localisation</label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {locations.map(location => <SelectItem key={location} value={location}>{location}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Catégorie</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(category => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Salaire minimum : {salaryRange[0] * 1000} FCFA
                </label>
                <Slider value={salaryRange} onValueChange={setSalaryRange} max={500} step={10} />
              </div>
            </div>
          </div>
        </section>
      )}

      <main className="py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl font-bold flex items-center">
              <Briefcase className="mr-3 h-6 w-6 text-primary" />
              {sortedJobs.length} offres disponibles
            </h2>
             <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Trier par:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Mises en avant</SelectItem>
                    <SelectItem value="recent">Plus récent</SelectItem>
                    <SelectItem value="salary">Salaire (élevé)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
                <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-primary" role="status"></div>
                <p className="text-muted-foreground mt-4">Chargement des opportunités...</p>
            </div>
           ) : paginatedJobs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 mb-8">
                {paginatedJobs.map(job => <JobCard key={job.id} job={job} />)}
              </div>
              
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2">
                  <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Précédent</Button>
                   <span className="text-sm font-medium">Page {currentPage} sur {totalPages}</span>
                  <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Suivant</Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-gray-100 rounded-lg">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucune offre ne correspond à vos critères</h3>
              <p className="text-muted-foreground mb-6">
                Essayez d'élargir votre recherche ou de supprimer certains filtres.
              </p>
              <Button onClick={() => { setSearchTerm(""); setSelectedLocation("Tous"); setSelectedCategory("Tous"); setSalaryRange([0]); }}>Réinitialiser les filtres</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TrouverUnJob;
