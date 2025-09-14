import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Activity {
  id: string;
  timestamp: string;
  user_id: string;
  type: string;
  details: string;
}

interface RecentActivitiesProps {
  userId: string;
}

const RecentActivities = ({ userId }: RecentActivitiesProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (!error && data) {
        setActivities(data);
      }
      setLoading(false);
    };

    fetchActivities();
  }, [userId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activités Récentes</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Chargement...</p>
        ) : activities.length > 0 ? (
          <ul className="space-y-4">
            {activities.map((activity) => (
              <li key={activity.id} className="flex items-start">
                <div className="flex-shrink-0">
                  {/* You can add an icon based on activity.type */}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-foreground">{activity.details}</p>
                  <p className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucune activité récente.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivities;
