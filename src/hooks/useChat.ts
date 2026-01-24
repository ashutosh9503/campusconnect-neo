import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  media_url?: string | null;
  media_type?: "image" | "video" | null;
  shared_post_id?: string | null;
  deleted?: boolean;
  seen?: boolean;
  failed?: boolean;
  reactions?: Record<string, string>; // userId -> emoji
  sender_profile?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface Conversation {
  id: string;
  name: string | null;
  is_group: boolean;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  other_user?: {
    user_id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: memberData } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (!memberData?.length) {
        setLoading(false);
        setConversations([]);
        return;
      }

      const conversationIds = memberData.map(p => p.conversation_id);

      const { data: convData } = await supabase
        .from("conversations")
        .select("*")
        .in("id", conversationIds)
        .order("updated_at", { ascending: false });

      const enrichedConversations = await Promise.all(
        (convData || []).map(async conv => {
          let otherUser = null;

          if (!conv.is_group) {
            const { data: members } = await supabase
              .from("conversation_members")
              .select("user_id")
              .eq("conversation_id", conv.id)
              .neq("user_id", user.id);

            if (members?.[0]) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("id, username, full_name, avatar_url")
                .eq("id", members[0].user_id)
                .single();

              if (profile) {
                otherUser = {
                  user_id: profile.id,
                  username: profile.username,
                  full_name: profile.full_name,
                  avatar_url: profile.avatar_url
                };
              }
            }
          }

          const { data: lastMsg } = await supabase
            .from("messages" as any)
            .select("*")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          // Count unread messages
          const { count: unreadCount } = await (supabase
            .from("messages" as any)
            .select("*", { count: 'exact', head: true })
            .eq("conversation_id", conv.id)
            .neq("sender_id", user.id)
            .eq("seen", false) as any);

          let displayMessage = "No messages yet";
          if (lastMsg) {
            const isDeleted = (lastMsg as any).deleted;
            if (isDeleted) displayMessage = "Message deleted";
            else if ((lastMsg as any).content) displayMessage = (lastMsg as any).content;
            else if ((lastMsg as any).media_url) displayMessage = "📷 Sent an image";
          }

          return {
            ...conv,
            other_user: otherUser,
            last_message: displayMessage,
            last_message_at: lastMsg ? (lastMsg as any).created_at : null,
            unread_count: unreadCount || 0
          };
        })
      );

      setConversations(enrichedConversations as Conversation[]);

      // Deduplicate conversations (prefer ones with messages or newer)
      const uniqueConversationsMap = new Map<string, Conversation>();

      (enrichedConversations as Conversation[]).forEach(conv => {
        if (conv.is_group) {
          // Keep all group chats
          uniqueConversationsMap.set(conv.id, conv);
        } else {
          // For 1:1, check if we already have a convo with this user
          const otherId = conv.other_user?.user_id;
          if (otherId) {
            const existing = uniqueConversationsMap.get(otherId);
            if (!existing) {
              uniqueConversationsMap.set(otherId, conv);
            } else {
              // We have a duplicate. Keep the one with messages, or the newer one.
              const existingHasMsg = existing.last_message && existing.last_message !== "No messages yet";
              const currentHasMsg = conv.last_message && conv.last_message !== "No messages yet";

              if (currentHasMsg && !existingHasMsg) {
                uniqueConversationsMap.set(otherId, conv);
              } else if (currentHasMsg === existingHasMsg) {
                // Both have messages (or neither), pick newer
                if (new Date(conv.updated_at) > new Date(existing.updated_at)) {
                  uniqueConversationsMap.set(otherId, conv);
                }
              }
            }
          } else {
            // No other user found (ghost chat? keep it by ID)
            uniqueConversationsMap.set(conv.id, conv);
          }
        }
      });

      const uniqueConversations = Array.from(uniqueConversationsMap.values())
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      setConversations(uniqueConversations);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();

    if (!user) return;

    const channel = supabase.channel('conversations_list')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          const newMsg = payload.new as Message;

          setConversations(prev => {
            // Check if we have this conversation
            const existingIdx = prev.findIndex(c => c.id === newMsg.conversation_id);

            if (existingIdx === -1) {
              // New conversation? Fetch it.
              fetchConversations();
              return prev;
            }

            const updatedConversations = [...prev];
            const conv = { ...updatedConversations[existingIdx] };

            // Update last message details
            conv.last_message = newMsg.content || (newMsg.media_url ? "📷 Sent an image" : "Message");
            conv.last_message_at = newMsg.created_at;
            conv.updated_at = newMsg.created_at; // For sorting

            // Increment unread if not from us
            if (newMsg.sender_id !== user.id) {
              conv.unread_count = (conv.unread_count || 0) + 1;
            }

            // Move to top
            updatedConversations.splice(existingIdx, 1);
            updatedConversations.unshift(conv);

            return updatedConversations;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConversations, user]);

  return { conversations, loading, refetch: fetchConversations };
}

