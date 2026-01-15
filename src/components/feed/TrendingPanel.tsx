import { TrendingUp, Hash, Flame } from "lucide-react";

interface TrendingItem {
  id: string;
  tag: string;
  posts: number;
  isHot: boolean;
}

const trendingItems: TrendingItem[] = [
  { id: "1", tag: "MidSems", posts: 234, isHot: true },
  { id: "2", tag: "CulturalFest", posts: 189, isHot: true },
  { id: "3", tag: "PlacementSeason", posts: 156, isHot: false },
  { id: "4", tag: "BunkMaroYaar", posts: 98, isHot: false },
  { id: "5", tag: "CanteenFood", posts: 87, isHot: false },
  { id: "6", tag: "LibrarySpots", posts: 65, isHot: false },
];

export function TrendingPanel() {
  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="font-display text-sm text-foreground">TRENDING @ TSNDC</h2>
      </div>

      {/* Trending Items */}
      <div className="space-y-2">
        {trendingItems.map((item, index) => (
          <button
            key={item.id}
            className="w-full flex items-center gap-3 p-3 bg-card border-2 border-transparent hover:border-foreground transition-all group"
          >
            <span className="font-mono text-xs text-muted-foreground w-4">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-1">
                <Hash className="w-3 h-3 text-primary" />
                <span className="font-mono text-sm text-foreground group-hover:text-primary transition-colors">
                  {item.tag}
                </span>
                {item.isHot && (
                  <Flame className="w-3 h-3 text-destructive animate-pulse" />
                )}
              </div>
              <p className="font-mono text-[10px] text-muted-foreground">
                {item.posts} posts
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 p-4 bg-card border-2 border-foreground">
        <h3 className="font-display text-xs text-muted-foreground mb-3">CAMPUS PULSE</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-display text-2xl text-primary">1.2K</p>
            <p className="font-mono text-[10px] text-muted-foreground">ONLINE NOW</p>
          </div>
          <div>
            <p className="font-display text-2xl text-secondary">89</p>
            <p className="font-mono text-[10px] text-muted-foreground">NEW TODAY</p>
          </div>
        </div>
      </div>
    </div>
  );
}
