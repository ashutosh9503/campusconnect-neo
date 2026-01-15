import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  type: "user" | "post";
  id: string;
  title: string;
  subtitle: string;
  avatar?: string;
  content?: string;
}

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const searchResults: SearchResult[] = [];

      // Search users
      const { data: users } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, stream, year")
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10);

      users?.forEach(user => {
        searchResults.push({
          type: "user",
          id: user.user_id,
          title: user.display_name || user.username || "User",
          subtitle: `@${user.username || "user"} • ${user.stream || ""} ${user.year || ""}`,
          avatar: user.avatar_url || undefined,
        });
      });

      // Search posts
      const { data: posts } = await supabase
        .from("posts")
        .select("id, content, user_id, created_at")
        .ilike("content", `%${query}%`)
        .order("created_at", { ascending: false })
        .limit(10);

      // Get profiles for posts
      if (posts?.length) {
        const userIds = [...new Set(posts.map(p => p.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, display_name")
          .in("user_id", userIds);

        const profilesMap = new Map(profiles?.map(p => [p.user_id, p]));

        posts.forEach(post => {
          const profile = profilesMap.get(post.user_id);
          searchResults.push({
            type: "post",
            id: post.id,
            title: profile?.display_name || profile?.username || "User",
            subtitle: new Date(post.created_at).toLocaleDateString(),
            content: post.content.substring(0, 100) + (post.content.length > 100 ? "..." : ""),
          });
        });
      }

      setResults(searchResults);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = () => setResults([]);

  return { results, loading, search, clearResults };
}
