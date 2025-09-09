import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  Check, 
  Trash2, 
  Clock,
  Briefcase,
  User,
  AlertCircle,
  CheckCircle2,
  X
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface UserProfile {
  id: string;
  role: string;
}

interface NotificationCenterProps {
  userProfile: UserProfile;
}

const NotificationCenter = ({ userProfile }: NotificationCenterProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les notifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer comme lu",
        variant: "destructive"
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );

      toast({
        title: "Notifications marquées comme lues",
        description: `${unreadIds.length} notifications marquées comme lues.`
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer toutes comme lues",
        variant: "destructive"
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      toast({
        title: "Notification supprimée",
        description: "La notification a été supprimée."
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la notification",
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconConfig = {
      application: { icon: Briefcase, color: "text-blue-500" },
      job: { icon: Briefcase, color: "text-green-500" },
      system: { icon: AlertCircle, color: "text-orange-500" },
      success: { icon: CheckCircle2, color: "text-green-500" },
      warning: { icon: AlertCircle, color: "text-yellow-500" },
      error: { icon: X, color: "text-red-500" },
      user: { icon: User, color: "text-purple-500" }
    };

    const config = iconConfig[type as keyof typeof iconConfig] || iconConfig.system;
    const IconComponent = config.icon;

    return <IconComponent className={`h-5 w-5 ${config.color}`} />;
  };

  const getNotificationBadgeVariant = (type: string) => {
    const variants = {
      application: "default" as const,
      job: "secondary" as const,
      system: "outline" as const,
      success: "default" as const,
      warning: "secondary" as const,
      error: "destructive" as const,
      user: "outline" as const
    };

    return variants[type as keyof typeof variants] || "outline";
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const readNotifications = notifications.filter(n => n.is_read);
  const unreadNotifications = notifications.filter(n => !n.is_read);

  if (loading) {
    return <div className="flex items-center justify-center p-8">Chargement des notifications...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Centre de notifications
              </CardTitle>
              <CardDescription>
                {unreadCount > 0 
                  ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
                  : "Toutes les notifications sont lues"
                }
              </CardDescription>
            </div>
            <div className="space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Tout marquer comme lu
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{notifications.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-4 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{unreadCount}</p>
              <p className="text-sm text-muted-foreground">Non lues</p>
            </div>
            <div className="text-center p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{readNotifications.length}</p>
              <p className="text-sm text-muted-foreground">Lues</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications non lues */}
      {unreadNotifications.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
            Notifications non lues ({unreadNotifications.length})
          </h3>
          <div className="space-y-3">
            {unreadNotifications.map((notification) => (
              <Card key={notification.id} className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{notification.title}</h4>
                          <Badge variant={getNotificationBadgeVariant(notification.type)} className="text-xs">
                            {notification.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(notification.created_at).toLocaleString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedNotification(notification);
                          setShowDetailsDialog(true);
                          markAsRead(notification.id);
                        }}
                      >
                        Voir
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Notifications lues */}
      {readNotifications.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
            Notifications lues ({readNotifications.length})
          </h3>
          <div className="space-y-3">
            {readNotifications.map((notification) => (
              <Card key={notification.id} className="opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{notification.title}</h4>
                          <Badge variant={getNotificationBadgeVariant(notification.type)} className="text-xs">
                            {notification.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Lue
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(notification.created_at).toLocaleString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedNotification(notification);
                          setShowDetailsDialog(true);
                        }}
                      >
                        Voir
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {notifications.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune notification</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de détails */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {selectedNotification && getNotificationIcon(selectedNotification.type)}
              <span className="ml-2">{selectedNotification?.title}</span>
            </DialogTitle>
            <DialogDescription>
              {selectedNotification && new Date(selectedNotification.created_at).toLocaleString('fr-FR')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedNotification && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">{selectedNotification.message}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <Badge variant={getNotificationBadgeVariant(selectedNotification.type)}>
                  {selectedNotification.type}
                </Badge>
                <div className="flex items-center space-x-2">
                  <Badge variant={selectedNotification.is_read ? "outline" : "default"}>
                    {selectedNotification.is_read ? "Lue" : "Non lue"}
                  </Badge>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => deleteNotification(selectedNotification.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
                <Button onClick={() => setShowDetailsDialog(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationCenter;