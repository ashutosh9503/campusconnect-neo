import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Search, Plus, Users, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations } from "@/hooks/useChat";

export default function Chat() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const { conversations, loading } = useConversations();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const filteredConversations = conversations.filter(conv => {
    const name = conv.name || conv.other_user?.display_name || conv.other_user?.username || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffMs / 86400000)}d ago`;
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
      <div className="min-h-screen flex">
        {/* Conversations List */}
        <div className="w-full md:w-80 border-r-2 border-foreground flex flex-col">
          {/* Header */}
          <div className="p-4 border-b-2 border-foreground">
            <div className="flex items-center justify-between mb-4">
              <h1 className="font-display text-xl text-foreground">MESSAGES</h1>
              <button className="p-2 bg-primary text-primary-foreground border-2 border-foreground hover-brutal">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-card border-2 border-foreground font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 font-mono text-muted-foreground">
                No conversations yet
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const displayName = conv.name || conv.other_user?.display_name || conv.other_user?.username || "User";
                const avatarInitials = (conv.other_user?.username || "U").slice(0, 2).toUpperCase();
                
                return (
                  <Link
                    key={conv.id}
                    to={`/chat/${conv.id}`}
                    className="flex items-center gap-3 p-4 border-b-2 border-border hover:bg-muted transition-colors"
                  >
                    <div className="relative">
                      <div className={cn(
                        "w-12 h-12 border-2 border-foreground flex items-center justify-center overflow-hidden",
                        conv.is_group ? "bg-secondary" : "bg-muted"
                      )}>
                        {conv.is_group ? (
                          <Users className="w-5 h-5 text-secondary-foreground" />
                        ) : conv.other_user?.avatar_url ? (
                          <img src={conv.other_user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-display text-sm text-foreground">{avatarInitials}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-sm text-foreground truncate">{displayName}</p>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {formatTime(conv.last_message_at)}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-muted-foreground truncate">
                        {conv.last_message || "No messages yet"}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Empty State - Desktop */}
        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-muted border-2 border-foreground flex items-center justify-center mx-auto mb-4">
              <User className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl text-foreground mb-2">SELECT A CHAT</h2>
            <p className="font-mono text-sm text-muted-foreground">
              Choose a conversation to start messaging
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
