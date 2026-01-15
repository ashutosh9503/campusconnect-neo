import { useState, useRef, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ArrowLeft, Send, Image, Smile, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/hooks/useChat";

export default function ChatConversation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, loading, otherUser, sendMessage } = useMessages(id || "");

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
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    await sendMessage(newMessage);
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (authLoading || loading) {
    return (
      <MainLayout showSidebars={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="font-mono text-muted-foreground">LOADING...</div>
        </div>
      </MainLayout>
    );
  }

  const displayName = otherUser?.display_name || otherUser?.username || "User";
  const avatarInitials = (otherUser?.username || "U").slice(0, 2).toUpperCase();

  return (
    <MainLayout showSidebars={false}>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b-2 border-foreground bg-card">
          <Link to="/chat" className="p-2 hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-muted border-2 border-foreground flex items-center justify-center overflow-hidden">
              {otherUser?.avatar_url ? (
                <img src={otherUser.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-sm text-foreground">{avatarInitials}</span>
              )}
            </div>
            <div>
              <p className="font-mono text-sm text-foreground">{displayName}</p>
              <p className="font-mono text-[10px] text-primary">Online</p>
            </div>
          </div>
          <button className="p-2 hover:bg-muted transition-colors">
            <MoreVertical className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8 font-mono text-muted-foreground">
              Start the conversation!
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[75%] p-3 border-2 border-foreground",
                      isOwn ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
                    )}
                  >
                    <p className="font-mono text-sm">{message.content}</p>
                    <p className={cn(
                      "font-mono text-[10px] mt-1",
                      isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t-2 border-foreground bg-card">
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-muted transition-colors border-2 border-foreground">
              <Image className="w-5 h-5 text-foreground" />
            </button>
            <button className="p-2 hover:bg-muted transition-colors border-2 border-foreground">
              <Smile className="w-5 h-5 text-foreground" />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 bg-background border-2 border-foreground font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim()}
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
