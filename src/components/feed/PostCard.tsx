import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Share2,
  Bookmark,
  MoreHorizontal,
  Send,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Heart,
  RotateCcw,
  Sparkles,
  CornerUpRight,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useReaction, useSavePost } from "@/hooks/usePosts";
import { useComments } from "@/hooks/useComments";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPreferences } from "@/contexts/UserPreferenceContext";
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

const reactionEmojis: Record<ReactionType, { emoji: string; label: string }> = {
  w: { emoji: "🏆", label: "W" },
  brainrot: { emoji: "🧠", label: "Brainrot" },
  l: { emoji: "💀", label: "L" },
  coffee: { emoji: "☕", label: "Coffee" },
};

export function PostCard({ post, onUpdate }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { preferences } = useUserPreferences();
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
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // 3D Card State
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const post3DConfig = preferences?.post3D || { mode: "flip", maxTilt: 10, depth: 20, autoRotate: false };
  const mode = post3DConfig.mode;
  const maxTilt = post3DConfig.maxTilt;

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("username").eq("id", user.id).single();
      if (data?.username === "ashutosh9503") setIsAdmin(true);
    };
    checkAdmin();
  }, [user]);

  // 3D Mouse Drag & Hover Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest("input") || target.closest("textarea")) {
      return;
    }
    if (mode === "flip" || mode === "tilt") {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;

    if (isDragging && (mode === "flip" || mode === "tilt")) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setRotateY((prev) => prev + deltaX * 0.4);
      setRotateX((prev) => Math.max(-30, Math.min(30, prev - deltaY * 0.3)));
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (mode === "tilt" || mode === "parallax") {
      if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return;
      const rect = cardRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const mouseX = (e.clientX - rect.left - width / 2) / (width / 2);
      const mouseY = (e.clientY - rect.top - height / 2) / (height / 2);
      setRotateX(-mouseY * maxTilt);
      setRotateY(mouseX * maxTilt);
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (mode === "tilt" || mode === "parallax") {
      setRotateX(0);
      setRotateY(0);
    }
  };

  // Mobile Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest("input") || target.closest("textarea")) {
      return;
    }
    if ((mode === "flip" || mode === "tilt") && e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && (mode === "flip" || mode === "tilt") && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - dragStart.x;
      const deltaY = e.touches[0].clientY - dragStart.y;
      setRotateY((prev) => prev + deltaX * 0.5);
      setRotateX((prev) => Math.max(-25, Math.min(25, prev - deltaY * 0.3)));
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const toggleFlip = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsFlipped(!isFlipped);
    setRotateY((prev) => (isFlipped ? 0 : 180));
    setRotateX(0);
  };

  const resetRotation = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRotateX(0);
    setRotateY(0);
    setIsFlipped(false);
  };

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
        setReactions((prev) => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
        setActiveReaction(null);
      }
    } else {
      if (activeReaction) {
        setReactions((prev) => ({
          ...prev,
          [activeReaction]: Math.max(0, prev[activeReaction] - 1),
        }));
      }
      const { error } = await addReaction(type);
      if (!error) {
        setReactions((prev) => ({ ...prev, [type]: prev[type] + 1 }));
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

  const handleShare = () => {
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

  const mediaItems = post.media || [];
  const finalRotateY = rotateY + (isFlipped ? 180 : 0);

  return (
    <>
      <div
        className={cn(
          "perspective-1500 w-full select-none h-full",
          post.isSpan === "row" && "md:col-span-2",
          post.isSpan === "col" && "md:row-span-2",
          post.isSpan === "both" && "md:col-span-2 md:row-span-2"
        )}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div
          ref={cardRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => setIsDragging(false)}
          style={{
            transform: mode !== "flat" ? `rotateX(${rotateX.toFixed(1)}deg) rotateY(${finalRotateY.toFixed(1)}deg)` : "none",
            transition: isDragging ? "none" : "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
          }}
          className={cn(
            "transform-style-3d relative w-full h-full rounded-none border-2 border-foreground bg-card shadow-brutal-lime transition-shadow cursor-grab active:cursor-grabbing flex flex-col justify-between",
            isDragging && "shadow-brutal-3d-purple"
          )}
        >
          {/* Top 3D Control Header Bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-muted/70 border-b-2 border-foreground transform-style-3d shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-[10px] text-muted-foreground uppercase font-bold">
                {isFlipped ? "3D POST CARD (BACK)" : "3D POST CARD (FRONT)"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetRotation}
                className="px-1.5 py-0.5 hover:bg-background border border-foreground font-mono text-[10px] flex items-center gap-1 transition-colors text-foreground"
                title="Reset 3D View"
              >
                <RotateCcw className="w-3 h-3 text-primary" />
                <span>RESET</span>
              </button>
              <button
                type="button"
                onClick={toggleFlip}
                className="px-2 py-0.5 bg-primary text-primary-foreground border border-foreground font-mono text-[10px] font-bold hover:scale-105 transition-transform flex items-center gap-1 shadow-sm"
              >
                <Sparkles className="w-3 h-3 text-black" />
                <span>FLIP CARD 🔄</span>
              </button>
            </div>
          </div>

          {/* FRONT SIDE CONTENT */}
          <div
            className={cn(
              "p-4 transform-style-3d flex-1 flex flex-col justify-between transition-opacity duration-300",
              isFlipped ? "opacity-0 pointer-events-none hidden" : "opacity-100"
            )}
          >
            <div>
              {/* Post Header */}
              <div className="flex items-start justify-between mb-3 transform-style-3d">
                <Link
                  to={`/profile/${post.author.username}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-10 h-10 bg-muted border-2 border-foreground flex items-center justify-center overflow-hidden shadow-brutal translate-z-20">
                    {post.author.avatar.startsWith("http") ? (
                      <img src={post.author.avatar} alt={post.author.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display text-sm text-foreground">{post.author.avatar}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-mono text-sm text-foreground font-bold">{post.author.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      @{post.author.username} • {post.author.stream} • {post.author.year}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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
                              const { error } = await supabase.from("posts").delete().eq("id", post.id);
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
              <p className="font-mono text-sm text-foreground mb-3 leading-relaxed translate-z-10">
                {post.content}
              </p>

              {/* Media Carousel */}
              {mediaItems.length > 0 && (
                <div
                  className="mb-3 border-2 border-foreground overflow-hidden bg-black relative group/media translate-z-20"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-full h-[280px] sm:h-[350px] bg-black flex items-center justify-center">
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
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCurrentMediaIndex((prev) => prev - 1);
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover/media:opacity-100 transition-opacity"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                      )}
                      {currentMediaIndex < mediaItems.length - 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCurrentMediaIndex((prev) => prev + 1);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover/media:opacity-100 transition-opacity"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      )}
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
            </div>

            <div>
              {/* Like Button */}
              <div className="flex items-center gap-2 mb-3 translate-z-20" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => handleReaction("w")}
                  disabled={loading}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 border-2 transition-all font-mono text-xs rounded-full",
                    activeReaction === "w"
                      ? "bg-primary text-primary-foreground border-primary font-bold shadow-brutal-lime"
                      : "bg-transparent text-muted-foreground border-muted hover:border-foreground hover:bg-muted/10",
                    loading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Heart className={cn("w-4 h-4", activeReaction === "w" && "fill-current")} />
                  <span>{reactions["w"] || 0}</span>
                </button>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t-2 border-border translate-z-20" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
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
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="font-mono text-xs">Share</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className={cn(
                    "flex items-center gap-2 transition-colors",
                    saved ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground",
                    loading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Bookmark className={cn("w-4 h-4", saved && "fill-current")} />
                  <span className="font-mono text-xs">{saved ? "Saved" : "Save"}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleFlip}
                  className="flex items-center gap-1 text-secondary hover:underline font-bold font-mono text-xs"
                >
                  <CornerUpRight className="w-4 h-4" />
                  <span>Flip Details 🔄</span>
                </button>
              </div>

              {/* Inline Comments on Front */}
              {showComments && (
                <div className="mt-4 pt-4 border-t-2 border-border translate-z-20" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-3 py-2 bg-card border-2 border-foreground font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                      onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
                    />
                    <button
                      type="button"
                      onClick={handleSubmitComment}
                      disabled={submittingComment || !newComment.trim()}
                      className="px-3 py-2 bg-primary text-primary-foreground border-2 border-foreground disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {commentsLoading ? (
                      <p className="font-mono text-xs text-muted-foreground text-center py-2">Loading...</p>
                    ) : comments.length === 0 ? (
                      <p className="font-mono text-xs text-muted-foreground text-center py-2">No comments yet</p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex gap-2 group">
                          <Link to={`/profile/${comment.profile?.username || "user"}`}>
                            <div className="w-7 h-7 bg-muted border border-foreground flex items-center justify-center shrink-0">
                              <span className="font-display text-[9px] text-foreground">
                                {(comment.profile?.username || "U").slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/profile/${comment.profile?.username || "user"}`}
                                className="font-mono text-xs text-foreground hover:underline font-bold"
                              >
                                @{comment.profile?.username || "user"}
                              </Link>
                              {user?.id === comment.user_id && (
                                <button
                                  type="button"
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
            </div>
          </div>

          {/* BACK SIDE CONTENT */}
          <div
            className={cn(
              "p-5 transform-style-3d bg-card flex-1 flex flex-col justify-between transition-opacity duration-300",
              !isFlipped ? "opacity-0 pointer-events-none hidden" : "opacity-100"
            )}
            style={{ transform: "rotateY(180deg)" }}
          >
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-foreground" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  <h3 className="font-display text-sm text-foreground">POST DETAILS & METADATA</h3>
                </div>
                <span className="font-mono text-[10px] text-primary font-bold">ID: #{post.id.slice(0, 6)}</span>
              </div>

              <div className="space-y-4 font-mono text-xs text-foreground" onClick={(e) => e.stopPropagation()}>
                {/* Reaction Breakdown Badges */}
                <div className="p-3 bg-muted/40 border border-foreground space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">REACTION STATS & INTERACTION</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {(["w", "brainrot", "l", "coffee"] as ReactionType[]).map((type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => handleReaction(type)}
                        className={cn(
                          "p-2 border transition-all flex flex-col items-center justify-center rounded-none",
                          activeReaction === type
                            ? "bg-primary text-primary-foreground border-foreground font-bold shadow-brutal"
                            : "bg-background border-border hover:border-foreground text-foreground"
                        )}
                      >
                        <span className="text-base">{reactionEmojis[type].emoji}</span>
                        <span className="text-[10px] font-bold">{reactions[type] || 0}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Author Bio & Department Metadata */}
                <div className="p-3 bg-muted/40 border border-foreground space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">AUTHOR METADATA</p>
                  <p className="text-xs text-foreground font-bold">@{post.author.username} ({post.author.name})</p>
                  <p className="text-[10px] text-muted-foreground">Department: {post.author.stream} • Year: {post.author.year}</p>
                  <p className="text-[10px] text-muted-foreground">Posted: {post.timestamp}</p>
                </div>

                {/* Direct Comment Input on Back Side */}
                <div className="p-3 bg-muted/40 border border-foreground space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">LEAVE A QUICK COMMENT</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Comment from back of card..."
                      className="flex-1 px-3 py-1.5 bg-background border border-foreground font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                      onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
                    />
                    <button
                      type="button"
                      onClick={handleSubmitComment}
                      disabled={submittingComment || !newComment.trim()}
                      className="px-3 py-1.5 bg-primary text-primary-foreground border border-foreground font-bold disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={toggleFlip}
                className="w-full py-2.5 bg-primary text-primary-foreground border-2 border-foreground font-mono text-xs font-bold hover-brutal text-center shadow-brutal"
              >
                RETURN TO FRONT 🔄
              </button>
            </div>
          </div>
        </div>
      </div>

      <SharePostModal
        post={post}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </>
  );
}
