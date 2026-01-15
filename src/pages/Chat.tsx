import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Search, Plus, Users, User } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  isGroup: boolean;
  isOnline?: boolean;
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    name: "CS Study Group",
    avatar: "CS",
    lastMessage: "Anyone got notes for OS?",
    timestamp: "2m ago",
    unread: 5,
    isGroup: true,
  },
  {
    id: "2",
    name: "Priya Sharma",
    avatar: "PS",
    lastMessage: "See you at the library!",
    timestamp: "15m ago",
    unread: 0,
    isGroup: false,
    isOnline: true,
  },
  {
    id: "3",
    name: "Placement Prep Gang",
    avatar: "PP",
    lastMessage: "Mock interview tomorrow",
    timestamp: "1h ago",
    unread: 12,
    isGroup: true,
  },
  {
    id: "4",
    name: "Rahul Kumar",
    avatar: "RK",
    lastMessage: "Bro assignment done?",
    timestamp: "3h ago",
    unread: 2,
    isGroup: false,
    isOnline: false,
  },
  {
    id: "5",
    name: "TY Project Team",
    avatar: "TY",
    lastMessage: "Meeting at 4pm",
    timestamp: "5h ago",
    unread: 0,
    isGroup: true,
  },
];

export default function Chat() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = mockConversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            {filteredConversations.map((conv) => (
              <Link
                key={conv.id}
                to={`/chat/${conv.id}`}
                className="flex items-center gap-3 p-4 border-b-2 border-border hover:bg-muted transition-colors"
              >
                <div className="relative">
                  <div className={cn(
                    "w-12 h-12 border-2 border-foreground flex items-center justify-center",
                    conv.isGroup ? "bg-secondary" : "bg-muted"
                  )}>
                    {conv.isGroup ? (
                      <Users className="w-5 h-5 text-secondary-foreground" />
                    ) : (
                      <span className="font-display text-sm text-foreground">{conv.avatar}</span>
                    )}
                  </div>
                  {!conv.isGroup && conv.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary border-2 border-background rounded-full" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm text-foreground truncate">{conv.name}</p>
                    <span className="font-mono text-[10px] text-muted-foreground">{conv.timestamp}</span>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                </div>

                {conv.unread > 0 && (
                  <div className="w-6 h-6 bg-primary text-primary-foreground flex items-center justify-center font-mono text-xs">
                    {conv.unread}
                  </div>
                )}
              </Link>
            ))}
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
