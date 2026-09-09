import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card3D } from "@/components/3d/Card3D";
import { useUserPreferences, PRESET_CONFIGS, PresetType } from "@/contexts/UserPreferenceContext";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { usePosts } from "@/hooks/usePosts";
import { PostCard3D } from "@/components/feed/PostCard3D";
import { Sparkles, Sliders, Layers, RotateCw, Eye, MessageSquare, Shield, Compass, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function NeoSpace() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { posts } = usePosts();
  const { preferences, applyPreset, updatePreferences } = useUserPreferences();
  const [activeTab, setActiveTab] = useState<"spatial" | "customize">("spatial");

  const displayName = profile?.full_name || profile?.username || user?.email?.split("@")[0] || "User";
  const avatarInitials = (profile?.username || user?.email || "U").slice(0, 2).toUpperCase();

  const presets: PresetType[] = ["Minimal", "Classic", "3D", "Cinematic", "Productivity", "Creator"];

  // Format sample post for 3D demonstration
  const samplePost = posts[0] ? {
    id: posts[0].id,
    user_id: posts[0].user_id,
    author: {
      name: posts[0].profile?.full_name || posts[0].profile?.username || "User",
      username: posts[0].profile?.username || "user",
      avatar: posts[0].profile?.avatar_url || (posts[0].profile?.username || "U").slice(0, 2).toUpperCase(),
      stream: posts[0].profile?.stream || "CS",
      year: posts[0].profile?.year || "TY",
    },
    content: posts[0].content,
    media: posts[0].media,
    reactions: posts[0].reactions_count || { brainrot: 5, w: 12, l: 1, coffee: 3 },
    comments: posts[0].comments_count || 2,
    timestamp: "Just now",
    user_reaction: posts[0].user_reaction,
    is_saved: posts[0].is_saved,
  } : {
    id: "demo-post",
    user_id: user?.id || "demo-user",
    author: {
      name: displayName,
      username: profile?.username || "user",
      avatar: profile?.avatar_url || avatarInitials,
      stream: profile?.stream || "CS",
      year: profile?.year || "TY",
    },
    content: "Welcome to NEO SPACE — your personal interactive 3D digital operating environment on CampusConnect! Drag, tilt, flip cards, and personalize your theme.",
    reactions: { brainrot: 14, w: 28, l: 0, coffee: 9 },
    comments: 4,
    timestamp: "Live",
  };

  return (
    <MainLayout>
      <div className="min-h-screen p-4 md:p-6 space-y-6">
        {/* Spatial Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-card border-2 border-foreground shadow-brutal-lime relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-primary text-primary-foreground font-mono text-[10px] font-bold border border-foreground">
                PERSONAL DIGITAL SPACE
              </span>
              <span className="px-2 py-0.5 bg-secondary text-secondary-foreground font-mono text-[10px] font-bold border border-foreground animate-pulse">
                NEO SPACE v2.0
              </span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl text-foreground">
              {displayName.toUpperCase()}'S SPACE
            </h1>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              Your customized 3D operating workspace. Drag, flip cards, and personalize interface layouts.
            </p>
          </div>

          <div className="flex items-center gap-2 relative z-10">
            <button
              onClick={() => setActiveTab("spatial")}
              className={cn(
                "px-4 py-2 font-mono text-xs border-2 border-foreground transition-all",
                activeTab === "spatial"
                  ? "bg-primary text-primary-foreground font-bold shadow-brutal"
                  : "bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              SPATIAL 3D
            </button>
            <button
              onClick={() => setActiveTab("customize")}
              className={cn(
                "px-4 py-2 font-mono text-xs border-2 border-foreground transition-all flex items-center gap-1.5",
                activeTab === "customize"
                  ? "bg-secondary text-secondary-foreground font-bold shadow-brutal"
                  : "bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              <Sliders className="w-3.5 h-3.5" />
              CUSTOMIZER
            </button>
          </div>
        </div>

        {activeTab === "spatial" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: 3D Avatar & Identity Card */}
            <div className="space-y-6">
              <Card3D maxTilt={12} depth={25} glowColor="lime">
                <div className="p-6 bg-card border-2 border-foreground shadow-brutal-lime flex flex-col items-center text-center relative overflow-hidden transform-style-3d">
                  <div className="w-24 h-24 bg-primary border-4 border-foreground shadow-brutal flex items-center justify-center overflow-hidden mb-4 animate-float-3d">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display text-3xl text-primary-foreground">{avatarInitials}</span>
                    )}
                  </div>
                  <h2 className="font-display text-lg text-foreground">{displayName}</h2>
                  <p className="font-mono text-xs text-primary font-bold mt-1">@{profile?.username || "user"}</p>

                  <div className="flex items-center gap-2 mt-3">
                    <span className="px-2 py-1 bg-muted border border-foreground font-mono text-[10px] text-foreground font-bold">
                      {profile?.stream || "CS"}
                    </span>
                    <span className="px-2 py-1 bg-secondary text-secondary-foreground font-mono text-[10px] font-bold border border-foreground">
                      {profile?.year || "TY"}
                    </span>
                  </div>

                  <div className="w-full pt-4 mt-4 border-t-2 border-border text-left space-y-2">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-muted-foreground">3D Mode:</span>
                      <span className="text-primary font-bold uppercase">{preferences.post3D.mode}</span>
                    </div>
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-muted-foreground">Active Preset:</span>
                      <span className="text-secondary font-bold uppercase">{preferences.preset}</span>
                    </div>
                  </div>
                </div>
              </Card3D>

              {/* Presets Quick Switcher */}
              <div className="p-4 bg-card border-2 border-foreground space-y-3 shadow-brutal">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xs text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                    SPACE PRESETS
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => applyPreset(preset)}
                      className={cn(
                        "p-2 font-mono text-xs border-2 border-foreground transition-all text-center",
                        preferences.preset === preset
                          ? "bg-primary text-primary-foreground font-bold shadow-brutal"
                          : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Center Column: 3D Interactive Rotatable Post Demo */}
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-center justify-between p-3 bg-muted/40 border-2 border-foreground">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <RotateCw className="w-4 h-4 text-primary animate-spin" />
                  <span className="font-bold text-foreground">3D ROTATABLE & FLIPPABLE POST</span>
                  <span className="text-muted-foreground hidden sm:inline">(Click & drag or flip card)</span>
                </div>
                <button
                  onClick={() => updatePreferences({
                    post3D: {
                      ...preferences.post3D,
                      mode: preferences.post3D.mode === "flip" ? "tilt" : "flip"
                    }
                  })}
                  className="px-3 py-1 bg-card border-2 border-foreground font-mono text-xs hover:bg-muted font-bold text-primary"
                >
                  MODE: {preferences.post3D.mode.toUpperCase()}
                </button>
              </div>

              {/* 3D Post Card */}
              <PostCard3D post={samplePost} />
            </div>
          </div>
        ) : (
          /* Customizer Panel */
          <div className="bg-card border-2 border-foreground p-6 space-y-6 shadow-brutal">
            <h2 className="font-display text-lg text-foreground flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />
              INTERFACE CUSTOMIZER
            </h2>

            {/* 3D Post Settings */}
            <div className="p-4 border-2 border-foreground space-y-4">
              <h3 className="font-display text-xs text-primary">POST 3D & ROTATION SETTINGS</h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["flat", "tilt", "flip", "parallax"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updatePreferences({ post3D: { ...preferences.post3D, mode } })}
                    className={cn(
                      "p-3 border-2 border-foreground font-mono text-xs uppercase font-bold transition-all text-center",
                      preferences.post3D.mode === mode
                        ? "bg-primary text-primary-foreground shadow-brutal"
                        : "bg-background text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* Tilt Intensity */}
              <div>
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span>3D Tilt Angle Limit:</span>
                  <span className="text-primary font-bold">{preferences.post3D.maxTilt}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={preferences.post3D.maxTilt}
                  onChange={(e) => updatePreferences({
                    post3D: { ...preferences.post3D, maxTilt: parseInt(e.target.value) }
                  })}
                  className="w-full accent-primary bg-background border border-foreground h-2"
                />
              </div>
            </div>

            {/* Feed Layout Selection */}
            <div className="p-4 border-2 border-foreground space-y-4">
              <h3 className="font-display text-xs text-secondary">FEED LAYOUT STYLE</h3>
              <div className="grid grid-cols-3 gap-2">
                {(["bento", "grid", "list"] as const).map((layout) => (
                  <button
                    key={layout}
                    onClick={() => updatePreferences({ feedLayout: layout })}
                    className={cn(
                      "p-3 border-2 border-foreground font-mono text-xs uppercase font-bold transition-all text-center",
                      preferences.feedLayout === layout
                        ? "bg-secondary text-secondary-foreground shadow-brutal"
                        : "bg-background text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {layout}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
