import { useState } from "react";
import { MessageSquare, Share2, Bookmark, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface Post {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
    stream: string;
    year: string;
  };
  content: string;
  media?: {
    type: "image" | "video";
    url: string;
  };
  reactions: {
    brainrot: number;
    w: number;
    l: number;
    coffee: number;
  };
  comments: number;
  timestamp: string;
  isSpan?: "row" | "col" | "both";
}

interface PostCardProps {
  post: Post;
}

const reactionEmojis = {
  brainrot: "🧠",
  w: "🏆",
  l: "💀",
  coffee: "☕",
};

export function PostCard({ post }: PostCardProps) {
  const [reactions, setReactions] = useState(post.reactions);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleReaction = (type: keyof typeof reactions) => {
    if (activeReaction === type) {
      setReactions(prev => ({ ...prev, [type]: prev[type] - 1 }));
      setActiveReaction(null);
    } else {
      if (activeReaction) {
        setReactions(prev => ({ 
          ...prev, 
          [activeReaction]: prev[activeReaction as keyof typeof reactions] - 1,
          [type]: prev[type] + 1 
        }));
      } else {
        setReactions(prev => ({ ...prev, [type]: prev[type] + 1 }));
      }
      setActiveReaction(type);
    }
  };

  return (
    <article 
      className={cn(
        "bento-item animate-fade-in",
        post.isSpan === "row" && "md:col-span-2",
        post.isSpan === "col" && "md:row-span-2",
        post.isSpan === "both" && "md:col-span-2 md:row-span-2"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted border-2 border-foreground flex items-center justify-center">
            <span className="font-display text-sm text-foreground">{post.author.avatar}</span>
          </div>
          <div>
            <p className="font-mono text-sm text-foreground">{post.author.name}</p>
            <p className="font-mono text-[10px] text-muted-foreground">
              @{post.author.username} • {post.author.stream} • {post.author.year}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">{post.timestamp}</span>
          <button className="p-1 hover:bg-muted transition-colors">
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Content */}
      <p className="font-mono text-sm text-foreground mb-3 leading-relaxed">
        {post.content}
      </p>

      {/* Media */}
      {post.media && (
        <div className="mb-3 border-2 border-foreground overflow-hidden">
          {post.media.type === "image" ? (
            <img 
              src={post.media.url} 
              alt="Post media" 
              className="w-full h-48 object-cover"
            />
          ) : (
            <video 
              src={post.media.url} 
              controls 
              className="w-full h-48 object-cover"
            />
          )}
        </div>
      )}

      {/* Reactions */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {(Object.keys(reactions) as Array<keyof typeof reactions>).map((type) => (
          <button
            key={type}
            onClick={() => handleReaction(type)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 border-2 transition-all font-mono text-xs",
              activeReaction === type
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-muted hover:border-foreground"
            )}
          >
            <span>{reactionEmojis[type]}</span>
            <span>{reactions[type]}</span>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t-2 border-border">
        <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <MessageSquare className="w-4 h-4" />
          <span className="font-mono text-xs">{post.comments}</span>
        </button>
        <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <Share2 className="w-4 h-4" />
          <span className="font-mono text-xs">Share</span>
        </button>
        <button 
          onClick={() => setSaved(!saved)}
          className={cn(
            "flex items-center gap-2 transition-colors",
            saved ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Bookmark className={cn("w-4 h-4", saved && "fill-current")} />
          <span className="font-mono text-xs">{saved ? "Saved" : "Save"}</span>
        </button>
      </div>
    </article>
  );
}
