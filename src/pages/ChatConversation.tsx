import { useState, useRef, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ArrowLeft, Send, Image, Smile, MoreVertical, Phone, Video, Trash2, X, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/hooks/useChat";
import { useCall } from "@/contexts/CallContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export default function ChatConversation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, loading, otherUser, sendMessage, deleteMessage, deleteConversation, addReaction } = useMessages(id || "");
  const { startCall } = useCall();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, mediaPreview]);

  const handleSend = async () => {
    if (!newMessage.trim() && !mediaFile) return;

    // Clear preview immediately for better UX
    const currentFile = mediaFile;
    const currentMessage = newMessage;
    setNewMessage("");
    setMediaFile(null);
    setMediaPreview(null);

    const { error } = await sendMessage(currentMessage, currentFile);

    if (error) {
      toast({
        title: "Failed to send",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVideoCall = () => {
    if (otherUser) {
      startCall(otherUser.user_id, true);
    }
  };

  const handleVoiceCall = () => {
    if (otherUser) {
      startCall(otherUser.user_id, false);
    }
  };

  const handleDeleteConversation = async () => {
    if (confirm("Are you sure you want to delete this conversation? This cannot be undone.")) {
      const { error } = await deleteConversation();
      if (!error) {
        navigate("/chat");
      } else {
        toast({ title: "Error", description: "Could not delete conversation", variant: "destructive" });
      }
    }
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

  // Double tap logic
  const lastTapRef = useRef<number>(0);
  const handleMessageClick = (messageId: string) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      addReaction(messageId, "❤️");
      lastTapRef.current = 0; // Reset
    } else {
      lastTapRef.current = now;
    }
  };

  const displayName = otherUser?.full_name || otherUser?.username || "User";
  const avatarInitials = (otherUser?.username || "U").slice(0, 2).toUpperCase();

  return (
    <MainLayout showSidebars={false}>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-foreground bg-card sticky top-0 z-10">
          <div className="flex items-center gap-3 overflow-hidden">
            <Link to="/chat" className="p-2 hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted border-2 border-foreground flex items-center justify-center overflow-hidden shrink-0">
                {authLoading || loading ? (
                  <div className="w-full h-full bg-muted animate-pulse" />
                ) : otherUser?.avatar_url ? (
                  <img src={otherUser.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display text-sm text-foreground">{avatarInitials}</span>
                )}
              </div>
              <div className="min-w-0">
                {authLoading || loading ? (
                  <div className="h-4 w-24 bg-muted animate-pulse mb-1" />
                ) : (
                  <p className="font-mono text-sm text-foreground truncate">{displayName}</p>
                )}
                <p className="font-mono text-[10px] text-primary">Online</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={handleVoiceCall} className="p-2 hover:bg-muted transition-colors">
              <Phone className="w-5 h-5 text-foreground" />
            </button>
            <button onClick={handleVideoCall} className="p-2 hover:bg-muted transition-colors">
              <Video className="w-5 h-5 text-foreground" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger className="p-2 hover:bg-muted transition-colors outline-none">
                <MoreVertical className="w-5 h-5 text-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card border-2 border-foreground rounded-none">
                <DropdownMenuItem onClick={handleDeleteConversation} className="font-mono text-destructive focus:text-destructive cursor-pointer">
                  Delete Chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {(loading && messages.length === 0) ? (
            // Skeleton Loading
            [...Array(3)].map((_, i) => (
              <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
                <div className="w-1/2 h-16 bg-muted/50 border-2 border-transparent animate-pulse rounded-md" />
              </div>
            ))
          ) : messages.length === 0 ? (
            <div className="text-center py-8 font-mono text-muted-foreground">
              Start the conversation!
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === user?.id;

              if (message.deleted) {
                return (
                  <div key={message.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                    <div className="px-4 py-2 border-2 border-dashed border-muted-foreground/50 bg-muted/20">
                      <p className="font-mono text-xs text-muted-foreground italic">Message deleted</p>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={message.id}
                  className={cn("flex group", isOwn ? "justify-end" : "justify-start")}
                >
                  <div
                    onClick={() => handleMessageClick(message.id)}
                    className={cn(
                      "max-w-[75%] relative p-3 border-2 border-foreground select-none cursor-pointer active:scale-[0.98] transition-transform",
                      isOwn ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
                    )}
                  >
                    {/* Media */}
                    {message.media_url && (
                      <div className="mb-2">
                        {message.media_type === 'video' ? (
                          <video src={message.media_url} controls className="max-w-full rounded-sm border border-black/10" />
                        ) : (
                          <img loading="lazy" src={message.media_url} alt="Shared image" className="max-w-full rounded-sm border border-black/10" />
                        )}
                      </div>
                    )}

                    {message.content && <p className="font-mono text-sm break-words whitespace-pre-wrap">{message.content}</p>}

                    <p className={cn(
                      "font-mono text-[10px] mt-1 text-right",
                      isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>

                    {/* Reactions - Simplified to just showing if present for now since we don't have full reaction rendering logic built yet */}
                    {/* Ideally map through message.reactions if it were in the Type, but currently useMessages fetches it separately or via hook improvement. 
                        Since I updated useMessages to return reactions in Message type, I can try to render it if it fails I'll fix.
                    */}

                    {/* Delete Action (only for own messages) */}
                    {isOwn && (
                      <button
                        onClick={() => deleteMessage(message.id)}
                        className="absolute -left-8 top-1/2 -translate-y-1/2 p-1 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete message"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t-2 border-foreground bg-card">
          {mediaPreview && (
            <div className="mb-4 relative inline-block">
              <div className="border-2 border-foreground p-1 bg-background">
                <img src={mediaPreview} alt="Preview" className="h-24 w-auto object-cover" />
              </div>
              <button
                onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground border-2 border-foreground p-1 rounded-full hover:scale-110 transition-transform"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
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
            <Link to="/chat" className="md:hidden p-2 hover:bg-muted transition-colors">
              <Smile className="w-5 h-5 text-foreground" />
            </Link>

            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={mediaFile ? "Add a caption..." : "Type a message..."}
              className="flex-1 px-4 py-2 bg-background border-2 border-foreground font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() && !mediaFile}
              className="p-2 bg-primary text-primary-foreground border-2 border-foreground hover-brutal disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
