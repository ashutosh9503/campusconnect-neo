import { MainLayout } from "@/components/layout/MainLayout";
import { TrendingUp, Hash, Flame, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrending } from "@/hooks/useTrending";

export default function Trending() {
  const { trendingTags, loading } = useTrending();

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
          {loading ? (
            <div className="text-center py-16">
              <div className="font-mono text-muted-foreground">LOADING...</div>
            </div>
          ) : trendingTags.length > 0 ? (
            trendingTags.map((item, index) => (
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

                {item.change > 0 && (
                  <div className="flex items-center gap-1 text-primary">
                    <ArrowUp className="w-4 h-4" />
                    <span className="font-mono text-xs">+{item.change}%</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <Hash className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-display text-lg text-foreground mb-2">NO TRENDING TOPICS</h2>
              <p className="font-mono text-sm text-muted-foreground">
                Start posting with #hashtags to see trends!
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
