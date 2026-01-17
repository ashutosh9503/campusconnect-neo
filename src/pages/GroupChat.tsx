import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ArrowLeft, Send, Users } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface GroupMessage {
    id: string;
    group_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    sender_profile?: {
        username: string | null;
        full_name: string | null;
        avatar_url: string | null;
    };
}

export default function GroupChat() {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [messages, setMessages] = useState<GroupMessage[]>([]);
    const [groupName, setGroupName] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (groupId && user) {
            fetchGroupDetails();
            fetchMessages();

            const channel = supabase
                .channel(`group_messages:${groupId}`)
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "group_messages",
                        filter: `group_id=eq.${groupId}`,
                    },
                    async (payload) => {
                        const newMsg = payload.new as GroupMessage;

                        // Fetch sender profile
                        const { data: profile } = await supabase
                            .from("profiles")
                            .select("username, full_name, avatar_url") // Fixed: Removed id selection as it's not needed for display
                            .eq("id", newMsg.sender_id)
                            .single();

                        setMessages((prev) => [...prev, {
                            ...newMsg,
                            sender_profile: profile ? {
                                username: profile.username,
                                full_name: profile.full_name,
                                avatar_url: profile.avatar_url
                            } : undefined
                        }]);
                        scrollToBottom();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [groupId, user]);

    const fetchGroupDetails = async () => {
        if (!groupId) return;
        const { data } = await supabase
            .from("groups")
            .select("name")
            .eq("id", groupId)
            .single();
        if (data) setGroupName(data.name);
    };

    const fetchMessages = async () => {
        if (!groupId) return;

        try {
            const { data: msgs, error } = await supabase
                .from("group_messages")
                .select(`
            *,
            sender_profile:profiles!group_messages_sender_id_fkey(username, full_name, avatar_url)
        `)
                .eq("group_id", groupId)
                .order("created_at", { ascending: true });

            if (error) {
                console.error("Error fetching messages:", error);
                // Fallback manual join if relation fails
                const { data: rawMsgs } = await supabase
                    .from("group_messages")
                    .select("*")
                    .eq("group_id", groupId)
                    .order("created_at", { ascending: true });

                if (rawMsgs) {
                    const senderIds = [...new Set(rawMsgs.map((m: any) => m.sender_id))];
                    const { data: profiles } = await supabase
                        .from("profiles")
                        .select("id, username, full_name, avatar_url")
                        .in("id", senderIds);

                    const profileMap = new Map(profiles?.map(p => [p.id, p]));
                    const enriched = rawMsgs.map((m: any) => ({
                        ...m,
                        sender_profile: profileMap.get(m.sender_id)
                    }));
                    setMessages(enriched as GroupMessage[]);
                }

            } else if (msgs) {
                // Transform the nested response
                // @ts-ignore: Supabase types for joined queries can be tricky
                const formatted = msgs.map(m => ({
                    ...m,
                    sender_profile: m.sender_profile
                }));
                setMessages(formatted as unknown as GroupMessage[]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            scrollToBottom();
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }, 100);
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !user || !groupId) return;

        const content = newMessage.trim();
        setNewMessage(""); // Optimistic clear

        // Optimistic Add
        const tempId = crypto.randomUUID();
        const optimisticMsg: GroupMessage = {
            id: tempId,
            group_id: groupId,
            sender_id: user.id,
            content: content,
            created_at: new Date().toISOString(),
            sender_profile: {
                username: user.email?.split("@")[0] || "Me",
                full_name: "Me",
                avatar_url: null
            }
        };
        setMessages(prev => [...prev, optimisticMsg]);
        scrollToBottom();

        const { error } = await supabase.from("group_messages").insert({
            group_id: groupId,
            sender_id: user.id,
            content,
        } as any);

        if (error) {
            console.error("Send error:", error);
            setMessages(prev => prev.filter(m => m.id !== tempId)); // Rollback
        }
    };

    return (
        <MainLayout showSidebars={false}>
            <div className="flex flex-col h-screen max-w-4xl mx-auto bg-background">
                {/* Header */}
                <div className="p-4 border-b-2 border-foreground flex items-center justify-between sticky top-0 bg-background z-10">
                    <div className="flex items-center gap-4">
                        <Link to="/groups" className="p-2 hover:bg-muted transition-colors">
                            <ArrowLeft className="w-5 h-5 text-foreground" />
                        </Link>
                        <div>
                            <h1 className="font-display text-xl text-foreground flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                {groupName || "Group Chat"}
                            </h1>
                            <p className="font-mono text-xs text-muted-foreground">{messages.length} messages</p>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                    {loading ? (
                        <div className="text-center font-mono text-muted-foreground">Loading messages...</div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="font-mono text-muted-foreground">No messages yet. Say hello!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.sender_id === user?.id;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            {!isMe && (
                                                <span className="font-display text-xs text-foreground">
                                                    {msg.sender_profile?.username || "Unknown"}
                                                </span>
                                            )}
                                            <span className="font-mono text-[10px] text-muted-foreground">
                                                {format(new Date(msg.created_at), 'HH:mm')}
                                            </span>
                                        </div>
                                        <div
                                            className={`p-3 border-2 border-foreground font-mono text-sm break-words ${isMe
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-card text-foreground"
                                                }`}
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Input */}
                <div className="p-4 border-t-2 border-foreground bg-background sticky bottom-0">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-2 bg-card border-2 border-foreground font-mono text-sm focus:outline-none focus:border-primary"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!newMessage.trim()}
                            className="px-4 py-2 bg-primary text-primary-foreground border-2 border-foreground hover-brutal disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
