import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Briefcase, 
  Clock,
  ArrowLeft,
  Filter,
  Star,
  Phone,
  MessageCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";

// Mock data étendue pour la recherche
const mockJobsExtended = [
  {
    id: 1,
    title: "Aide pour déménagement urgent",
    description: "Recherche 2 personnes pour aider au déménagement d'un appartement 2 pièces. Travail physique, bonne condition physique requise. Matériel fourni.",
    company: "Particulier",
    salary_min: 20000,
    salary_max: 30000,
    location: "Cocody",
    category: "Déménagement",
    type: "temps plein",
    timePosted: "Il y a 2h",
    rating: 4.8,
    contactPhone: "+225 01 02 03 04",
    contactWhatsapp: "+225 01 02 03 04"
  },
  {
    id: 2,
    title: "Cours particuliers de mathématiques",
    description: "Besoin d'un étudiant en maths pour donner des cours de soutien à mon fils en classe de 3ème. 2 séances par semaine, niveau collège.",
    company: "Famille Kouassi",
    salary_min: 15000,
    salary_max: 20000,
    location: "Yopougon",
    category: "Soutien scolaire",
    type: "temps partiel",
    timePosted: "Il y a 4h",
    rating: 4.5,
    contactPhone: "+225 05 06 07 08",
    contactWhatsapp: "+225 05 06 07 08"
  },
  {
    id: 3,
    title: "Livreur avec moto",
    description: "Recherche livreur avec moto pour distribuer des colis dans différents quartiers d'Abidjan. Planning flexible, paiement par livraison.",
    company: "Express Delivery CI",
    salary_min: 80000,
    salary_max: 120000,
    location: "Adjamé",
    category: "Livraison",
    type: "freelance",
    timePosted: "Il y a 6h",
    rating: 4.2,
    contactPhone: "+225 09 10 11 12",
    contactWhatsapp: "+225 09 10 11 12"
  },
  {
    id: 4,
    title: "Agent de mise en rayon",
    description: "Supermarché recherche aide pour mise en rayon des produits alimentaires. Travail de nuit, bon salaire. Formation assurée sur place.",
    company: "SuperMarché Prestige",
    salary_min: 150000,
    salary_max: 180000,
    location: "Marcory",
    category: "Commerce",
    type: "temps plein",
    timePosted: "Il y a 1j",
    rating: 4.0,
    contactPhone: "+225 13 14 15 16",
    contactWhatsapp: "+225 13 14 15 16"
  },
  {
    id: 5,
    title: "Agent de nettoyage bureau",
    description: "Entreprise recherche personne pour nettoyage bureau tous les weekends. Matériel de nettoyage fourni. Travail régulier.",
    company: "Cleaning Pro CI",
    salary_min: 60000,
    salary_max: 80000,
    location: "Plateau",
    category: "Ménage",
    type: "temps partiel",
    timePosted: "Il y a 1j",
    rating: 4.3,
    contactPhone: "+225 17 18 19 20",
    contactWhatsapp: "+225 17 18 19 20"
  },
  {
    id: 6,
    title: "Professeur d'anglais",
    description: "Centre de formation recherche professeur d'anglais expérimenté pour cours du soir. Niveau débutant à intermédiaire.",
    company: "English Academy",
    salary_min: 200000,
    salary_max: 300000,
    location: "Cocody",
    category: "Enseignement",
    type: "temps partiel",
    timePosted: "Il y a 2j",
    rating: 4.7,
    contactPhone: "+225 21 22 23 24",
    contactWhatsapp: "+225 21 22 23 24"
  }
];

const locations = [
  "Tous", "Abidjan", "Cocody", "Yopougon", "Adjamé", "Marcory", 
  "Plateau", "Treichville", "Koumassi", "Port-Bouët", "Abobo"
];

const categories = [
  "Tous", "Déménagement", "Soutien scolaire", "Livraison", "Commerce", 
  "Ménage", "Enseignement", "Informatique", "Santé", "Restauration", "Autres"
];

const jobTypes = [
  "Tous", "temps plein", "temps partiel", "freelance"
];

const TrouverUnJob = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Tous");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [selectedJobType, setSelectedJobType] = useState("Tous");
  const [salaryRange, setSalaryRange] = useState([0]);
  const [sortBy, setSortBy] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filtrage des emplois
  const filteredJobs = mockJobsExtended.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation === "Tous" || job.location === selectedLocation;
    const matchesCategory = selectedCategory === "Tous" || job.category === selectedCategory;
    const matchesJobType = selectedJobType === "Tous" || job.type === selectedJobType;
    const matchesSalary = salaryRange[0] === 0 || job.salary_min >= salaryRange[0] * 1000;
    
    return matchesSearch && matchesLocation && matchesCategory && matchesJobType && matchesSalary;
  });

  // Tri des emplois
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case "salary":
        return b.salary_max - a.salary_max;
      case "rating":
        return b.rating - a.rating;
      case "recent":
      default:
        return a.id - b.id; // Plus récent en premier (par ID)
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedJobs.length / itemsPerPage);
  const paginatedJobs = sortedJobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatSalary = (min: number, max: number) => {
    return `${min.toLocaleString()} - ${max.toLocaleString()} FCFA`;
  };

  const JobCard = ({ job }: { job: typeof mockJobsExtended[0] }) => (
    <Card className="hover:shadow-elevated transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{job.title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {job.company}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-1 text-sm">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{job.rating}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {job.description}
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 text-sm">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-semibold text-primary">
                {formatSalary(job.salary_min, job.salary_max)}
              </span>
            </div>
            <Badge variant="secondary">{job.type}</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{job.timePosted}</span>
            </div>
          </div>
          
          <Badge variant="outline">{job.category}</Badge>
          
          <div className="flex space-x-2 pt-2">
            <Button size="sm" className="flex-1">
              <Phone className="h-4 w-4 mr-1" />
              Appeler
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <MessageCircle className="h-4 w-4 mr-1" />
              WhatsApp
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Header de recherche */}
      <section className="bg-gradient-hero text-white py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="text-white hover:bg-white/10"
            >
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
                <Input
                  placeholder="Rechercher par titre, entreprise ou mot-clé..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 py-3 text-black bg-white"
                />
              </div>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="bg-white text-primary hover:bg-white/90"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Filtres */}
      {showFilters && (
        <section className="bg-accent/30 py-6 border-b">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Localisation</label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
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
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Type d'emploi</label>
                <Select value={selectedJobType} onValueChange={setSelectedJobType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Salaire minimum: {salaryRange[0] * 1000} FCFA
                </label>
                <Slider
                  value={salaryRange}
                  onValueChange={setSalaryRange}
                  max={500}
                  step={10}
                  className="mt-2"
                />
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
                    <SelectItem value="rating">Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedLocation("Tous");
                  setSelectedCategory("Tous");
                  setSelectedJobType("Tous");
                  setSalaryRange([0]);
                  setCurrentPage(1);
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Résultats */}
      <main className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <Briefcase className="mr-2 h-5 w-5 text-primary" />
              {sortedJobs.length} emplois trouvés
            </h2>
          </div>

          {paginatedJobs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {paginatedJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Précédent
                  </Button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <Button
                      key={i + 1}
                      variant={currentPage === i + 1 ? "default" : "outline"}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
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
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TrouverUnJob;