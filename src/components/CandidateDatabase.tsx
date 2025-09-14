// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LocationFilter from "@/components/LocationFilter"; // Corrected import
import CandidateCard from "@/components/CandidateCard"; // Corrected import
import { 
  Search, Filter, MapPin, Phone, MessageCircle, User, Star, Eye, Users, Award, Clock, Download
} from "lucide-react";

const CandidateDatabase = ({ userProfile }) => {
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    searchTerm: '',
    location: 'Tous', // Simplified location filter
    skills: 'all',
    availability: 'all',
  });
  const [selectedPost, setSelectedPost] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCandidatePosts();
  }, []);

  const fetchCandidatePosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('candidate_posts')
        .select('*, users(first_name, last_name, phone)');
      if (error) throw error;
      setAllPosts(data || []);
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de charger les profils des candidats.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const uniqueSkills = useMemo(() => {
    const skills = allPosts.flatMap(p => p.skills || []);
    return [...new Set(skills)];
  }, [allPosts]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredPosts = useMemo(() => {
    return allPosts.filter(post => {
      const { searchTerm, location, skills, availability } = filters;
      
      if (searchTerm && !post.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (location !== 'Tous' && post.location !== location) return false; // Simplified logic
      if (skills !== 'all' && !post.skills?.includes(skills)) return false;
      if (availability !== 'all' && post.availability !== availability) return false;

      return true;
    });
  }, [allPosts, filters]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Filter className="h-5 w-5 mr-2" />Recherche de profils candidats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-b pb-4">
             <Input 
                placeholder="Rechercher par titre de profil..."
                value={filters.searchTerm}
                onChange={e => handleFilterChange('searchTerm', e.target.value)}
              />
            <LocationFilter 
              selectedLocation={filters.location} 
              onLocationChange={newLoc => handleFilterChange('location', newLoc)}
            />
             <Select value={filters.skills} onValueChange={val => handleFilterChange('skills', val)}>
                <SelectTrigger><SelectValue placeholder="Compétence" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {uniqueSkills.map(skill => <SelectItem key={skill} value={skill}>{skill}</SelectItem>)}
                </SelectContent>
              </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p>Chargement des profils...</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPosts.map((post) => (
            <CandidateCard key={post.id} candidate={post} onViewMore={() => setSelectedPost(post)} />
          ))}
        </div>
      )}

      {/* ... (Dialog pour voir les détails) ... */}

    </div>
  );
};

export default CandidateDatabase;
