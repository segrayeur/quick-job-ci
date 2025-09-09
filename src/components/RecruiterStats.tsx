import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  Briefcase, 
  Users, 
  TrendingUp, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  MessageSquare,
  Calendar
} from "lucide-react";

interface StatsData {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  totalViews: number;
  averageApplicationsPerJob: number;
  recentJobs: any[];
  topPerformingJobs: any[];
}

interface UserProfile {
  id: string;
  role: string;
}

interface RecruiterStatsProps {
  userProfile: UserProfile;
}

const RecruiterStats = ({ userProfile }: RecruiterStatsProps) => {
  const [stats, setStats] = useState<StatsData>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
    totalViews: 0,
    averageApplicationsPerJob: 0,
    recentJobs: [],
    topPerformingJobs: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch jobs statistics
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('recruiter_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      // Fetch applications statistics
      const { data: applications, error: appsError } = await supabase
        .from('applications')
        .select(`
          *,
          job:jobs(*)
        `)
        .eq('job.recruiter_id', userProfile.id);

      if (appsError) throw appsError;

      // Calculate statistics
      const totalJobs = jobs?.length || 0;
      const activeJobs = jobs?.filter(job => job.status === 'open').length || 0;
      const totalApplications = applications?.length || 0;
      const pendingApplications = applications?.filter(app => app.status === 'pending').length || 0;
      const acceptedApplications = applications?.filter(app => app.status === 'accepted').length || 0;
      const rejectedApplications = applications?.filter(app => app.status === 'rejected').length || 0;
      const totalViews = jobs?.reduce((sum, job) => sum + (job.views_count || 0), 0) || 0;
      const averageApplicationsPerJob = totalJobs > 0 ? Math.round((totalApplications / totalJobs) * 10) / 10 : 0;

      // Get recent jobs (last 5)
      const recentJobs = jobs?.slice(0, 5) || [];

      // Get top performing jobs (most applications)
      const jobsWithApplicationCount = jobs?.map(job => ({
        ...job,
        applicationCount: applications?.filter(app => app.job_id === job.id).length || 0
      })).sort((a, b) => b.applicationCount - a.applicationCount).slice(0, 5) || [];

      setStats({
        totalJobs,
        activeJobs,
        totalApplications,
        pendingApplications,
        acceptedApplications,
        rejectedApplications,
        totalViews,
        averageApplicationsPerJob,
        recentJobs,
        topPerformingJobs: jobsWithApplicationCount
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: "Ouvert", variant: "default" as const, icon: CheckCircle },
      closed: { label: "Fermé", variant: "secondary" as const, icon: XCircle },
      in_progress: { label: "En cours", variant: "secondary" as const, icon: Clock },
      accomplished: { label: "Accompli", variant: "outline" as const, icon: Star }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const IconComponent = config?.icon || Clock;
    
    return (
      <Badge variant={config?.variant || "secondary"} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config?.label || status}
      </Badge>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Chargement des statistiques...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeJobs} actifs
            </p>
          </CardContent>
        </Card>

        {/* Total Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidatures</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingApplications} en attente
            </p>
          </CardContent>
        </Card>

        {/* Total Views */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vues totales</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground">
              Sur toutes vos offres
            </p>
          </CardContent>
        </Card>

        {/* Average Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moyenne</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageApplicationsPerJob}</div>
            <p className="text-xs text-muted-foreground">
              Candidatures par job
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Application Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition des candidatures</CardTitle>
          <CardDescription>
            Statut des candidatures reçues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingApplications}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </div>
            <div className="text-center p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.acceptedApplications}</p>
              <p className="text-sm text-muted-foreground">Acceptées</p>
            </div>
            <div className="text-center p-4 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejectedApplications}</p>
              <p className="text-sm text-muted-foreground">Refusées</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Jobs récents
            </CardTitle>
            <CardDescription>
              Vos 5 dernières offres publiées
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentJobs.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Aucun job publié</p>
            ) : (
              <div className="space-y-3">
                {stats.recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{job.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(job.status)}
                      <p className="text-xs text-muted-foreground mt-1">
                        {job.views_count || 0} vues
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2" />
              Jobs les plus populaires
            </CardTitle>
            <CardDescription>
              Classés par nombre de candidatures
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topPerformingJobs.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Aucune donnée disponible</p>
            ) : (
              <div className="space-y-3">
                {stats.topPerformingJobs.map((job, index) => (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{job.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {job.amount.toLocaleString()} {job.currency}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{job.applicationCount}</p>
                      <p className="text-xs text-muted-foreground">candidatures</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Performance Insight */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Aperçu de performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Taux d'acceptation</p>
                <p className="text-sm text-muted-foreground">
                  Pourcentage de candidatures acceptées
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {stats.totalApplications > 0 
                    ? Math.round((stats.acceptedApplications / stats.totalApplications) * 100)
                    : 0}%
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Efficacité des offres</p>
                <p className="text-sm text-muted-foreground">
                  Offres avec au moins une candidature
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">
                  {stats.totalJobs > 0
                    ? Math.round((stats.topPerformingJobs.filter(job => job.applicationCount > 0).length / stats.totalJobs) * 100)
                    : 0}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Engagement moyen</p>
                <p className="text-sm text-muted-foreground">
                  Vues par offre active
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {stats.activeJobs > 0
                    ? Math.round(stats.totalViews / stats.activeJobs)
                    : 0}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecruiterStats;