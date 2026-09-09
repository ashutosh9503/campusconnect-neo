import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquare, Plus, Bell, User, LogIn, Users, Calendar, Search, Settings, PenTool, Image, Compass, TrendingUp, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPreferences } from "@/contexts/UserPreferenceContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ALL_MOBILE_ITEMS: Record<string, { icon: any; label: string }> = {
  "/": { icon: Home, label: "Feed" },
  "/chat": { icon: MessageSquare, label: "Chat" },
  "/neo-space": { icon: Compass, label: "NEO Space" },
  "/groups": { icon: Users, label: "Groups" },
  "/notices": { icon: Bell, label: "Notices" },
  "/search": { icon: Search, label: "Search" },
  "/events": { icon: Calendar, label: "Events" },
  "/saved": { icon: Bookmark, label: "Saved" },
  "/trending": { icon: TrendingUp, label: "Trending" },
  "/settings": { icon: Settings, label: "Settings" },
};

export function MobileNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { preferences } = useUserPreferences();

  const activeMobileItems = preferences.navigationOrder
    .filter((path) => !preferences.hiddenMenus.includes(path) && ALL_MOBILE_ITEMS[path])
    .map((path) => ({
      path,
      ...ALL_MOBILE_ITEMS[path],
    }));

  // Add profile as final item
  activeMobileItems.push({
    path: user ? "/profile" : "/login",
    icon: user ? User : LogIn,
    label: "Profile",
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t-2 border-foreground md:hidden pb-safe">
      <div className="flex items-center gap-2 overflow-x-auto px-3 py-2 scroll-smooth snap-x snap-mandatory scrollbar-none">
        {activeMobileItems.map((item, index) => {
          const isActive = location.pathname === item.path;

          // Insert Create button after index 2
          if (index === 3) {
            return (
              <div key="create-action" className="flex items-center shrink-0 snap-start">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex flex-col items-center gap-1 min-w-[56px] p-1.5 transition-transform active:scale-95 rounded-lg text-primary hover:bg-muted outline-none">
                    <div className="bg-primary text-primary-foreground rounded-full p-1.5 shadow-brutal border-2 border-foreground animate-pulse">
                      <Plus className="w-5 h-5 font-bold" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="mb-2 border-2 border-foreground shadow-brutal w-48 bg-background z-50">
                    <DropdownMenuItem asChild>
                      <Link to="/create-post" className="flex items-center gap-2 cursor-pointer font-mono p-2 hover:bg-muted text-xs font-bold">
                        <PenTool className="w-4 h-4 text-primary" />
                        <span>Create Post</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/create-story" className="flex items-center gap-2 cursor-pointer font-mono p-2 hover:bg-muted text-xs font-bold">
                        <Image className="w-4 h-4 text-secondary" />
                        <span>Create Story</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center gap-1 min-w-[56px] p-1.5 transition-all rounded-lg shrink-0 snap-start active:scale-95",
                    isActive
                      ? "bg-primary text-primary-foreground border-2 border-foreground shadow-brutal font-bold"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-mono text-[10px]">{item.label}</span>
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 min-w-[56px] p-1.5 transition-all rounded-lg shrink-0 snap-start active:scale-95",
                isActive
                  ? "bg-primary text-primary-foreground border-2 border-foreground shadow-brutal font-bold"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
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