export function useMessages(conversationId: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const processedMessageIds = useRef<Set<string>>(new Set());
  const [otherUser, setOtherUser] = useState<{
    user_id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null>(null);

  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Request notification permission on mount
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !user) {
      setLoading(false);
      return;
    }

    try {
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      const senderIds = [...new Set(messagesData?.map(m => m.sender_id) || [])];

      let profilesMap = new Map();
      if (senderIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .in("id", senderIds);

        profilesMap = new Map(profilesData?.map(p => [p.id, p]));
      }

      const enrichedMessages = messagesData?.map(msg => {
        processedMessageIds.current.add(msg.id);
        return {
          ...msg,
          // map legacy reactions if needed, but for now we assume separate table or not implementing full reactions right now
          sender_profile: profilesMap.get(msg.sender_id) || null,
        };
      }) || [];

      setMessages(enrichedMessages as Message[]);

      const { data: members } = await supabase
        .from("conversation_members")
        .select("user_id")
        .eq("conversation_id", conversationId)
        .neq("user_id", user.id);

      if (members?.[0]) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .eq("id", members[0].user_id)
          .single();

        if (profile) {
          setOtherUser({
            user_id: profile.id,
            username: profile.username,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url
          });
        }
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user]);

  useEffect(() => {
    fetchMessages();

    // Setup Realtime with Presence for typing
    const channel = supabase.channel(`messages:${conversationId}`, {
      config: {
        presence: {
          key: user?.id,
        },
      },
    });

    channelRef.current = channel;

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as Message;

            // Check if already processed (deduplication)
            if (processedMessageIds.current.has(newMsg.id)) return;
            processedMessageIds.current.add(newMsg.id);

            // Browser Notification
            if (document.hidden && newMsg.sender_id !== user?.id && "Notification" in window && Notification.permission === "granted") {
              new Notification(`New message from ${otherUser?.username || "CampusConnect"}`, {
                body: newMsg.content || "Sent a media file",
                icon: "/favicon.ico" // assume default
              });
            }

            const { data: profile } = await supabase
              .from("profiles")
              .select("id, username, full_name, avatar_url")
              .eq("id", newMsg.sender_id)
              .single();

            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, {
                ...newMsg,
                sender_profile: profile ? {
                  username: profile.username,
                  full_name: profile.full_name,
                  avatar_url: profile.avatar_url
                } : undefined
              }];
            });

            // If message received while typing, clear other typing
            if (newMsg.sender_id !== user?.id) {
              setOtherUserTyping(false);
            }

          } else if (payload.eventType === "UPDATE") {
            const updatedMsg = payload.new as Message;
            setMessages(prev => prev.map(m => m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m));
          }
        }
      )
      .on("presence", { event: "sync" }, () => {
        const newState = channel.presenceState();
        // Check if anyone else is typing
        const othersTyping = Object.keys(newState).some(key => key !== user?.id && (newState[key] as any)?.[0]?.isTyping);
        setOtherUserTyping(othersTyping);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        if (key !== user?.id && (newPresences as any)?.[0]?.isTyping) {
          setOtherUserTyping(true);
        }
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        if (key !== user?.id) {
          setOtherUserTyping(false); // Simplified
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // await channel.track({ isTyping: false });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchMessages, user, otherUser]); // otherUser added for notification name

  const sendMessage = async (content: string, file?: File | null) => {
    if (!user || (!content.trim() && !file)) return { error: new Error("Invalid") };

    const tempId = crypto.randomUUID();
    let mediaUrl = null;
    let mediaType = null;

    if (file) {
      mediaType = file.type.startsWith("image/") ? "image" : "video";
    }

    const optimisticMessage: Message = {
      id: tempId,
      content: content.trim(),
      sender_id: user.id,
      conversation_id: conversationId,
      created_at: new Date().toISOString(),
      media_url: file ? URL.createObjectURL(file) : null,
      media_type: mediaType as any,
      seen: false,
      sender_profile: {
        username: user.email?.split("@")[0] || "user",
        full_name: user.email?.split("@")[0] || "User",
        avatar_url: null
      }
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${conversationId}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("chat-media")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("chat-media")
          .getPublicUrl(fileName);

        mediaUrl = urlData.publicUrl;
      }

      const { data, error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
        media_url: mediaUrl,
        media_type: mediaType,
      } as any).select().single();

      if (error) throw error;

      if (data) {
        processedMessageIds.current.add(data.id);
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, ...data } : m));
      }

      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      // Create Notification for the receiver
      const { data: members } = await supabase
        .from("conversation_members")
        .select("user_id")
        .eq("conversation_id", conversationId)
        .neq("user_id", user.id);

      if (members) {
        // For 1-on-1, typically one member, for group multiple.
        // Assuming direct chat primarily for now or notifying all others.
        const notifications = members.map(m => ({
          user_id: m.user_id,
          actor_id: user.id,
          type: "message",
          content: `${user.email?.split("@")[0] || "User"}: ${content.substring(0, 50)}${content.length > 50 ? "..." : ""}`,
          reference_id: conversationId,
          created_at: new Date().toISOString()
        }));

        if (notifications.length > 0) {
          await (supabase.from("notifications" as any) as any).insert(notifications);
        }
      }

      return { error: null };
    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, failed: true } : m));
      return { error: err };
    }
  };

  const deleteMessage = async (messageId: string) => {
    // Optimistic: Mark as deleted locally first
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, deleted: true, media_url: null, content: "This message was deleted" } : m));

    try {
      // 1. Fetch message to check for media
      const { data: msg } = await (supabase
        .from("messages") as any)
        .select("media_url")
        .eq("id", messageId)
        .single();

      if (msg?.media_url) {
        const { extractFilePathFromUrl, deleteStorageFile } = await import("@/utils/storageUtils");
        const path = extractFilePathFromUrl(msg.media_url, "chat-media");
        if (path) {
          await deleteStorageFile("chat-media", path);
        }
      }

      // 2. Soft Delete in DB
      const { error } = await supabase
        .from("messages")
        .update({ deleted: true, media_url: null, content: "This message was deleted" } as any) // Clear media_url in DB too
        .eq("id", messageId);

      if (error) throw error;
    } catch (err) {
      console.error("Failed to delete message:", err);
      // Revert optimistic update (optional, but tricky without knowing previous state. 
      // Usually we just let it fail silently or show toast, but keeping UI "deleted" is fine for now)
    }
  };

  const deleteConversation = async () => {
    try {
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      const { error } = await supabase.from('message_reactions' as any).upsert({
        message_id: messageId,
        user_id: user?.id,
        emoji: emoji
      }, { onConflict: 'message_id,user_id' });

      if (error) throw error;
    } catch (err) {
      console.error("Error adding reaction:", err);
    }
  };

  const markAsSeen = async () => {
    if (!user) return;
    try {
      // Mark all unseen messages from others as seen
      await supabase.from("messages" as any)
        .update({ seen: true } as any)
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .eq("seen", false);

      // Optimistically update local state
      setMessages(prev => prev.map(m => {
        if (m.sender_id !== user.id && !m.seen) {
          return { ...m, seen: true };
        }
        return m;
      }));
    } catch (err) {
      console.error("Error marking as seen:", err);
    }
  };

  const sendTyping = async (isTyping: boolean) => {
    if (channelRef.current) {
      await channelRef.current.track({ isTyping });
    }
  };

  return { messages, loading, otherUser, otherUserTyping, sendMessage, deleteMessage, deleteConversation, addReaction, markAsSeen, sendTyping, refetch: fetchMessages };
}

