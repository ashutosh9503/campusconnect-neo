import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  User,
  Bell,
  Lock,
  Smartphone,
  Moon,
  LogOut,
  ChevronRight,
  Shield,
  HelpCircle,
  Save,
  Camera,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type StreamType = Database["public"]["Enums"]["stream_type"];
type YearType = Database["public"]["Enums"]["year_type"];

const streamOptions: StreamType[] = ["CS", "IT", "EXTC", "MECH", "CIVIL", "OTHER"];
const yearOptions: YearType[] = ["FY", "SY", "TY", "FINAL"];

// PWA Install Hook
function usePwaInstall() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return false;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      return true;
    }
    return false;
  };

  return { canInstall: !!installPrompt && !isInstalled, isInstalled, install };
}

export default function Settings() {
  const { signOut } = useAuth();
  const { profile, updateProfile, refetch } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { canInstall, isInstalled, install } = usePwaInstall();

  const [editMode, setEditMode] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [stream, setStream] = useState<StreamType>(profile?.stream || "CS");
  const [year, setYear] = useState<YearType>(profile?.year || "FY");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setBio(profile.bio || "");
      setStream(profile.stream || "CS");
      setYear(profile.year || "FY");
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      full_name: fullName,
      bio,
      stream,
      year,
    });

    if (error) {
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Profile updated!" });
      setEditMode(false);
      refetch();
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      await updateProfile({ avatar_url: publicUrl });
      toast({ title: "Avatar updated!" });
      refetch();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleInstallApp = async () => {
    if (isInstalled) {
      toast({ title: "App is already installed!" });
      return;
    }

    if (canInstall) {
      const success = await install();
      if (success) {
        toast({ title: "App installed successfully! 🎉" });
      }
    } else {
      // Show manual install instructions
      toast({
        title: "Install CampusConnect",
        description: "On iOS: tap Share → Add to Home Screen. On Android: tap menu → Install App",
      });
    }
  };

  const settingsGroups = [
    {
      title: "APP",
      items: [
        {
          icon: isInstalled ? Smartphone : Download,
          label: isInstalled ? "App Installed" : "Install App",
          description: isInstalled ? "CampusConnect is installed on your device" : "Add CampusConnect to your home screen",
          action: handleInstallApp,
          highlight: canInstall,
        },
        { icon: Moon, label: "Appearance", description: "Always dark mode (OLED optimized)" },
      ],
    },
    {
      title: "SUPPORT",
      items: [
        { icon: HelpCircle, label: "Help Center", description: "FAQs and support" },
        { icon: Shield, label: "Report Issue", description: "Report bugs or inappropriate content" },
      ],
    },
    {
      title: "DANGER ZONE",
      items: [
        { icon: LogOut, label: "Sign Out", description: "Sign out of your account", danger: true, action: handleSignOut },
      ],
    },
  ];
  return (
    <MainLayout showSidebars={false}>
      <div className="min-h-screen max-w-2xl mx-auto">
        {/* Header */}
        <div className="p-4 border-b-2 border-foreground sticky top-0 bg-background z-10">
          <h1 className="font-display text-xl text-foreground">SETTINGS</h1>
        </div>

        {/* Edit Profile Section */}
        <div className="p-4 border-b-2 border-foreground">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xs text-muted-foreground">EDIT PROFILE</h2>
            {editMode ? (
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground border-2 border-foreground font-mono text-xs hover-brutal disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "SAVING..." : "SAVE"}
              </button>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="font-mono text-xs text-primary hover:underline"
              >
                EDIT
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-muted border-2 border-foreground flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display text-xl text-foreground">
                      {(profile?.username || "U").slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary border-2 border-foreground flex items-center justify-center cursor-pointer">
                  <Camera className="w-3 h-3 text-primary-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
              <div>
                <p className="font-mono text-sm text-foreground">@{profile?.username || "user"}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {uploadingAvatar ? "Uploading..." : "Tap camera to change"}
                </p>
              </div>
            </div>

            {editMode ? (
              <>
                {/* Display Name */}
                <div>
                  <label className="font-mono text-xs text-muted-foreground">FULL NAME</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full mt-1 p-3 bg-background border-2 border-foreground font-mono text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="font-mono text-xs text-muted-foreground">BIO</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    maxLength={150}
                    className="w-full mt-1 p-3 bg-background border-2 border-foreground font-mono text-sm focus:outline-none focus:border-primary resize-none"
                  />
                  <p className="font-mono text-[10px] text-muted-foreground text-right">{bio.length}/150</p>
                </div>

                {/* Stream & Year */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-xs text-muted-foreground">STREAM</label>
                    <select
                      value={stream}
                      onChange={(e) => setStream(e.target.value as StreamType)}
                      className="w-full mt-1 p-3 bg-background border-2 border-foreground font-mono text-sm focus:outline-none focus:border-primary"
                    >
                      {streamOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-xs text-muted-foreground">YEAR</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value as YearType)}
                      className="w-full mt-1 p-3 bg-background border-2 border-foreground font-mono text-sm focus:outline-none focus:border-primary"
                    >
                      {yearOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <p className="font-mono text-sm text-foreground">{profile?.full_name || "No name"}</p>
                <p className="font-mono text-xs text-muted-foreground">{profile?.bio || "No bio yet"}</p>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-primary/20 text-primary font-mono text-[10px] border border-primary">
                    {profile?.stream || "CS"}
                  </span>
                  <span className="px-2 py-1 bg-secondary/20 text-secondary font-mono text-[10px] border border-secondary">
                    {profile?.year || "FY"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings Groups */}
        <div className="p-4 space-y-6">
          {settingsGroups.map((group) => (
            <div key={group.title}>
              <h2 className="font-display text-xs text-muted-foreground mb-2">{group.title}</h2>
              <div className="border-2 border-foreground divide-y-2 divide-border">
                {group.items.map((item: any) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 hover:bg-muted transition-colors text-left",
                      item.danger && "hover:bg-destructive/10",
                      item.highlight && "bg-primary/10"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 border-2 border-foreground flex items-center justify-center",
                      item.danger ? "bg-destructive/20" : item.highlight ? "bg-primary/20" : "bg-muted"
                    )}>
                      <item.icon className={cn(
                        "w-5 h-5",
                        item.danger ? "text-destructive" : item.highlight ? "text-primary" : "text-foreground"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-mono text-sm",
                        item.danger ? "text-destructive" : item.highlight ? "text-primary" : "text-foreground"
                      )}>
                        {item.label}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 text-center border-t-2 border-foreground mt-8">
          <p className="font-mono text-xs text-muted-foreground">
            CampusConnect v1.0.0
          </p>
          <p className="font-mono text-[10px] text-muted-foreground mt-1">
            TSDC Edition •
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
