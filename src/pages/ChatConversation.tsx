import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ArrowLeft, Send, Image, Smile, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

const mockMessages: Message[] = [
  { id: "1", senderId: "1", content: "Bro, DBMS ka assignment dekha?", timestamp: "10:30 AM", isOwn: false },
  { id: "2", senderId: "me", content: "Haan bhai, kab submit karna hai?", timestamp: "10:31 AM", isOwn: true },
  { id: "3", senderId: "1", content: "Kal 11:59 PM deadline hai", timestamp: "10:31 AM", isOwn: false },
  { id: "4", senderId: "me", content: "Shi hai, aaj raat ko karunga", timestamp: "10:32 AM", isOwn: true },
  { id: "5", senderId: "1", content: "Bhai library mein milte hai? 4 baje?", timestamp: "10:33 AM", isOwn: false },
  { id: "6", senderId: "me", content: "Done! 3rd floor pe AC chal raha hai apparently 💀", timestamp: "10:34 AM", isOwn: true },
  { id: "7", senderId: "1", content: "NO WAY FR?? 😭", timestamp: "10:34 AM", isOwn: false },
];

export default function ChatConversation() {
  const { id } = useParams();
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: Date.now().toString(),
      senderId: "me",
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    };
    
    setMessages([...messages, message]);
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <MainLayout showSidebars={false}>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b-2 border-foreground bg-card">
          <Link to="/chat" className="p-2 hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-muted border-2 border-foreground flex items-center justify-center">
              <span className="font-display text-sm text-foreground">RK</span>
            </div>
            <div>
              <p className="font-mono text-sm text-foreground">Rahul Kumar</p>
              <p className="font-mono text-[10px] text-primary">Online</p>
            </div>
          </div>
          <button className="p-2 hover:bg-muted transition-colors">
            <MoreVertical className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.isOwn ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[75%] p-3 border-2 border-foreground",
                  message.isOwn
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground"
                )}
              >
                <p className="font-mono text-sm">{message.content}</p>
                <p className={cn(
                  "font-mono text-[10px] mt-1",
                  message.isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  {message.timestamp}
                </p>
              </div>
            </div>
          ))}
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
