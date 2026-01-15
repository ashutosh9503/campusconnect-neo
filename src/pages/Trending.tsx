import { MainLayout } from "@/components/layout/MainLayout";
import { TrendingUp, Hash, Flame, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendingTag {
  id: string;
  tag: string;
  posts: number;
  change: number;
  isHot: boolean;
}

const trendingTags: TrendingTag[] = [
  { id: "1", tag: "MidSems", posts: 234, change: 45, isHot: true },
  { id: "2", tag: "CulturalFest", posts: 189, change: 32, isHot: true },
  { id: "3", tag: "PlacementSeason", posts: 156, change: 28, isHot: false },
  { id: "4", tag: "BunkMaroYaar", posts: 98, change: 15, isHot: false },
  { id: "5", tag: "CanteenFood", posts: 87, change: 12, isHot: false },
  { id: "6", tag: "LibrarySpots", posts: 65, change: 8, isHot: false },
  { id: "7", tag: "ProjectSubmission", posts: 54, change: 23, isHot: true },
  { id: "8", tag: "CollegeMemes", posts: 445, change: 67, isHot: true },
  { id: "9", tag: "InternshipHunt", posts: 78, change: 19, isHot: false },
  { id: "10", tag: "GymBros", posts: 34, change: 5, isHot: false },
];

export default function Trending() {
  return (
    <MainLayout showSidebars={false}>
      <div className="min-h-screen max-w-2xl mx-auto">
        {/* Header */}
        <div className="p-4 border-b-2 border-foreground sticky top-0 bg-background z-10">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h1 className="font-display text-xl text-foreground">TRENDING @ TSNDC</h1>
          </div>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            Updated every hour
          </p>
        </div>

        {/* Trending List */}
        <div className="divide-y-2 divide-border">
          {trendingTags.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 hover:bg-muted transition-colors cursor-pointer"
            >
              <span className={cn(
                "font-display text-2xl w-8 text-center",
                index < 3 ? "text-primary" : "text-muted-foreground"
              )}>
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary" />
                  <span className="font-mono text-sm text-foreground">{item.tag}</span>
                  {item.isHot && (
                    <Flame className="w-4 h-4 text-destructive animate-pulse" />
                  )}
                </div>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                  {item.posts} posts
                </p>
              </div>

              <div className="flex items-center gap-1 text-primary">
                <ArrowUp className="w-4 h-4" />
                <span className="font-mono text-xs">+{item.change}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
