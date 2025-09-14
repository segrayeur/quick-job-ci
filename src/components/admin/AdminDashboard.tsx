import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, FileText, CreditCard, BarChart } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, recruiters: 0, candidates: 0, jobs: 0, applications: 0, subscriptions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      setLoading(true);
      try {
        // Note: these should be done with RPC functions for performance and security in a real app
        const { count: users } = await supabase.from('users').select('id', { count: 'exact', head: true });
        const { count: recruiters } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'recruiter');
        const { count: candidates } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'candidate');
        const { count: jobs } = await supabase.from('jobs').select('id', { count: 'exact', head: true });
        const { count: applications } = await supabase.from('applications').select('id', { count: 'exact', head: true });
        const { count: subscriptions } = await supabase.from('users').select('id', { count: 'exact', head: true }).neq('subscription_plan', 'free');
        
        setStats({ 
          users: users ?? 0,
          recruiters: recruiters ?? 0,
          candidates: candidates ?? 0,
          jobs: jobs ?? 0,
          applications: applications ?? 0,
          subscriptions: subscriptions ?? 0
        });

      } catch (error: any) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, description }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div>Chargement des statistiques...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Vue d'ensemble de la plateforme</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Utilisateurs Total" value={stats.users} icon={Users} description="Nombre total d'inscrits" />
        <StatCard title="Recruteurs" value={stats.recruiters} icon={Users} description="Utilisateurs avec le rôle recruteur" />
        <StatCard title="Candidats" value={stats.candidates} icon={Users} description="Utilisateurs avec le rôle candidat" />
        <StatCard title="Offres d'emploi" value={stats.jobs} icon={Briefcase} description="Total des offres créées" />
        <StatCard title="Candidatures" value={stats.applications} icon={FileText} description="Total des candidatures soumises" />
        <StatCard title="Abonnements Actifs" value={stats.subscriptions} icon={CreditCard} description="Nombre d'abonnements payants" />
      </div>
    </div>
  );
};

export default AdminDashboard;