export function useStartConversation() {
  const { user } = useAuth();

  const startConversation = async (otherUserId: string) => {
    if (!user) return { conversationId: null, error: new Error("Not logged in") };

    try {
      const { data: myConvs } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (myConvs?.length) {
        const convIds = myConvs.map(c => c.conversation_id);
        const { data: theirConvs } = await supabase
          .from("conversation_members")
          .select("conversation_id")
          .eq("user_id", otherUserId)
          .in("conversation_id", convIds);

        for (const conv of theirConvs || []) {
          const { data: convData } = await supabase
            .from("conversations")
            .select("id, is_group")
            .eq("id", conv.conversation_id)
            .eq("is_group", false)
            .single();

          if (convData) {
            return { conversationId: convData.id, error: null };
          }
        }
      }

      const newConversationId = crypto.randomUUID();
      const { error: convError } = await supabase
        .from("conversations")
        .insert({ id: newConversationId, is_group: false });
      if (convError) throw convError;

      const { error: memberError } = await supabase.from("conversation_members").insert([
        { conversation_id: newConversationId, user_id: user.id },
        { conversation_id: newConversationId, user_id: otherUserId },
      ]);
      if (memberError) throw memberError;

      return { conversationId: newConversationId, error: null };
    } catch (err: any) {
      console.error("Start conversation error:", err);
      return { conversationId: null, error: err };
    }
  };

  return { startConversation };
}
