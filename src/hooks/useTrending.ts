import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TrendingTag {
  id: string;
  tag: string;
  posts: number;
  change: number;
  isHot: boolean;
}

export function useTrending() {
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrending = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all posts from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: posts, error } = await supabase
        .from("posts")
        .select("content, created_at")
        .gte("created_at", sevenDaysAgo.toISOString());

      if (error) throw error;

      // Extract hashtags from posts
      const hashtagCounts = new Map<string, { total: number; recent: number }>();
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      posts?.forEach(post => {
        const hashtags = post.content.match(/#[\w]+/g) || [];
        const isRecent = new Date(post.created_at) > oneDayAgo;
        
        hashtags.forEach(tag => {
          const normalizedTag = tag.slice(1).toLowerCase(); // Remove # and lowercase
          const current = hashtagCounts.get(normalizedTag) || { total: 0, recent: 0 };
          current.total++;
          if (isRecent) current.recent++;
          hashtagCounts.set(normalizedTag, current);
        });
      });

      // Sort by total count and create trending list
      const sortedTags = Array.from(hashtagCounts.entries())
        .map(([tag, counts]) => ({
          id: tag,
          tag: tag,
          posts: counts.total,
          change: counts.total > 0 ? Math.round((counts.recent / counts.total) * 100) : 0,
          isHot: counts.recent >= 2 || (counts.total >= 5 && counts.recent > 0),
        }))
        .sort((a, b) => b.posts - a.posts)
        .slice(0, 20);

      setTrendingTags(sortedTags);
    } catch (err) {
      console.error("Error fetching trending:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  return { trendingTags, loading, refetch: fetchTrending };
}
