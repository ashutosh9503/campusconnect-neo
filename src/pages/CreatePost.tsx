import { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ArrowLeft, Camera, Image, Video, X, Send, Plus } from "lucide-react";
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
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<{ url: string; type: "image" | "video" }[]>([]);
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
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPreviews: { url: string; type: "image" | "video" }[] = [];
    const validFiles: File[] = [];

    files.forEach(file => {
      // Check file type
      let type: "image" | "video" | null = null;
      if (file.type.startsWith("image/")) {
        type = "image";
      } else if (file.type.startsWith("video/")) {
        type = "video";
      } else {
        toast({
          title: "Invalid file type",
          description: `Skipped ${file.name}: not an image or video`,
          variant: "destructive",
        });
        return;
      }

      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `Skipped ${file.name}: > 50MB`,
          variant: "destructive",
        });
        return;
      }

      validFiles.push(file);
      newPreviews.push({
        url: URL.createObjectURL(file),
        type
      });
    });

    setMediaFiles(prev => [...prev, ...validFiles]);
    setMediaPreviews(prev => [...prev, ...newPreviews]);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) {
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

      // Upload media if present
      const uploadedMedia: { url: string; type: "image" | "video" }[] = [];

      for (const file of mediaFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${safeUser.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("posts-media")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("posts-media")
          .getPublicUrl(fileName);

        uploadedMedia.push({
          url: urlData.publicUrl,
          type: file.type.startsWith("image/") ? "image" : "video"
        });
      }

      // Create post
      // Backward compatibility: store first media in main table columns if exists
      const firstMedia = uploadedMedia[0];

      const { data: postData, error: postError } = await supabase
        .from("posts")
        .insert({
          user_id: safeUser.id,
          content: content.trim(),
          media_url: firstMedia?.url || null,
          media_type: firstMedia?.type || null,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Insert into post_media
      if (uploadedMedia.length > 0 && postData) {
        console.log("Inserting media for post:", postData.id, uploadedMedia);
        const mediaInserts = uploadedMedia.map(m => ({
          post_id: postData.id,
          url: m.url,
          type: m.type
        }));

        const { error: mediaError } = await supabase
          .from("post_media" as any)
          .insert(mediaInserts);

        if (mediaError) {
          console.error("Error inserting media:", mediaError);
          throw mediaError;
        }
      }

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
            disabled={isSubmitting || (!content.trim() && mediaFiles.length === 0)}
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
            className="w-full min-h-[150px] p-4 bg-card border-2 border-foreground font-mono text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
          />

          {/* Media Preview Carousel */}
          {mediaPreviews.length > 0 && (
            <div className="mt-4 flex gap-4 overflow-x-auto pb-4">
              {mediaPreviews.map((preview, idx) => (
                <div key={idx} className="relative flex-shrink-0 w-64 h-64 border-2 border-foreground bg-black">
                  <button
                    onClick={() => removeMedia(idx)}
                    className="absolute top-2 right-2 z-10 p-1 bg-background border-2 border-foreground hover:bg-destructive transition-colors"
                  >
                    <X className="w-4 h-4 text-foreground" />
                  </button>
                  {preview.type === "image" ? (
                    <img
                      src={preview.url}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <video
                      src={preview.url}
                      controls
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              ))}
              {/* Add more button */}
              <button
                onClick={openFilePicker}
                className="flex-shrink-0 w-24 h-64 border-2 border-dashed border-foreground flex flex-col items-center justify-center hover:bg-muted transition-colors"
              >
                <Plus className="w-8 h-8 text-muted-foreground" />
                <span className="font-mono text-xs text-muted-foreground mt-2">Add</span>
              </button>
            </div>
          )}

          {/* Media Buttons */}
          <div className="flex items-center gap-2 mt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple // Allow multiple files
              onChange={handleFileSelect}
              className="hidden"
            />
            {mediaFiles.length === 0 && (
              <>
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
              </>
            )}

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
