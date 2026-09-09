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

  // Fallback default order if preferences navigationOrder is absent or empty
  const defaultOrder = [
    "/",
    "/chat",
    "/neo-space",
    "/groups",
    "/notices",
    "/search",
    "/events",
    "/saved",
    "/trending",
    "/settings",
  ];

  const order = Array.isArray(preferences?.navigationOrder) && preferences.navigationOrder.length > 0
    ? preferences.navigationOrder
    : defaultOrder;

  const hidden = Array.isArray(preferences?.hiddenMenus) ? preferences.hiddenMenus : [];

  const activeMobileItems = order
    .filter((path) => !hidden.includes(path) && ALL_MOBILE_ITEMS[path])
    .map((path) => ({
      path,
      ...ALL_MOBILE_ITEMS[path],
    }));

  // Append profile/login as final item
  activeMobileItems.push({
    path: user ? "/profile" : "/login",
    icon: user ? User : LogIn,
    label: "Profile",
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] w-full bg-background/95 backdrop-blur-xl border-t-2 border-foreground md:hidden shadow-[0_-4px_25px_rgba(0,0,0,0.8)] pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
      <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-2 scroll-smooth snap-x snap-mandatory no-scrollbar scrollbar-none touch-pan-x overscroll-x-contain select-none min-h-[64px]">
        {activeMobileItems.map((item, index) => {
          const isActive = location.pathname === item.path;

          // Insert Create button action after index 1 (between Chat and NEO Space)
          if (index === 2) {
            return (
              <div key="create-action-wrapper" className="flex items-center gap-1.5 shrink-0 snap-start">
                {/* Center Accent Plus Button */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex flex-col items-center justify-center gap-1 min-w-[56px] p-1 transition-transform active:scale-95 rounded-lg text-primary hover:bg-muted/80 outline-none">
                    <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-brutal border-2 border-foreground animate-pulse">
                      <Plus className="w-4 h-4 font-bold text-black" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="mb-3 border-2 border-foreground shadow-brutal w-48 bg-background z-[110]">
                    <DropdownMenuItem asChild>
                      <Link to="/create-post" className="flex items-center gap-2 cursor-pointer font-mono p-2.5 hover:bg-muted text-xs font-bold">
                        <PenTool className="w-4 h-4 text-primary" />
                        <span>Create Post</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/create-story" className="flex items-center gap-2 cursor-pointer font-mono p-2.5 hover:bg-muted text-xs font-bold">
                        <Image className="w-4 h-4 text-secondary" />
                        <span>Create Story</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Item index 2 */}
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 min-w-[56px] p-1.5 transition-all rounded-lg shrink-0 snap-start active:scale-95",
                    isActive
                      ? "bg-primary text-primary-foreground border-2 border-foreground shadow-brutal font-bold"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-mono text-[10px] whitespace-nowrap">{item.label}</span>
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[56px] p-1.5 transition-all rounded-lg shrink-0 snap-start active:scale-95",
                isActive
                  ? "bg-primary text-primary-foreground border-2 border-foreground shadow-brutal font-bold"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-mono text-[10px] whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
