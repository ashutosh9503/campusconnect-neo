import { Link } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

export function MobileHeader() {
  const { unreadCount } = useNotifications();

  return (
    <header className="sticky top-0 z-40 md:hidden bg-background/95 backdrop-blur-md border-b-2 border-foreground flex items-center justify-between px-4 py-2.5 shadow-sm">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary flex items-center justify-center border-2 border-foreground shadow-brutal">
          <span className="font-display text-primary-foreground text-sm">CC</span>
        </div>
        <div className="flex items-center gap-1 font-display text-sm uppercase">
          <span className="text-foreground">Campus</span>
          <span className="text-primary">Connect</span>
        </div>
      </Link>

      {/* Action Shortcuts */}
      <div className="flex items-center gap-2">
        <Link
          to="/search"
          className="p-2 border-2 border-foreground bg-card hover:bg-muted text-foreground transition-colors"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </Link>
        <Link
          to="/notifications"
          className="p-2 border-2 border-foreground bg-card hover:bg-muted text-foreground transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] text-destructive-foreground font-bold border border-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
