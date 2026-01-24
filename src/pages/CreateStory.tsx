import { useState, useRef, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ArrowLeft, Camera, SwitchCamera, X, Check, Image } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function CreateStory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not logged in
  if (!user) {
    return (
      <MainLayout showSidebars={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="font-display text-xl text-foreground mb-4">LOGIN REQUIRED</h2>
            <p className="font-mono text-sm text-muted-foreground mb-4">
              You need to be logged in to create stories
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

  const startCamera = async () => {
    try {
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });

      setStream(mediaStream);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Camera error:", error);
      setHasPermission(false);
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to create stories",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const switchCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror for selfie camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(imageData);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) setCapturedBlob(blob);
    }, "image/jpeg", 0.9);

    // Stop the stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Support images and videos
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image or video file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast({
        title: "File too large",
        description: "Max 50MB allowed for stories",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setCapturedImage(e.target?.result as string);
      setCapturedBlob(file);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    reader.readAsDataURL(file);
  };

  const retake = () => {
    setCapturedImage(null);
    setCapturedBlob(null);
    startCamera();
  };

  const submitStory = async () => {
    if (!capturedBlob || !user) return;

    setIsSubmitting(true);

    try {
      // Upload to storage
      const fileExt = capturedBlob.type.split('/')[1];
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("stories")
        .upload(fileName, capturedBlob);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("stories")
        .getPublicUrl(fileName);

      // Create story record with 24h expiry
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const mediaType = capturedBlob.type.startsWith('video/') ? 'video' : 'image';

      const { error } = await supabase
        .from("stories")
        .insert({
          user_id: user.id,
          media_url: urlData.publicUrl,
          media_type: mediaType,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Story posted! ✨",
        description: "Your story will be visible for 24 hours",
      });

      navigate("/");
    } catch (error: any) {
      console.error("Error creating story:", error);
      toast({
        title: "Error creating story",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout showSidebars={false}>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-foreground">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
            <h1 className="font-display text-xl text-foreground">ADD STORY</h1>
          </div>
        </div>

        {/* Camera/Preview Area */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
          {capturedImage ? (
            capturedBlob?.type.startsWith('video/') ? (
              <video src={capturedImage} controls className="w-full h-full object-contain" />
            ) : (
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-contain"
              />
            )
          ) : hasPermission === false ? (
            // Permission Denied
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Camera className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="font-display text-lg text-foreground mb-2">CAMERA ACCESS NEEDED</h2>
              <p className="font-mono text-sm text-muted-foreground mb-4">
                Allow camera access to capture stories
              </p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-primary text-primary-foreground border-2 border-foreground font-mono text-sm hover-brutal"
              >
                TRY AGAIN
              </button>
            </div>
          ) : (
            // Camera View
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
              />
              <canvas ref={canvasRef} className="hidden" />
            </>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 border-t-2 border-foreground">
          {capturedImage ? (
            // Preview Controls
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={retake}
                className="flex items-center gap-2 px-6 py-3 bg-card border-2 border-foreground font-mono text-sm text-foreground hover-brutal"
              >
                <X className="w-5 h-5" />
                <span>RETAKE</span>
              </button>
              <button
                onClick={submitStory}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground border-2 border-foreground font-mono text-sm hover-brutal disabled:opacity-50"
              >
                <Check className="w-5 h-5" />
                <span>{isSubmitting ? "POSTING..." : "POST STORY"}</span>
              </button>
            </div>
          ) : (
            // Camera Controls
            <div className="flex items-center justify-between">
              {/* Gallery Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-card border-2 border-foreground hover-brutal"
              >
                <Image className="w-6 h-6 text-foreground" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Capture Button */}
              <button
                onClick={capturePhoto}
                disabled={!hasPermission}
                className="w-16 h-16 bg-foreground border-4 border-primary flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-primary" />
              </button>

              {/* Switch Camera */}
              <button
                onClick={switchCamera}
                className="p-3 bg-card border-2 border-foreground hover-brutal"
              >
                <SwitchCamera className="w-6 h-6 text-foreground" />
              </button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
