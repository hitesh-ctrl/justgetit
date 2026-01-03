import { useAuth } from '@/contexts/AuthContext';
import { notificationStorage } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, MessageSquare, Star, Clock, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const notifications = notificationStorage
    .getByUserId(user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllAsRead = () => {
    notificationStorage.markAllAsRead(user.id);
    window.location.reload(); // Simple refresh to update UI
  };

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    notificationStorage.markAsRead(notification.id);
    if (notification.linkTo) {
      navigate(notification.linkTo);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'match':
        return <MessageSquare className="h-5 w-5 text-primary" />;
      case 'message':
        return <MessageSquare className="h-5 w-5 text-needing" />;
      case 'rating-reminder':
        return <Star className="h-5 w-5 text-warning" />;
      case 'request-expiring':
        return <Clock className="h-5 w-5 text-destructive" />;
      default:
        return <Info className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No notifications</p>
              <p className="text-sm mt-1">
                We'll notify you about matches, messages, and more
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={cn(
                  'cursor-pointer hover:shadow-md transition-shadow',
                  !notification.read && 'border-primary/50 bg-primary/5'
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-full bg-secondary">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{notification.title}</span>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {notification.message}
                      </p>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
