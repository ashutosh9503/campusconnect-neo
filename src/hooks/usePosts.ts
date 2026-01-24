import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type ReactionType = Database["public"]["Enums"]["reaction_type"];

export interface Post {
  id: string;
  user_id: string;
  content: string;
  media?: {
    type: "image" | "video";
    url: string;
  }[];
  created_at: string;
  updated_at: string;
  profile?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    stream: string | null;
    year: string | null;
  } | null;
  reactions_count?: {
    brainrot: number;
    w: number;
    l: number;
    coffee: number;
  };
  comments_count?: number;
  user_reaction?: ReactionType | null;
  is_saved?: boolean;
}

export function usePosts(userId?: string, limit = 20, options?: { enabled?: boolean }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const enabled = options?.enabled ?? true;

  const fetchPosts = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      let query = supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data: postsData, error: postsError } = await query;
      if (postsError) throw postsError;

      // Fetch profiles for all posts
      const userIds = [...new Set(postsData?.map(p => p.user_id) || [])];
      let profilesMap = new Map();
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, stream, year")
          .in("id", userIds);
        profilesMap = new Map(profilesData?.map(p => [p.id, p]));
      }

      // Fetch reactions counts
      const postIds = postsData?.map(p => p.id) || [];
      let reactionsData: any[] = [];
      if (postIds.length > 0) {
        const { data } = await supabase
          .from("reactions")
          .select("post_id, reaction_type")
          .in("post_id", postIds);
        reactionsData = data || [];
      }

      // Fetch user's reactions if logged in
      let userReactionsMap = new Map<string, ReactionType>();
      if (user && postIds.length > 0) {
        const { data: userReactions } = await supabase
          .from("reactions")
          .select("post_id, reaction_type")
          .eq("user_id", user.id)
          .in("post_id", postIds);
        userReactionsMap = new Map(userReactions?.map(r => [r.post_id, r.reaction_type]));
      }

      // Fetch saved posts if logged in
      let savedPostsSet = new Set<string>();
      if (user && postIds.length > 0) {
        const { data: savedPosts } = await supabase
          .from("saved_posts")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", postIds);
        savedPostsSet = new Set(savedPosts?.map(s => s.post_id));
      }

      // Fetch comments counts
      let commentsData: any[] = [];
      if (postIds.length > 0) {
        const { data } = await supabase
          .from("comments")
          .select("post_id")
          .in("post_id", postIds);
        commentsData = data || [];
      }

      // Fetch post media
      let postMediaMap = new Map<string, { type: "image" | "video"; url: string }[]>();
      if (postIds.length > 0) {
        console.log("Fetching media for posts:", postIds);
        const { data: mediaData, error: mediaError } = await supabase
          .from("post_media" as any)
          .select("post_id, url, type")
          .in("post_id", postIds);

        if (mediaError) {
          console.error("Error fetching media:", mediaError);
        } else {
          console.log("Media data fetched:", mediaData);
        }

        if (mediaData) {
          mediaData.forEach((m: any) => {
            const current = postMediaMap.get(m.post_id) || [];
            current.push({ type: m.type, url: m.url });
            postMediaMap.set(m.post_id, current);
          });
        }
      }

      // Aggregate reactions
      const reactionsMap = new Map<string, { brainrot: number; w: number; l: number; coffee: number }>();
      reactionsData.forEach((r: any) => {
        const current = reactionsMap.get(r.post_id) || { brainrot: 0, w: 0, l: 0, coffee: 0 };
        if (r.reaction_type in current) {
          current[r.reaction_type as keyof typeof current]++;
        }
        reactionsMap.set(r.post_id, current);
      });

      // Aggregate comments
      const commentsMap = new Map<string, number>();
      commentsData.forEach((c: any) => {
        commentsMap.set(c.post_id, (commentsMap.get(c.post_id) || 0) + 1);
      });

      const enrichedPosts = postsData?.map(post => {
        // Combine legacy media columns with new media table
        let media: { type: "image" | "video"; url: string }[] = postMediaMap.get(post.id) || [];

        // DEBUG: Check why media isn't attaching
        if (postMediaMap.has(post.id)) {
          console.log(`[Enrich] Found media for post ${post.id}:`, media);
        } else {
          // Only log for the new post to avoid spam
          if (post.content === "yoo" || media.length > 0) {
            console.log(`[Enrich] No media found in map for post ${post.id}. Map has ${postMediaMap.size} entries.`);
          }
        }

        // If no media in new table, but exists in legacy columns, use that (migration fallback)
        if (media.length === 0 && post.media_url) {
          media = [{
            url: post.media_url,
            type: (post.media_type as "image" | "video") || "image"
          }];
        }

        return {
          ...post,
          profile: profilesMap.get(post.user_id) || null,
          reactions_count: reactionsMap.get(post.id) || { brainrot: 0, w: 0, l: 0, coffee: 0 },
          comments_count: commentsMap.get(post.id) || 0,
          user_reaction: userReactionsMap.get(post.id) || null,
          is_saved: savedPostsSet.has(post.id),
          media,
        };
      }) || [];

      setPosts(enrichedPosts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, limit, user, enabled]);

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel("public:posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          console.log("New post received!", payload);
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  const deletePost = async (postId: string) => {
    try {
      // 1. Fetch post to get media info
      const { data: post } = await supabase
        .from("posts")
        .select("media_url")
        .eq("id", postId)
        .single();

      const { data: mediaItems } = await supabase
        .from("post_media" as any)
        .select("url")
        .eq("post_id", postId);

      // 2. Import helper dynamically or use if available (assuming import added at top)
      const { extractFilePathFromUrl, deleteStorageFile } = await import("@/utils/storageUtils");

      // 3. Collect all paths to delete
      const pathsToDelete: string[] = [];

      if (post?.media_url) {
        const path = extractFilePathFromUrl(post.media_url, "posts-media");
        if (path) pathsToDelete.push(path);
      }

      if (mediaItems && mediaItems.length > 0) {
        mediaItems.forEach((item: any) => {
          const path = extractFilePathFromUrl(item.url, "posts-media");
          if (path) pathsToDelete.push(path);
        });
      }

      // 4. Delete files (parallel)
      if (pathsToDelete.length > 0) {
        await Promise.all(pathsToDelete.map(path => deleteStorageFile("posts-media", path)));
      }

      // 5. Delete DB Row
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      setPosts(prev => prev.filter(p => p.id !== postId));
      return { error: null };
    } catch (err: any) {
      console.error("Delete post error:", err);
      return { error: err };
    }
  };

  return { posts, loading, error, refetch: fetchPosts, deletePost };
}

