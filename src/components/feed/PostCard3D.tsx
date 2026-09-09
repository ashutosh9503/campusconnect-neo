import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Share2, Bookmark, Heart, RotateCcw, Sparkles, ChevronLeft, ChevronRight, CornerUpRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useUserPreferences } from "@/contexts/UserPreferenceContext";

interface PostCard3DProps {
  post: {
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
    user_reaction?: string | null;
    is_saved?: boolean;
  };
  onUpdate?: () => void;
}

export function PostCard3D({ post, onUpdate }: PostCard3DProps) {
  const { preferences } = useUserPreferences();
  const cardRef = useRef<HTMLDivElement | null>(null);

  const [isFlipped, setIsFlipped] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const mode = preferences.post3D.mode;
  const maxTilt = preferences.post3D.maxTilt;

  // Handle Mouse Drag / Touch Swipe Rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode !== "flip") return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;

    if (isDragging && mode === "flip") {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setRotateY((prev) => prev + deltaX * 0.5);
      setRotateX((prev) => Math.max(-30, Math.min(30, prev - deltaY * 0.3)));
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (mode === "tilt" || mode === "parallax") {
      // Desktop mouse-follow hover tilt
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

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (mode === "tilt" || mode === "parallax") {
      setRotateX(0);
      setRotateY(0);
    }
  };

  // Mobile Touch Drag
  const handleTouchStart = (e: React.TouchEvent) => {
    if (mode !== "flip") return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && mode === "flip" && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - dragStart.x;
      const deltaY = e.touches[0].clientY - dragStart.y;
      setRotateY((prev) => prev + deltaX * 0.6);
      setRotateX((prev) => Math.max(-25, Math.min(25, prev - deltaY * 0.4)));
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
    setRotateY((prev) => (isFlipped ? 0 : 180));
    setRotateX(0);
  };

  const resetRotation = () => {
    setRotateX(0);
    setRotateY(0);
    setIsFlipped(false);
  };

  const mediaItems = post.media || [];

  const finalRotateY = rotateY + (isFlipped ? 180 : 0);

  return (
    <div
      className="perspective-1500 w-full select-none"
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
          transform: `rotateX(${rotateX.toFixed(1)}deg) rotateY(${finalRotateY.toFixed(1)}deg)`,
          transition: isDragging ? "none" : "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
        }}
        className={cn(
          "transform-style-3d relative w-full rounded-none border-2 border-foreground bg-card shadow-brutal-lime transition-shadow cursor-grab active:cursor-grabbing",
          isDragging && "shadow-brutal-3d-purple"
        )}
      >
        {/* Flip Controls Bar */}
        <div className="flex items-center justify-between p-2.5 bg-muted/60 border-b-2 border-foreground transform-style-3d">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-[10px] text-muted-foreground uppercase font-bold">
              3D POST CARD {isFlipped ? "(BACK)" : "(FRONT)"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetRotation}
              className="p-1 hover:bg-background border border-foreground font-mono text-[10px] flex items-center gap-1 transition-colors"
              title="Reset 3D View"
            >
              <RotateCcw className="w-3 h-3" />
              <span>RESET</span>
            </button>
            <button
              onClick={toggleFlip}
              className="px-2 py-0.5 bg-primary text-primary-foreground border border-foreground font-mono text-[10px] font-bold hover:scale-105 transition-transform flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>FLIP CARD 🔄</span>
            </button>
          </div>
        </div>

        {/* FRONT SIDE CONTENT */}
        <div
          className={cn(
            "p-4 transform-style-3d transition-opacity duration-300",
            isFlipped ? "opacity-0 pointer-events-none hidden" : "opacity-100"
          )}
        >
          {/* Author Header */}
          <div className="flex items-start justify-between mb-3 transform-style-3d">
            <Link
              to={`/profile/${post.author.username}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-primary border-2 border-foreground flex items-center justify-center overflow-hidden shadow-brutal translate-z-20">
                {post.author.avatar.startsWith("http") ? (
                  <img src={post.author.avatar} alt={post.author.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display text-sm text-primary-foreground">{post.author.avatar}</span>
                )}
              </div>
              <div>
                <p className="font-mono text-sm text-foreground font-bold">{post.author.name}</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  @{post.author.username} • {post.author.stream} • {post.author.year}
                </p>
              </div>
            </Link>
            <span className="font-mono text-[10px] text-muted-foreground">{post.timestamp}</span>
          </div>

          {/* Text Content */}
          <p className="font-mono text-sm text-foreground mb-3 leading-relaxed translate-z-10">
            {post.content}
          </p>

          {/* Media Carousel */}
          {mediaItems.length > 0 && (
            <div className="mb-3 border-2 border-foreground overflow-hidden bg-black relative group/media translate-z-20">
              <div className="w-full h-[280px] sm:h-[360px] bg-black flex items-center justify-center">
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
            </div>
          )}

          {/* Reactions & Actions */}
          <div className="flex items-center justify-between pt-3 border-t-2 border-border translate-z-20">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary border border-primary font-mono text-xs rounded-full font-bold">
                <Heart className="w-3.5 h-3.5 fill-current" />
                {post.reactions.w || 0}
              </span>
            </div>

            <div className="flex items-center gap-4 text-muted-foreground font-mono text-xs">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4 text-primary" />
                {post.comments}
              </span>
              <button onClick={toggleFlip} className="flex items-center gap-1 text-secondary hover:underline font-bold">
                <CornerUpRight className="w-4 h-4" />
                <span>Details & Comments</span>
              </button>
            </div>
          </div>
        </div>

        {/* BACK SIDE CONTENT */}
        <div
          className={cn(
            "p-5 transform-style-3d bg-card transition-opacity duration-300",
            !isFlipped ? "opacity-0 pointer-events-none hidden" : "opacity-100"
          )}
          style={{ transform: "rotateY(180deg)" }}
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-foreground">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              <h3 className="font-display text-sm text-foreground">POST DETAILS & METADATA</h3>
            </div>
            <span className="font-mono text-[10px] text-primary font-bold">ID: #{post.id.slice(0, 6)}</span>
          </div>

          <div className="space-y-4 font-mono text-xs text-foreground">
            {/* Reaction Breakdown */}
            <div className="p-3 bg-muted/30 border border-foreground space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Reaction Breakdown</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-1.5 bg-background border border-border">
                  <span className="text-sm">🏆</span>
                  <p className="text-[10px] text-primary font-bold">{post.reactions.w}</p>
                </div>
                <div className="p-1.5 bg-background border border-border">
                  <span className="text-sm">🧠</span>
                  <p className="text-[10px] text-primary font-bold">{post.reactions.brainrot}</p>
                </div>
                <div className="p-1.5 bg-background border border-border">
                  <span className="text-sm">💀</span>
                  <p className="text-[10px] text-primary font-bold">{post.reactions.l}</p>
                </div>
                <div className="p-1.5 bg-background border border-border">
                  <span className="text-sm">☕</span>
                  <p className="text-[10px] text-primary font-bold">{post.reactions.coffee}</p>
                </div>
              </div>
            </div>

            {/* Author Information */}
            <div className="p-3 bg-muted/30 border border-foreground space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Author Bio & Department</p>
              <p className="text-xs text-foreground font-bold">@{post.author.username} ({post.author.name})</p>
              <p className="text-[10px] text-muted-foreground">Department: {post.author.stream} • Year: {post.author.year}</p>
            </div>

            {/* AI Summary / Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={toggleFlip}
                className="flex-1 py-2 bg-primary text-primary-foreground border-2 border-foreground font-mono text-xs font-bold hover-brutal text-center"
              >
                RETURN TO FRONT
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
