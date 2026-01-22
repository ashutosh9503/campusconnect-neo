import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type StreamType = Database["public"]["Enums"]["stream_type"];
type YearType = Database["public"]["Enums"]["year_type"];

export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  stream: StreamType | null;
  year: YearType | null;
  avatar_url: string | null;
  social_links?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export function useProfile(userId?: string) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetUserId = userId || user?.id;

  const fetchProfile = useCallback(async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetUserId) // Changed from user_id to id
        .single();

      if (error) throw error;
      setProfile({ ...data, user_id: data.id } as Profile);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Omit<Profile, "stream" | "year">> & { stream?: StreamType; year?: YearType; username?: string; social_links?: any }) => {
    if (!targetUserId) return { error: new Error("No user") };

    try {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", targetUserId);

      if (error) throw error;
      await fetchProfile();
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  return { profile, loading, error, updateProfile, refetch: fetchProfile };
}

export function useFollowStats(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!targetUserId) return;

    try {
      // Get followers count
      const { count: followers } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", targetUserId);

      // Get following count
      const { count: following } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", targetUserId);

      setFollowersCount(followers || 0);
      setFollowingCount(following || 0);

      // Check if current user follows this profile
      if (user && user.id !== targetUserId) {
        const { data } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId)
          .single();
        setIsFollowing(!!data);
      }
    } catch (err) {
      console.error("Error fetching follow stats:", err);
    } finally {
      setLoading(false);
    }
  }, [targetUserId, user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const toggleFollow = async () => {
    if (!user || !targetUserId || user.id === targetUserId) return;

    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: targetUserId });

        // Create notification - use type assertion for new table
        await (supabase.from("notifications" as any) as any).insert({
          user_id: targetUserId,
          actor_id: user.id,
          type: "follow",
        });

        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
    }
  };

  return { followersCount, followingCount, isFollowing, toggleFollow, loading, refetch: fetchStats };
}

export function usePostsCount(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  const [postsCount, setPostsCount] = useState(0);

  useEffect(() => {
    if (!targetUserId) return;

    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", targetUserId)
      .then(({ count }) => setPostsCount(count || 0));
  }, [targetUserId]);

  return postsCount;
}
