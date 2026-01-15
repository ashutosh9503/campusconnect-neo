import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquare, Plus, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { icon: Home, label: "Feed", path: "/" },
  { icon: MessageSquare, label: "Chat", path: "/chat" },
  { icon: Plus, label: "Post", path: "/create", isAction: true },
  { icon: Bell, label: "Alerts", path: "/notifications" },
  { icon: User, label: "You", path: "/profile" },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t-2 border-foreground md:hidden">
      <div className="flex items-center justify-around py-2">
        {mobileNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          if (item.isAction) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center w-14 h-14 -mt-6 bg-primary border-2 border-foreground shadow-brutal"
              >
                <item.icon className="w-6 h-6 text-primary-foreground" />
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-4 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
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
