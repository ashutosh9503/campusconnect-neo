import { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ArrowLeft, Camera, Image, Video, X, Send } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function CreatePost() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Post created! 🎉",
      description: "Your post has been published successfully",
    });
    
    navigate("/");
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
            <div className="w-10 h-10 bg-muted border-2 border-foreground flex items-center justify-center">
              <span className="font-display text-sm text-foreground">GU</span>
            </div>
            <div>
              <p className="font-mono text-sm text-foreground">Guest User</p>
              <p className="font-mono text-[10px] text-muted-foreground">TSNDC • 2024</p>
            </div>
          </div>

          {/* Text Input */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening at campus? 🎓"
            className="w-full min-h-[200px] p-4 bg-card border-2 border-foreground font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
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
