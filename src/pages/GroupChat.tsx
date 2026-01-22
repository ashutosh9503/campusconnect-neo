import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ArrowLeft, Send, Users, Image, X } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { GroupSettingsModal } from "@/components/groups/GroupSettingsModal";

interface GroupMessage {
    id: string;
    group_id: string;
    user_id: string;
    content: string;
    media_url?: string | null;
    media_type?: "image" | "video" | null;
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
    const { toast } = useToast();
    const [messages, setMessages] = useState<GroupMessage[]>([]);
    const [groupName, setGroupName] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                            .select("username, full_name, avatar_url")
                            .eq("id", newMsg.user_id)
                            .single();

                        setMessages((prev) => {
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
                // Fallback manual join
                const { data: rawMsgs } = await supabase
                    .from("group_messages")
                    .select("*")
                    .eq("group_id", groupId)
                    .order("created_at", { ascending: true });

                if (rawMsgs) {
                    const senderIds = [...new Set(rawMsgs.map((m: any) => m.user_id))];
                    const { data: profiles } = await supabase
                        .from("profiles")
                        .select("id, username, full_name, avatar_url")
                        .in("id", senderIds);

                    const profileMap = new Map(profiles?.map(p => [p.id, p]));
                    const enriched = rawMsgs.map((m: any) => ({
                        ...m,
                        sender_profile: profileMap.get(m.user_id)
                    }));
                    setMessages(enriched as GroupMessage[]);
                }

            } else if (msgs) {
                const formatted = msgs.map((m: any) => ({
                    ...m,
                    user_id: m.user_id || m.sender_id, // Fallback if legacy logic exists
                    sender_profile: m.sender_profile
                }));
                setMessages(formatted as GroupMessage[]);
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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
                return;
            }
            setMediaFile(file);
            setMediaPreview(URL.createObjectURL(file));
        }
    };

    const sendMessage = async () => {
        if ((!newMessage.trim() && !mediaFile) || !user || !groupId) return;

        const content = newMessage.trim();
        const currentFile = mediaFile;

        setNewMessage("");
        setMediaFile(null);
        setMediaPreview(null);

        const tempId = crypto.randomUUID();
        let mediaUrl = null;
        let mediaType = null;

        if (currentFile) {
            mediaType = currentFile.type.startsWith("image/") ? "image" : "video";
            // Preview
            const optimisticMsg: GroupMessage = {
                id: tempId,
                group_id: groupId,
                user_id: user.id,
                content: content,
                created_at: new Date().toISOString(),
                media_url: URL.createObjectURL(currentFile),
                media_type: mediaType as any,
                sender_profile: {
                    username: user.email?.split("@")[0] || "Me",
                    full_name: "Me",
                    avatar_url: null
                }
            };
            setMessages(prev => [...prev, optimisticMsg]);
            scrollToBottom();
        } else {
            // Text only optimistic
            const optimisticMsg: GroupMessage = {
                id: tempId,
                group_id: groupId,
                user_id: user.id,
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
        }

        try {
            if (currentFile) {
                const fileExt = currentFile.name.split(".").pop();
                const fileName = `groups/${groupId}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from("chat-media") // Reuse chat-media or create group-media? chat-media is fine
                    .upload(fileName, currentFile);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from("chat-media")
                    .getPublicUrl(fileName);

                mediaUrl = urlData.publicUrl;
            }

            const { data, error } = await supabase.from("group_messages").insert({
                group_id: groupId,
                user_id: user.id,
                content,
                media_url: mediaUrl,
                media_type: mediaType
            } as any).select().single();

            if (error) throw error;

            // Replace optimistic with real
            if (data) {
                setMessages(prev => prev.map(m => m.id === tempId ? {
                    ...m,
                    id: data.id,
                    created_at: data.created_at,
                    user_id: data.user_id, // Update this too
                    sender_profile: m.sender_profile
                } : m));
            }
        } catch (error: any) {
            console.error("Send error:", error);
            // Don't remove the message, mark it as failed (state not fully implemented yet in UI but this helps debugging)
            toast({
                title: "Error",
                description: error.message || "Failed to send message",
                variant: "destructive"
            });
            // Optional: allow retry? For now just remove optimistic to avoid confusion or keep it with error state
            setMessages(prev => prev.filter(m => m.id !== tempId));
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
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 hover:bg-muted transition-colors"
                    >
                        <Users className="w-5 h-5 text-foreground" />
                    </button>
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
                            const isMe = msg.user_id === user?.id;
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
                                            {msg.media_url && (
                                                <div className="mb-2">
                                                    {msg.media_type === "video" ? (
                                                        <video src={msg.media_url} controls className="max-w-full rounded border border-black/10" />
                                                    ) : (
                                                        <img src={msg.media_url} alt="Media" className="max-w-full rounded border border-black/10" />
                                                    )}
                                                </div>
                                            )}
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
                    {mediaPreview && (
                        <div className="mb-2 relative inline-block">
                            <div className="border-2 border-foreground p-1 bg-background">
                                <img src={mediaPreview} alt="Preview" className="h-20 w-auto object-cover" />
                            </div>
                            <button
                                onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground border-2 border-foreground p-1 rounded-full hover:scale-110"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                    <div className="flex gap-2 items-center">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*,video/*"
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 hover:bg-muted transition-colors border-2 border-foreground"
                        >
                            <Image className="w-5 h-5 text-foreground" />
                        </button>

                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                            placeholder={mediaFile ? "Add caption..." : "Type a message..."}
                            className="flex-1 px-4 py-2 bg-card border-2 border-foreground font-mono text-sm focus:outline-none focus:border-primary"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!newMessage.trim() && !mediaFile}
                            className="px-4 py-2 bg-primary text-primary-foreground border-2 border-foreground hover-brutal disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {groupId && (
                    <GroupSettingsModal
                        groupId={groupId}
                        isOpen={showSettings}
                        onClose={() => setShowSettings(false)}
                        onGroupDeleted={() => navigate("/groups")}
                    />
                )}
            </div>
        </MainLayout>
    );
}
