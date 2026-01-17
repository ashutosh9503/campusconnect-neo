import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Comment {
  id: string;
  content: string;
  user_id: string;
  post_id: string;
  created_at: string;
  profile?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function useComments(postId: string) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);

      const { data: commentsData, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles for all comments
      const userIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
      let profilesMap = new Map();
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .in("id", userIds);
        profilesMap = new Map(profilesData?.map(p => [p.id, p]));
      }

      const enrichedComments = commentsData?.map(comment => ({
        ...comment,
        profile: profilesMap.get(comment.user_id) || null,
      })) || [];

      setComments(enrichedComments);
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async (content: string) => {
    if (!user) return { error: new Error("Not logged in") };
    if (!content.trim()) return { error: new Error("Comment cannot be empty") };

    try {
      const { data: newComment, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Fetch profile for the new comment
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .eq("id", user.id)
        .single();

      setComments(prev => [...prev, { ...newComment, profile }]);

      // Create notification for post owner
      const { data: post } = await supabase
        .from("posts")
        .select("user_id")
        .eq("id", postId)
        .single();

      if (post && post.user_id !== user.id) {
        await (supabase.from("notifications" as any) as any).insert({
          user_id: post.user_id,
          actor_id: user.id,
          type: "comment",
          post_id: postId,
        });
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return { error: new Error("Not logged in") };

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== commentId));
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  return { comments, loading, addComment, deleteComment, refetch: fetchComments };
}
