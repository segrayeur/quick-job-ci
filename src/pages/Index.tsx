import { useState, useEffect } from "react";
import Header from "@/components/Header";
import JobCard from "@/components/JobCard";
import LocationFilter from "@/components/LocationFilter";
import ChatBot from "@/components/ChatBot";
import FloatingBubbles from "@/components/FloatingBubbles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Briefcase, TrendingUp, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
const Index = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [selectedLocation, setSelectedLocation] = useState("Tous");
  const [searchTerm, setSearchTerm] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalUsers: 0,
    totalDistricts: 11
  });
  useEffect(() => {
    fetchRecentJobs();
    fetchStats();
  }, []);
  const fetchRecentJobs = async () => {
    try {
      const { data, error } = await supabase.rpc('get_public_jobs');
      if (error) throw error;
      setJobs((data as any) || []);
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
  const fetchStats = async () => {
    try {
      const [
        { data: jobsData, error: jobsError },
        { count: usersCount }
      ] = await Promise.all([
        supabase.rpc('get_public_jobs'),
        supabase.from('users').select('*', { count: 'exact', head: true })
      ]);

      if (jobsError) throw jobsError;

      setStats({
        totalJobs: (jobsData as any)?.length || 0,
        totalUsers: usersCount || 0,
        totalDistricts: 11
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  const formatJobForDisplay = (job: Job) => ({
    id: job.id,
    title: job.title,
    description: job.description,
    amount: `${job.amount.toLocaleString()} ${job.currency}`,
    location: job.location,
    timePosted: new Date(job.created_at).toLocaleDateString('fr-FR'),
    category: job.category || 'Autre'
  });
  const filteredJobs = jobs.filter(job => {
    const matchesLocation = selectedLocation === "Tous" || job.location === selectedLocation;
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || job.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLocation && matchesSearch;
  }).map(formatJobForDisplay);
  const handlePublishClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour publier un job",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }
    navigate("/dashboard?tab=jobs");
  };
  return <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-hero text-white py-12 md:py-16 bg-orange-500">
        <div className="container mx-auto px-4 text-center bg-orange-500">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 text-green-900">QuickJob CI</h1>
          <p className="text-lg md:text-xl mb-8 opacity-90">La plateforme qui connecte les jeunes aux opportunités de petits boulots et d'emplois rapides</p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Button size="lg" className="flex-1 bg-white text-primary hover:bg-white/90 transition-colors" onClick={() => navigate("/trouver-un-job")}>
              <Briefcase className="mr-2 h-5 w-5" />
              Trouver un job
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/trouver-un-candidat")} className="flex-1 border-white transition-colors">
              <Users className="mr-2 h-5 w-5" />
              Trouver un candidat
            </Button>
            <Button size="lg" variant="outline" onClick={handlePublishClick} className="flex-1 border-white">
              <TrendingUp className="mr-2 h-5 w-5" />
              Publier un job
            </Button>
          </div>
          
          {/* Call-to-action pour nouveaux utilisateurs */}
          <div className="mt-6 text-center">
            <p className="opacity-90 mb-4">
              Nouveau sur QuickJob CI ?
            </p>
            <Button size="lg" variant="secondary" onClick={() => navigate("/connexion")}>
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
              <div className="text-2xl md:text-3xl font-bold text-primary">{stats.totalJobs}+</div>
              <div className="text-sm text-muted-foreground">Jobs publiés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary">{stats.totalUsers}+</div>
              <div className="text-sm text-muted-foreground">Utilisateurs inscrits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary">24h</div>
              <div className="text-sm text-muted-foreground">Réponse moyenne</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary">{stats.totalDistricts}</div>
              <div className="text-sm text-muted-foreground">Quartiers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="py-6 bg-accent/20 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-opacity" onClick={() => navigate("/trouver-un-job")}>
              <Search className="mr-2 h-5 w-5" />
              Rechercher un emploi
            </Button>
            <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-opacity" onClick={() => navigate("/trouver-un-candidat")}>
              <Users className="mr-2 h-5 w-5" />
              Trouver un candidat
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              <Users className="mr-2 h-5 w-5" />
              Créer mon compte
            </Button>
            <Button size="lg" variant="secondary" onClick={handlePublishClick}>
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
            <Input placeholder="Rechercher un job..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </div>
      </section>

      <LocationFilter selectedLocation={selectedLocation} onLocationChange={setSelectedLocation} />

      {/* Jobs List */}
      <main className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground flex items-center">
              <Briefcase className="mr-2 h-5 w-5 text-primary" />
              Jobs disponibles ({filteredJobs.length})
            </h2>
          </div>

          {loading ? <div className="text-center py-12">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-muted-foreground animate-pulse" />
              </div>
              <p className="text-muted-foreground">Chargement des offres...</p>
            </div> : filteredJobs.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map(job => <JobCard key={job.id} {...job} onViewMore={async () => {
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
              navigate("/auth");
              return;
            }
            navigate(`/dashboard?view=job&id=${job.id}`);
          }} />)}
            </div> : <div className="text-center py-12">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm || selectedLocation !== "Tous" ? "Aucun job trouvé" : "Aucune offre disponible"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedLocation !== "Tous" ? "Essayez de modifier vos filtres ou publier une nouvelle offre" : "Soyez le premier à publier une offre sur QuickJob CI"}
              </p>
              <Button onClick={handlePublishClick}>
                Publier un job
              </Button>
            </div>}
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
            <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-opacity" onClick={handlePublishClick}>
              <Users className="mr-2 h-5 w-5" />
              Commencer maintenant
            </Button>
          </div>
        </div>
      </section>
      
      <FloatingBubbles />
      <ChatBot />
    </div>;
};
export default Index;