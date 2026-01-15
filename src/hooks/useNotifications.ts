import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  type: "follow" | "like" | "comment" | "message" | "mention";
  user_id: string;
  actor_id: string;
  post_id: string | null;
  message_id: string | null;
  read: boolean;
  created_at: string;
  actor_profile?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Use raw SQL-style query for the new notifications table
      const { data: notifData, error } = await supabase
        .from("notifications" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching notifications:", error);
        setLoading(false);
        return;
      }

      // Fetch actor profiles
      const actorIds = [...new Set((notifData as any[])?.map((n: any) => n.actor_id) || [])];
      
      let profilesMap = new Map();
      if (actorIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, username, display_name, avatar_url")
          .in("user_id", actorIds);
        profilesMap = new Map(profilesData?.map(p => [p.user_id, p]));
      }

      const enrichedNotifications = (notifData as any[])?.map((notif: any) => ({
        ...notif,
        actor_profile: profilesMap.get(notif.actor_id) || null,
      })) || [];

      setNotifications(enrichedNotifications as Notification[]);
      setUnreadCount(enrichedNotifications.filter((n: any) => !n.read).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    if (!user) return;

    // Subscribe to realtime notifications
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const newNotif = payload.new as any;
          
          // Fetch actor profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id, username, display_name, avatar_url")
            .eq("user_id", newNotif.actor_id)
            .single();

          setNotifications(prev => [{ ...newNotif, actor_profile: profile } as Notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, user]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      await (supabase.from("notifications" as any) as any)
        .update({ read: true })
        .eq("id", notificationId);

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await (supabase.from("notifications" as any) as any)
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch: fetchNotifications };
}
