import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, MessageSquare, Plus, Bell, User, LogIn, Users, Calendar, Search, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const mobileNavItems = [
    { icon: Home, label: "Feed", path: "/" },
    { icon: MessageSquare, label: "Chat", path: "/chat" },
    { icon: Users, label: "Groups", path: "/groups" },
    { icon: Bell, label: "Notices", path: "/notices" },
    { icon: Search, label: "Search", path: "/search" },
    { icon: Calendar, label: "Events", path: "/events" },
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: user ? User : LogIn, label: "Profile", path: user ? "/profile" : "/login" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t-2 border-foreground md:hidden pb-safe">
      <div className="flex items-center gap-4 overflow-x-auto px-4 py-2 no-scrollbar">
        {mobileNavItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 min-w-[60px] p-2 transition-colors rounded-lg shrink-0",
                isActive ? "bg-primary text-primary-foreground border-2 border-foreground shadow-brutal" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-mono text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
