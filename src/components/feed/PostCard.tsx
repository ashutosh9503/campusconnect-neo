import { useState, useEffect } from "react";
import { MessageSquare, Share2, Bookmark, MoreHorizontal, Send, X, Trash2, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReaction, useSavePost } from "@/hooks/usePosts";
import { useComments } from "@/hooks/useComments";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { SharePostModal } from "@/components/feed/SharePostModal";
import { Card3D } from "@/components/3d/Card3D";

type ReactionType = Database["public"]["Enums"]["reaction_type"];

interface Post {
  id: string;
  user_id: string;
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
  }[];
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
  const [showShareModal, setShowShareModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single();
      if (data?.username === 'ashutosh9503') setIsAdmin(true);
    };
    checkAdmin();
  }, [user]);

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

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
    setShowShareModal(true);
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

  const nextMedia = () => {
    if (post.media && currentMediaIndex < post.media.length - 1) {
      setCurrentMediaIndex(prev => prev + 1);
    }
  };

  const prevMedia = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(prev => prev - 1);
    }
  };

  // Convert legacy single media to array if needed (though usePosts handles it now)
  const mediaItems = post.media || [];

  return (
    <>
    <Card3D
      className={cn(
        "h-full",
        post.isSpan === "row" && "md:col-span-2",
        post.isSpan === "col" && "md:row-span-2",
        post.isSpan === "both" && "md:col-span-2 md:row-span-2"
      )}
      maxTilt={6}
      depth={14}
      glowColor="lime"
    >
      <article className="bento-item animate-fade-in h-full flex flex-col justify-between transform-style-3d">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 transform-style-3d">
        <Link
          to={`/profile/${post.author.username}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 bg-muted border-2 border-foreground flex items-center justify-center overflow-hidden">
            {post.author.avatar.startsWith("http") ? (
              <img src={post.author.avatar} alt={post.author.username} className="w-full h-full object-cover" />
            ) : (
              <span className="font-display text-sm text-foreground">{post.author.avatar}</span>
            )}
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
          {user && (user.id === post.user_id || isAdmin) && (
            <DropdownMenu>
              <DropdownMenuTrigger className="p-1 hover:bg-muted transition-colors outline-none">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32 bg-card border-2 border-foreground rounded-none z-50">
                <DropdownMenuItem
                  onClick={async () => {
                    if (confirm("Delete this post?")) {
                      // We need to pass deletePost from parent or use hook here. 
                      // Since usePosts is a list hook, maybe better to expose a single delete hook or pass it down.
                      // Using usePosts inside PostCard might trigger full refetch or be weird if logic isn't shared.
                      // Actually PostCard is properly isolated. Let's assume we pass a handleDelete prop or use a new useDeletePost hook.
                      // Simplest: direct supabase call here or generic hook.
                      // But wait, the list needs to update. PostCard receives validation from onUpdate?
                      // Actually, let's use the new deletePost from usePosts but we can't easily access the parent's instance.
                      // Better: create useDeletePost hook or just call supabase directly here and trigger onUpdate.

                      const { error } = await supabase.from('posts').delete().eq('id', post.id);
                      if (error) {
                        toast({ title: "Error", description: error.message, variant: "destructive" });
                      } else {
                        toast({ title: "Post deleted" });
                        if (onUpdate) onUpdate();
                      }
                    }
                  }}
                  className="font-mono text-xs text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="font-mono text-sm text-foreground mb-3 leading-relaxed">
        {post.content}
      </p>

      {/* Media Carousel */}
      {mediaItems.length > 0 && (
        <div className="mb-3 border-2 border-foreground overflow-hidden bg-black relative group/media">
          <div className="w-full h-[300px] sm:h-[400px] bg-black flex items-center justify-center">
            {mediaItems[currentMediaIndex].type === "image" ? (
              <img
                src={mediaItems[currentMediaIndex].url}
                alt={`Post media ${currentMediaIndex + 1}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <video
                src={mediaItems[currentMediaIndex].url}
                controls
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Navigation Controls */}
          {mediaItems.length > 1 && (
            <>
              {currentMediaIndex > 0 && (
                <button
                  onClick={(e) => { e.preventDefault(); prevMedia(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover/media:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              {currentMediaIndex < mediaItems.length - 1 && (
                <button
                  onClick={(e) => { e.preventDefault(); nextMedia(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover/media:opacity-100 transition-opacity"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
              {/* Dots */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {mediaItems.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      idx === currentMediaIndex ? "bg-primary" : "bg-white/50"
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Like Button */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => handleReaction("w")}
          disabled={loading}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 border-2 transition-all font-mono text-xs rounded-full",
            activeReaction === "w"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-transparent text-muted-foreground border-muted hover:border-foreground hover:bg-muted/10",
            loading && "opacity-50 cursor-not-allowed"
          )}
        >
          <Heart className={cn("w-4 h-4", activeReaction === "w" && "fill-current")} />
          <span>{reactions["w"] || 0}</span>
        </button>
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
    </Card3D>
    <SharePostModal
      post={post}
      isOpen={showShareModal}
      onClose={() => setShowShareModal(false)}
    />
  </>
  );
}