export function useSavedPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchSavedPosts = async () => {
      const { data: savedData } = await supabase
        .from("saved_posts")
        .select("post_id")
        .eq("user_id", user.id);

      if (!savedData?.length) {
        setPosts([]);
        setLoading(false);
        return;
      }

      const postIds = savedData.map(s => s.post_id);
      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .in("id", postIds)
        .order("created_at", { ascending: false });

      // Fetch profiles for all saved posts
      const userIds = [...new Set(postsData?.map(p => p.user_id) || [])];
      let profilesMap = new Map();
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, stream, year")
          .in("id", userIds);
        profilesMap = new Map(profilesData?.map(p => [p.id, p]));
      }

      // Fetch post media
      let postMediaMap = new Map<string, { type: "image" | "video"; url: string }[]>();
      if (postIds.length > 0) {
        const { data: mediaData } = await supabase
          .from("post_media" as any)
          .select("post_id, url, type")
          .in("post_id", postIds);

        if (mediaData) {
          mediaData.forEach((m: any) => {
            const current = postMediaMap.get(m.post_id) || [];
            current.push({ type: m.type, url: m.url });
            postMediaMap.set(m.post_id, current);
          });
        }
      }

      const enrichedPosts = postsData?.map(post => {
        let media = postMediaMap.get(post.id) || [];
        // Fallback to legacy
        if (media.length === 0 && post.media_url) {
          media = [{
            url: post.media_url,
            type: (post.media_type as "image" | "video") || "image"
          }];
        }

        return {
          ...post,
          profile: profilesMap.get(post.user_id) || null,
          is_saved: true,
          media
        };
      }) || [];

      setPosts(enrichedPosts);
      setLoading(false);
    };

    fetchSavedPosts();
  }, [user]);

  return { posts, loading };
}

export function useReaction(postId: string) {
  const { user } = useAuth();

  const addReaction = async (reactionType: ReactionType) => {
    if (!user) return { error: new Error("Not logged in") };

    try {
      // Remove existing reaction first
      await supabase
        .from("reactions")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", postId);

      // Add new reaction
      const { error } = await supabase
        .from("reactions")
        .insert({
          user_id: user.id,
          post_id: postId,
          reaction_type: reactionType,
        });

      if (error) throw error;

      // Get post owner for notification
      const { data: post } = await supabase
        .from("posts")
        .select("user_id")
        .eq("id", postId)
        .single();

      // Create notification if reacting to someone else's post
      if (post && post.user_id !== user.id) {
        await (supabase.from("notifications" as any) as any).insert({
          user_id: post.user_id,
          actor_id: user.id,
          type: "like",
          post_id: postId,
        });
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const removeReaction = async () => {
    if (!user) return { error: new Error("Not logged in") };

    try {
      const { error } = await supabase
        .from("reactions")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", postId);

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  return { addReaction, removeReaction };
}

export function useSavePost(postId: string) {
  const { user } = useAuth();

  const savePost = async () => {
    if (!user) return { error: new Error("Not logged in") };

    try {
      const { error } = await supabase
        .from("saved_posts")
        .insert({ user_id: user.id, post_id: postId });

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const unsavePost = async () => {
    if (!user) return { error: new Error("Not logged in") };

    try {
      const { error } = await supabase
        .from("saved_posts")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", postId);

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  return { savePost, unsavePost };
}
