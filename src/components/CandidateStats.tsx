import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart, CheckCircle, Clock, XCircle } from 'lucide-react';

const subscriptionLimits = {
  free: 15,
  standard: 45,
  pro: 100
};

const CandidateStats = ({ userProfile }) => {
  const [stats, setStats] = useState({ applications: 0, accepted: 0, pending: 0, refused: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.id) {
      fetchStats();
    }
  }, [userProfile]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data, error, count } = await supabase
        .from('applications')
        .select('status', { count: 'exact' })
        .eq('candidate_id', userProfile.id);

      if (error) throw error;

      const accepted = data.filter(app => app.status === 'accepted').length;
      const pending = data.filter(app => app.status === 'pending').length;
      const refused = data.filter(app => app.status === 'refused').length;

      setStats({ applications: count ?? 0, accepted, pending, refused });
    } catch (err: any) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const plan = userProfile.subscription_plan || 'free';
  const limit = subscriptionLimits[plan];
  const applicationsSent = stats.applications;
  const remainingApplications = Math.max(0, limit - applicationsSent);
  const progress = (applicationsSent / limit) * 100;

  if (loading) {
    return <p>Chargement des statistiques...</p>;
  }

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Votre Activité ce Mois-ci</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Vous avez utilisé {applicationsSent} sur {limit} candidatures disponibles avec votre plan {plan}.
                    </p>
                    <Progress value={progress} className="w-full" />
                    <p className="text-right font-bold text-primary">{remainingApplications} candidatures restantes</p>
                </div>
            </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Candidatures Acceptées</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.accepted}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Candidatures en Attente</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.pending}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Candidatures Refusées</CardTitle>
                    <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.refused}</div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
};

export default CandidateStats;
