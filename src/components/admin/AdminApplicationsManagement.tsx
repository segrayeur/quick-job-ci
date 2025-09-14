import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const AdminApplicationsManagement = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id, created_at, status,
          users ( id, first_name, last_name ),
          jobs ( id, title, users ( id, company_name ) )
        `);
      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => {
      const search = searchTerm.toLowerCase();
      const candidateName = `${app.users?.first_name} ${app.users?.last_name}`.toLowerCase();
      const jobTitle = app.jobs?.title.toLowerCase();
      const companyName = app.jobs?.users?.company_name.toLowerCase();
      return candidateName.includes(search) || jobTitle.includes(search) || companyName.includes(search);
  });

  if (loading) {
    return <div>Chargement des candidatures...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Toutes les Candidatures</h2>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Rechercher par candidat, poste, ou entreprise..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Candidat</TableHead>
            <TableHead>Poste</TableHead>
            <TableHead>Entreprise</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredApplications.map((app) => (
            <TableRow key={app.id}>
              <TableCell>{app.users.first_name} {app.users.last_name}</TableCell>
              <TableCell>{app.jobs.title}</TableCell>
              <TableCell>{app.jobs.users.company_name}</TableCell>
              <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
              <TableCell><Badge>{app.status}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminApplicationsManagement;
