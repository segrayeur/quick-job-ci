import { useState } from "react";
import Header from "@/components/Header";
import JobCard from "@/components/JobCard";
import LocationFilter from "@/components/LocationFilter";
import ChatBot from "@/components/ChatBot";
import FloatingBubbles from "@/components/FloatingBubbles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Briefcase, TrendingUp, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock data pour le MVP
const mockJobs = [
  {
    id: 1,
    title: "Aide pour déménagement urgent",
    description: "Recherche 2 personnes pour aider au déménagement d'un appartement 2 pièces. Travail physique, bonne condition physique requise. Matériel fourni.",
    amount: "25 000 FCFA",
    location: "Cocody",
    timePosted: "Il y a 2h",
    rating: 4.8,
    category: "Déménagement"
  },
  {
    id: 2,
    title: "Cours particuliers de mathématiques",
    description: "Besoin d'un étudiant en maths pour donner des cours de soutien à mon fils en classe de 3ème. 2 séances par semaine, niveau collège.",
    amount: "15 000 FCFA/mois",
    location: "Yopougon",
    timePosted: "Il y a 4h",
    rating: 4.5,
    category: "Soutien scolaire"
  },
  {
    id: 3,
    title: "Livraison de colis dans Abidjan",
    description: "Recherche livreur avec moto pour distribuer des colis dans différents quartiers d'Abidjan. Planning flexible, paiement par livraison.",
    amount: "1 500 FCFA/colis",
    location: "Adjamé",
    timePosted: "Il y a 6h",
    rating: 4.2,
    category: "Livraison"
  },
  {
    id: 4,
    title: "Mise en rayon supermarché",
    description: "Supermarché recherche aide pour mise en rayon des produits alimentaires. Travail de nuit, bon salaire. Formation assurée sur place.",
    amount: "20 000 FCFA",
    location: "Marcory",
    timePosted: "Il y a 1j",
    category: "Mise en rayon"
  },
  {
    id: 5,
    title: "Nettoyage bureau - weekend",
    description: "Entreprise recherche personne pour nettoyage bureau tous les weekends. Matériel de nettoyage fourni. Travail régulier.",
    amount: "30 000 FCFA/mois",
    location: "Plateau",
    timePosted: "Il y a 1j",
    category: "Ménage"
  }
];

const Index = () => {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState("Tous");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredJobs = mockJobs.filter(job => {
    const matchesLocation = selectedLocation === "Tous" || job.location === selectedLocation;
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLocation && matchesSearch;
  });

  const handlePublishClick = () => {
    navigate("/publish");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-hero text-white py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Trouvez un job en Côte d'Ivoire
          </h1>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            La plateforme qui connecte les jeunes aux opportunités de petits boulots
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Button 
              size="lg" 
              className="flex-1 bg-white text-primary hover:bg-white/90 transition-colors"
              onClick={() => navigate("/trouver-un-job")}
            >
              <Briefcase className="mr-2 h-5 w-5" />
              Trouver un job
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="flex-1 border-white text-white hover:bg-white hover:text-primary transition-colors"
              onClick={handlePublishClick}
            >
              <TrendingUp className="mr-2 h-5 w-5" />
              Publier un job
            </Button>
          </div>
          
          {/* Call-to-action pour nouveaux utilisateurs */}
          <div className="mt-6 text-center">
            <p className="text-white/80 mb-4">
              Nouveau sur QuickJob CI ?
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate("/inscription")}
              className="bg-white/10 text-white border border-white/20 hover:bg-white/20"
            >
              <Users className="mr-2 h-5 w-5" />
              Créer un compte gratuit
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 bg-accent/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary">150+</div>
              <div className="text-sm text-muted-foreground">Jobs publiés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary">80+</div>
              <div className="text-sm text-muted-foreground">Jeunes inscrits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary">95%</div>
              <div className="text-sm text-muted-foreground">Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary">11</div>
              <div className="text-sm text-muted-foreground">Quartiers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="py-6 bg-accent/20 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:opacity-90 transition-opacity"
              onClick={() => navigate("/trouver-un-job")}
            >
              <Search className="mr-2 h-5 w-5" />
              Rechercher un emploi
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/inscription")}
            >
              <Users className="mr-2 h-5 w-5" />
              Créer mon compte
            </Button>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={handlePublishClick}
            >
              <Briefcase className="mr-2 h-5 w-5" />
              Publier une offre
            </Button>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-6 border-b" id="jobs-section">
        <div className="container mx-auto px-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un job..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </section>

      <LocationFilter 
        selectedLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
      />

      {/* Jobs List */}
      <main className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground flex items-center">
              <Briefcase className="mr-2 h-5 w-5 text-primary" />
              Jobs disponibles ({filteredJobs.length})
            </h2>
          </div>

          {filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <JobCard key={job.id} {...job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Aucun job trouvé
              </h3>
              <p className="text-muted-foreground mb-4">
                Essayez de modifier vos filtres ou publier une nouvelle offre
              </p>
              <Button onClick={handlePublishClick}>
                Publier un job
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* CTA Section */}
      <section className="bg-gradient-card py-12 border-t">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Vous avez un job à proposer ?
            </h2>
            <p className="text-muted-foreground mb-6">
              Publiez votre offre gratuitement et trouvez des candidats motivés en quelques minutes
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:opacity-90 transition-opacity"
              onClick={handlePublishClick}
            >
              <Users className="mr-2 h-5 w-5" />
              Commencer maintenant
            </Button>
          </div>
        </div>
      </section>
      
      <FloatingBubbles />
      <ChatBot />
    </div>
  );
};

export default Index;