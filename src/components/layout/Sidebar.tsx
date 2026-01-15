import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  MessageSquare, 
  Bell, 
  Users, 
  Calendar, 
  Bookmark, 
  TrendingUp, 
  Settings, 
  User,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Feed", path: "/" },
  { icon: MessageSquare, label: "Messages", path: "/chat" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: Users, label: "Groups", path: "/groups" },
  { icon: Calendar, label: "Events", path: "/events" },
  { icon: Bookmark, label: "Saved", path: "/saved" },
  { icon: TrendingUp, label: "Trending", path: "/trending" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r-2 border-foreground bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b-2 border-foreground">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary flex items-center justify-center border-2 border-foreground">
            <span className="font-display text-primary-foreground text-lg">CC</span>
          </div>
          <div>
            <h1 className="font-display text-lg leading-tight text-foreground">Campus</h1>
            <h1 className="font-display text-lg leading-tight text-primary">Connect</h1>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 font-mono text-sm transition-all border-2",
                isActive
                  ? "bg-primary text-primary-foreground border-foreground shadow-brutal"
                  : "bg-transparent text-foreground border-transparent hover:border-foreground hover:bg-muted"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Create Post Button */}
      <div className="p-4 border-t-2 border-foreground">
        <Link
          to="/create"
          className="flex items-center justify-center gap-2 w-full py-3 bg-secondary text-secondary-foreground border-2 border-foreground font-mono text-sm hover-brutal"
        >
          <Plus className="w-5 h-5" />
          <span>CREATE POST</span>
        </Link>
      </div>

      {/* User Profile Mini */}
      <div className="p-4 border-t-2 border-foreground">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted border-2 border-foreground flex items-center justify-center">
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-sm text-foreground truncate">Guest User</p>
            <p className="font-mono text-xs text-muted-foreground">TSNDC • 2024</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
