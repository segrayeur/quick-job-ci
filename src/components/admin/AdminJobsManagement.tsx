import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const AdminJobsManagement = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      // Fetch jobs with recruiter's name
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id, title, created_at, status, is_featured,
          users ( company_name )
        `);
      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (jobId: string, action: string) => {
    toast({ title: `Action: ${action}`, description: `Job ID: ${jobId}` });
    // Add logic for actions like featuring or deleting a job
    fetchJobs(); // Refresh list after action
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (job.users && job.users.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div>Chargement des offres...</div>;
  }

  return (
    <div className="space-y-4">
        <h2 className="text-2xl font-bold">Gestion des Offres d'Emploi</h2>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Rechercher par titre ou entreprise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
        </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titre</TableHead>
            <TableHead>Entreprise</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date de publication</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredJobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell>{job.title}</TableCell>
              <TableCell>{job.users ? job.users.company_name : 'N/A'}</TableCell>
              <TableCell><Badge variant={job.status === 'open' ? 'success' : 'secondary'}>{job.status}</Badge></TableCell>
              <TableCell>{new Date(job.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleAction(job.id, 'toggle_feature')}>{job.is_featured ? 'Ne plus mettre en avant' : 'Mettre en avant'}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction(job.id, 'toggle_status')}>{job.status === 'open' ? 'Fermer' : 'Ouvrir'}</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => handleAction(job.id, 'delete')}>Supprimer</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminJobsManagement;
