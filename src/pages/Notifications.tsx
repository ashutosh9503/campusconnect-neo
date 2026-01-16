import { MainLayout } from "@/components/layout/MainLayout";
import { Bell, Heart, MessageSquare, UserPlus, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const typeIcons: Record<string, any> = {
  like: Heart,
  comment: MessageSquare,
  follow: UserPlus,
  mention: Megaphone,
  message: MessageSquare,
};

const typeColors: Record<string, string> = {
  like: "text-destructive",
  comment: "text-primary",
  follow: "text-secondary",
  mention: "text-warning",
  message: "text-primary",
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function getNotificationContent(notification: any): string {
  const actorName = notification.actor_profile?.display_name || notification.actor_profile?.username || "Someone";
  
  switch (notification.type) {
    case "like":
      return `${actorName} reacted to your post`;
    case "comment":
      return `${actorName} commented on your post`;
    case "follow":
      return `${actorName} started following you`;
    case "mention":
      return `${actorName} mentioned you in a post`;
    case "message":
      return `${actorName} sent you a message`;
    default:
      return `New notification from ${actorName}`;
  }
}

export default function Notifications() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.type === "follow" && notification.actor_profile?.username) {
      navigate(`/profile/${notification.actor_profile.username}`);
    } else if (notification.post_id) {
      // Could navigate to post detail page if it exists
    }
  };

  if (authLoading || loading) {
    return (
      <MainLayout showSidebars={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="font-mono text-muted-foreground">LOADING...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout showSidebars={false}>
      <div className="min-h-screen max-w-2xl mx-auto">
        {/* Header */}
        <div className="p-4 border-b-2 border-foreground sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-xl text-foreground">NOTIFICATIONS</h1>
            <button 
              onClick={markAllAsRead}
              className="font-mono text-xs text-primary hover:underline"
            >
              MARK ALL READ
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y-2 divide-border">
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              const Icon = typeIcons[notification.type] || Bell;
              const colorClass = typeColors[notification.type] || "text-foreground";
              const avatar = notification.actor_profile?.username?.slice(0, 2).toUpperCase() || "??";
              
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "flex items-start gap-4 p-4 hover:bg-muted transition-colors cursor-pointer",
                    !notification.read && "bg-muted/50"
                  )}
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-card border-2 border-foreground flex items-center justify-center">
                      <span className="font-display text-sm text-foreground">{avatar}</span>
                    </div>
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-6 h-6 bg-background border-2 border-foreground flex items-center justify-center",
                      colorClass
                    )}>
                      <Icon className="w-3 h-3" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-foreground">
                      {getNotificationContent(notification)}
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground mt-1">
                      {formatTimeAgo(notification.created_at)}
                    </p>
                  </div>

                  {!notification.read && (
                    <div className="w-2 h-2 bg-primary flex-shrink-0 mt-2" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-16">
              <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-display text-lg text-foreground mb-2">NO NOTIFICATIONS</h2>
              <p className="font-mono text-sm text-muted-foreground">
                You're all caught up!
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
