import { MainLayout } from "@/components/layout/MainLayout";
import { Bell, Heart, MessageSquare, UserPlus, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "reaction" | "comment" | "follow" | "notice";
  content: string;
  timestamp: string;
  isRead: boolean;
  avatar: string;
}

const mockNotifications: Notification[] = [
  { id: "1", type: "reaction", content: "Rahul Kumar reacted 🧠 to your post", timestamp: "2m ago", isRead: false, avatar: "RK" },
  { id: "2", type: "comment", content: "Priya Sharma commented on your post", timestamp: "15m ago", isRead: false, avatar: "PS" },
  { id: "3", type: "notice", content: "New notice: Exam Schedule Updated", timestamp: "1h ago", isRead: false, avatar: "📢" },
  { id: "4", type: "follow", content: "Amit Joshi started following you", timestamp: "2h ago", isRead: true, avatar: "AJ" },
  { id: "5", type: "reaction", content: "Neha Mehta reacted 🏆 to your post", timestamp: "3h ago", isRead: true, avatar: "NM" },
  { id: "6", type: "comment", content: "Vikram Singh replied to your comment", timestamp: "5h ago", isRead: true, avatar: "VS" },
];

const typeIcons = {
  reaction: Heart,
  comment: MessageSquare,
  follow: UserPlus,
  notice: Megaphone,
};

const typeColors = {
  reaction: "text-destructive",
  comment: "text-primary",
  follow: "text-secondary",
  notice: "text-warning",
};

export default function Notifications() {
  return (
    <MainLayout showSidebars={false}>
      <div className="min-h-screen max-w-2xl mx-auto">
        {/* Header */}
        <div className="p-4 border-b-2 border-foreground sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-xl text-foreground">NOTIFICATIONS</h1>
            <button className="font-mono text-xs text-primary hover:underline">
              MARK ALL READ
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y-2 divide-border">
          {mockNotifications.map((notification) => {
            const Icon = typeIcons[notification.type];
            const colorClass = typeColors[notification.type];
            
            return (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start gap-4 p-4 hover:bg-muted transition-colors cursor-pointer",
                  !notification.isRead && "bg-muted/50"
                )}
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-card border-2 border-foreground flex items-center justify-center">
                    {notification.type === "notice" ? (
                      <span className="text-lg">{notification.avatar}</span>
                    ) : (
                      <span className="font-display text-sm text-foreground">{notification.avatar}</span>
                    )}
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
                    {notification.content}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-1">
                    {notification.timestamp}
                  </p>
                </div>

                {!notification.isRead && (
                  <div className="w-2 h-2 bg-primary flex-shrink-0 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
