import { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ArrowLeft, Camera, Image, Video, X, Send } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function CreatePost() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not logged in
  if (!user) {
    return (
      <MainLayout showSidebars={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="font-display text-xl text-foreground mb-4">LOGIN REQUIRED</h2>
            <p className="font-mono text-sm text-muted-foreground mb-4">
              You need to be logged in to create posts
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground border-2 border-foreground font-mono text-sm hover-brutal"
            >
              LOGIN
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (file.type.startsWith("image/")) {
      setMediaType("image");
    } else if (file.type.startsWith("video/")) {
      setMediaType("video");
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select an image or video file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file under 50MB",
        variant: "destructive",
      });
      return;
    }

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !mediaFile) {
      toast({
        title: "Empty post",
        description: "Please add some content or media",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get authoritative user
      const { data: { user: safeUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !safeUser) throw new Error("Authentication error. Please login again.");

      let mediaUrl = null;

      // Upload media if present
      if (mediaFile) {
        const fileExt = mediaFile.name.split(".").pop();
        const fileName = `${safeUser.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("posts-media")
          .upload(fileName, mediaFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("posts-media")
          .getPublicUrl(fileName);

        mediaUrl = urlData.publicUrl;
      }

      // Create post
      const { error } = await supabase
        .from("posts")
        .insert({
          user_id: safeUser.id,
          content: content.trim(),
          media_url: mediaUrl,
          media_type: mediaType,
        });

      if (error) throw error;

      toast({
        title: "Post created! 🎉",
        description: "Your post has been published successfully",
      });

      navigate("/");
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast({
        title: "Error creating post",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout showSidebars={false}>
      <div className="min-h-screen flex flex-col max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-foreground">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
            <h1 className="font-display text-xl text-foreground">CREATE POST</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && !mediaFile)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border-2 border-foreground font-mono text-sm",
              "bg-primary text-primary-foreground hover-brutal",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
            )}
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? "POSTING..." : "POST"}</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary border-2 border-foreground flex items-center justify-center">
              <span className="font-display text-sm text-primary-foreground">
                {user.email?.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-mono text-sm text-foreground">{user.email?.split("@")[0]}</p>
              <p className="font-mono text-[10px] text-muted-foreground">TSDC • 2024</p>
            </div>
          </div>

          {/* Text Input */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening at campus? 🎓"
            className="w-full min-h-[200px] p-4 bg-card border-2 border-foreground font-mono text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
          />

          {/* Media Preview */}
          {mediaPreview && (
            <div className="mt-4 relative">
              <button
                onClick={removeMedia}
                className="absolute top-2 right-2 z-10 p-2 bg-background border-2 border-foreground hover:bg-destructive transition-colors"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
              <div className="border-2 border-foreground overflow-hidden">
                {mediaType === "image" ? (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full max-h-96 object-cover"
                  />
                ) : (
                  <video
                    src={mediaPreview}
                    controls
                    className="w-full max-h-96 object-cover"
                  />
                )}
              </div>
            </div>
          )}

          {/* Media Buttons */}
          <div className="flex items-center gap-2 mt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={openFilePicker}
              className="flex items-center gap-2 px-4 py-2 bg-card border-2 border-foreground font-mono text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span>Camera</span>
            </button>
            <button
              onClick={openFilePicker}
              className="flex items-center gap-2 px-4 py-2 bg-card border-2 border-foreground font-mono text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Image className="w-4 h-4" />
              <span>Gallery</span>
            </button>
            <button
              onClick={openFilePicker}
              className="flex items-center gap-2 px-4 py-2 bg-card border-2 border-foreground font-mono text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Video className="w-4 h-4" />
              <span>Video</span>
            </button>
          </div>

          {/* Character Count */}
          <div className="mt-4 text-right">
            <span className={cn(
              "font-mono text-xs",
              content.length > 500 ? "text-destructive" : "text-muted-foreground"
            )}>
              {content.length}/500
            </span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
