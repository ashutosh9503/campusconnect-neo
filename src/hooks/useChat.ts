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
  deleted?: boolean;
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
            .from("messages")
            .select("*")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          let displayMessage = "No messages yet";
          if (lastMsg) {
            const isDeleted = (lastMsg as any).deleted;
            if (isDeleted) displayMessage = "Message deleted";
            else if (lastMsg.content) displayMessage = lastMsg.content;
            else if ((lastMsg as any).media_url) displayMessage = "📷 Sent an image";
          }

          return {
            ...conv,
            other_user: otherUser,
            last_message: displayMessage,
            last_message_at: lastMsg?.created_at,
          };
        })
      );

      setConversations(enrichedConversations as Conversation[]);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

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

      // Fetch reactions separate logic or embedded if JSONB
      // Assuming 'reactions' column exists now as per migration

      const enrichedMessages = messagesData?.map(msg => {
        processedMessageIds.current.add(msg.id);
        return {
          ...msg,
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

    const channel = supabase
      .channel(`messages:${conversationId}`)
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

            const { data: profile } = await supabase
              .from("profiles")
              .select("id, username, full_name, avatar_url")
              .eq("id", newMsg.sender_id)
              .single();

            setMessages(prev => {
              // Double check state for ID to be sure
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
          } else if (payload.eventType === "UPDATE") {
            const updatedMsg = payload.new as Message;
            setMessages(prev => prev.map(m => m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchMessages]);

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
        // Replace optimistic message with real message
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, ...data } : m));
      }

      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      return { error: null };
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      return { error: err };
    }
  };

  const deleteMessage = async (messageId: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, deleted: true } : m));

    try {
      const { error } = await supabase
        .from("messages")
        .update({ deleted: true } as any)
        .eq("id", messageId);

      if (error) throw error;
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  const deleteConversation = async () => {
    try {
      // First manually delete messages to ensure cleanup if cascade fails or is delayed (though migration fixes this)
      await supabase.from("messages").delete().eq("conversation_id", conversationId);

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
    // Optimistic reaction?
    // For now let's just push to DB and let realtime handle update
    try {
      const { error } = await supabase.from('message_reactions').upsert({
        message_id: messageId,
        user_id: user?.id,
        emoji: emoji
      }, { onConflict: 'message_id,user_id' });

      if (error) throw error;
    } catch (err) {
      console.error("Error adding reaction:", err);
    }
  };

  return { messages, loading, otherUser, sendMessage, deleteMessage, deleteConversation, addReaction, refetch: fetchMessages };
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
