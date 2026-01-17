import { useState } from "react";
import { MessageSquare, Share2, Bookmark, MoreHorizontal, Send, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReaction, useSavePost } from "@/hooks/usePosts";
import { useComments } from "@/hooks/useComments";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type ReactionType = Database["public"]["Enums"]["reaction_type"];

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
  user_reaction?: ReactionType | null;
  is_saved?: boolean;
}

interface PostCardProps {
  post: Post;
  onUpdate?: () => void;
}

const reactionEmojis: Record<ReactionType, string> = {
  brainrot: "🧠",
  w: "🏆",
  l: "💀",
  coffee: "☕",
};

export function PostCard({ post, onUpdate }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addReaction, removeReaction } = useReaction(post.id);
  const { savePost, unsavePost } = useSavePost(post.id);
  const { comments, loading: commentsLoading, addComment, deleteComment } = useComments(post.id);
  
  const [reactions, setReactions] = useState(post.reactions);
  const [activeReaction, setActiveReaction] = useState<ReactionType | null>(post.user_reaction || null);
  const [saved, setSaved] = useState(post.is_saved || false);
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const handleReaction = async (type: ReactionType) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to react to posts",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    if (activeReaction === type) {
      const { error } = await removeReaction();
      if (!error) {
        setReactions(prev => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
        setActiveReaction(null);
      }
    } else {
      if (activeReaction) {
        setReactions(prev => ({ 
          ...prev, 
          [activeReaction]: Math.max(0, prev[activeReaction] - 1),
        }));
      }
      const { error } = await addReaction(type);
      if (!error) {
        setReactions(prev => ({ ...prev, [type]: prev[type] + 1 }));
        setActiveReaction(type);
      }
    }
    
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to save posts",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    if (saved) {
      const { error } = await unsavePost();
      if (!error) {
        setSaved(false);
        toast({ title: "Post removed from saved" });
      }
    } else {
      const { error } = await savePost();
      if (!error) {
        setSaved(true);
        toast({ title: "Post saved!" });
      }
    }
    
    setLoading(false);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied to clipboard!" });
    } catch {
      toast({ 
        title: "Failed to copy", 
        description: "Could not copy link to clipboard",
        variant: "destructive" 
      });
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to comment",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    setSubmittingComment(true);
    const { error } = await addComment(newComment);
    setSubmittingComment(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setNewComment("");
      if (onUpdate) onUpdate();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await deleteComment(commentId);
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      if (onUpdate) onUpdate();
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
        <Link 
          to={`/profile/${post.author.username}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 bg-muted border-2 border-foreground flex items-center justify-center">
            <span className="font-display text-sm text-foreground">{post.author.avatar}</span>
          </div>
          <div>
            <p className="font-mono text-sm text-foreground">{post.author.name}</p>
            <p className="font-mono text-[10px] text-muted-foreground">
              @{post.author.username} • {post.author.stream} • {post.author.year}
            </p>
          </div>
        </Link>
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
        {(Object.keys(reactions) as Array<ReactionType>).map((type) => (
          <button
            key={type}
            onClick={() => handleReaction(type)}
            disabled={loading}
            className={cn(
              "flex items-center gap-1 px-2 py-1 border-2 transition-all font-mono text-xs",
              activeReaction === type
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-muted hover:border-foreground",
              loading && "opacity-50 cursor-not-allowed"
            )}
          >
            <span>{reactionEmojis[type]}</span>
            <span>{reactions[type]}</span>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t-2 border-border">
        <button 
          onClick={() => setShowComments(!showComments)}
          className={cn(
            "flex items-center gap-2 transition-colors",
            showComments ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="font-mono text-xs">{comments.length || post.comments}</span>
        </button>
        <button 
          onClick={handleShare}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span className="font-mono text-xs">Share</span>
        </button>
        <button 
          onClick={handleSave}
          disabled={loading}
          className={cn(
            "flex items-center gap-2 transition-colors",
            saved ? "text-primary" : "text-muted-foreground hover:text-foreground",
            loading && "opacity-50 cursor-not-allowed"
          )}
        >
          <Bookmark className={cn("w-4 h-4", saved && "fill-current")} />
          <span className="font-mono text-xs">{saved ? "Saved" : "Save"}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t-2 border-border">
          {/* Comment Input */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 bg-card border-2 border-foreground font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
            />
            <button
              onClick={handleSubmitComment}
              disabled={submittingComment || !newComment.trim()}
              className="px-3 py-2 bg-primary text-primary-foreground border-2 border-foreground disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Comments List */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {commentsLoading ? (
              <p className="font-mono text-xs text-muted-foreground text-center py-2">Loading...</p>
            ) : comments.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground text-center py-2">No comments yet</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-2 group">
                  <Link to={`/profile/${comment.profile?.username || "user"}`}>
                    <div className="w-8 h-8 bg-muted border border-foreground flex items-center justify-center flex-shrink-0">
                      <span className="font-display text-[10px] text-foreground">
                        {(comment.profile?.username || "U").slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link 
                        to={`/profile/${comment.profile?.username || "user"}`}
                        className="font-mono text-xs text-foreground hover:underline"
                      >
                        @{comment.profile?.username || "user"}
                      </Link>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                      {user?.id === comment.user_id && (
                        <button 
                          onClick={() => handleDeleteComment(comment.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      )}
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </article>
  );
}
