import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const AdminSubscriptionsManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id, created_at, plan, status,
          users ( id, first_name, last_name, email )
        `);
      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Basic CSV export logic
    const headers = ['ID', 'Utilisateur', 'Email', 'Plan', 'Statut', 'Date'];
    const rows = subscriptions.map(sub => 
      [sub.id, `${sub.users.first_name} ${sub.users.last_name}`, sub.users.email, sub.plan, sub.status, new Date(sub.created_at).toLocaleDateString()].join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'subscriptions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Exportation réussie', description: 'Le fichier CSV a été téléchargé.' });
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const search = searchTerm.toLowerCase();
    const userName = `${sub.users?.first_name} ${sub.users?.last_name}`.toLowerCase();
    const userEmail = sub.users?.email.toLowerCase();
    return userName.includes(search) || userEmail.includes(search);
  });

  if (loading) {
    return <div>Chargement des abonnements...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Abonnements & Paiements</h2>
        <Button onClick={handleExport}><Download className="mr-2 h-4 w-4"/> Exporter en CSV</Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Rechercher par utilisateur ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date de souscription</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSubscriptions.map((sub) => (
            <TableRow key={sub.id}>
              <TableCell>{sub.users.first_name} {sub.users.last_name}</TableCell>
              <TableCell>{sub.users.email}</TableCell>
              <TableCell><Badge variant="outline">{sub.plan}</Badge></TableCell>
              <TableCell><Badge variant={sub.status === 'active' ? 'success' : 'secondary'}>{sub.status}</Badge></TableCell>
              <TableCell>{new Date(sub.created_at).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminSubscriptionsManagement;
