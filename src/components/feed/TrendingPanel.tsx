import { useEffect, useState } from "react";
import { TrendingUp, Hash, Flame, Users } from "lucide-react";
import { Card3D } from "@/components/3d/Card3D";

interface TrendingItem {
  id: string;
  tag: string;
  posts: number;
  isHot: boolean;
}

export function TrendingPanel() {
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [newTodayCount, setNewTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get posts from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: todayPosts } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      setNewTodayCount(todayPosts || 0);

      // Get total users (as proxy for "online")
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      setOnlineCount(totalUsers || 0);

      // Extract hashtags from posts (simple version)
      const { data: posts } = await supabase
        .from("posts")
        .select("content")
        .order("created_at", { ascending: false })
        .limit(100);

      if (posts) {
        const hashtagCounts: Record<string, number> = {};
        posts.forEach(post => {
          const hashtags = post.content.match(/#\w+/g) || [];
          hashtags.forEach(tag => {
            const cleanTag = tag.replace("#", "");
            hashtagCounts[cleanTag] = (hashtagCounts[cleanTag] || 0) + 1;
          });
        });

        const sortedTags = Object.entries(hashtagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([tag, count], index) => ({
            id: String(index + 1),
            tag,
            posts: count,
            isHot: count > 3,
          }));

        setTrendingItems(sortedTags);
      }
    } catch (error) {
      console.error("Error fetching trending:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="font-display text-sm text-foreground">TRENDING @ TSDC</h2>
      </div>

      {/* Trending Items */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-4 font-mono text-xs text-muted-foreground">
            Loading...
          </div>
        ) : trendingItems.length > 0 ? (
          trendingItems.map((item, index) => (
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
          ))
        ) : (
          <div className="text-center py-4">
            <Hash className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="font-mono text-xs text-muted-foreground">
              No trending hashtags yet
            </p>
            <p className="font-mono text-[10px] text-muted-foreground mt-1">
              Use #hashtags in your posts!
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <Card3D maxTilt={6} depth={12} glowColor="lime" className="mt-6">
        <div className="p-4 bg-card border-2 border-foreground shadow-brutal-lime transform-style-3d">
          <h3 className="font-display text-xs text-muted-foreground mb-3">CAMPUS PULSE</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="transform-style-3d hover:translate-z-10 transition-transform">
              <p className="font-display text-2xl text-primary">{onlineCount}</p>
              <p className="font-mono text-[10px] text-muted-foreground">USERS</p>
            </div>
            <div className="transform-style-3d hover:translate-z-10 transition-transform">
              <p className="font-display text-2xl text-secondary">{newTodayCount}</p>
              <p className="font-mono text-[10px] text-muted-foreground">NEW TODAY</p>
            </div>
          </div>
        </div>
      </Card3D>
    </div>
  );
}
