import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Settings, Grid, Bookmark, ArrowLeft, UserPlus, UserCheck, MessageSquare, Instagram, Twitter, Linkedin, Globe } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PostCard } from "@/components/feed/PostCard";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useFollowStats, usePostsCount } from "@/hooks/useProfile";
import { usePosts } from "@/hooks/usePosts";
import { useStartConversation } from "@/hooks/useChat";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { startConversation } = useStartConversation();
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Fetch user ID from username
  useEffect(() => {
    const fetchUserId = async () => {
      if (!username) return;

      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();

      if (data) {
        setProfileUserId(data.id);
      }
      setLoadingProfile(false);
    };

    fetchUserId();
  }, [username]);

  const { profile, loading: profileLoading } = useProfile(profileUserId || undefined);
  const { followersCount, followingCount, isFollowing, toggleFollow, loading: followLoading } = useFollowStats(profileUserId || undefined);
  const postsCount = usePostsCount(profileUserId || undefined);
  const { posts, loading: postsLoading, refetch } = usePosts(profileUserId || undefined, 20, { enabled: !!profileUserId });

  const isOwnProfile = user?.id === profileUserId;

  const handleMessage = async () => {
    if (!profileUserId || !user) {
      toast({
        title: "Login required",
        description: "Please login to send messages",
        variant: "destructive",
      });
      return;
    }

    const { conversationId, error } = await startConversation(profileUserId);
    if (conversationId) {
      navigate(`/chat/${conversationId}`);
    } else if (error) {
      toast({
        title: "Error",
        description: "Could not start conversation",
        variant: "destructive",
      });
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to follow users",
        variant: "destructive",
      });
      return;
    }
    await toggleFollow();
  };

  if (loadingProfile || profileLoading) {
    return (
      <MainLayout showSidebars={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="font-mono text-muted-foreground">LOADING...</div>
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout showSidebars={false}>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <div className="font-display text-xl text-foreground mb-2">USER NOT FOUND</div>
          <p className="font-mono text-sm text-muted-foreground">@{username} doesn't exist</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 flex items-center gap-2 font-mono text-sm text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        </div>
      </MainLayout>
    );
  }

  const displayName = profile.full_name || profile.username || "User";
  const avatarInitials = (profile.username || displayName).slice(0, 2).toUpperCase();

  const formattedPosts = posts.map((post, index) => ({
    id: post.id,
    user_id: post.user_id,
    author: {
      name: post.profile?.full_name || post.profile?.username || "User",
      username: post.profile?.username || "user",
      avatar: (post.profile?.username || "U").slice(0, 2).toUpperCase(),
      stream: post.profile?.stream || "CS",
      year: post.profile?.year || "TY",
    },
    content: post.content,
    media: (post.media && post.media.length > 0) ? post.media : ((post as any).media_url ? [{
      type: ((post as any).media_type === "video" ? "video" : "image") as "image" | "video",
      url: (post as any).media_url
    }] : undefined),
    reactions: post.reactions_count || { brainrot: 0, w: 0, l: 0, coffee: 0 },
    comments: post.comments_count || 0,
    timestamp: new Date(post.created_at).toLocaleDateString(),
    user_reaction: post.user_reaction,
    is_saved: post.is_saved,
  }));

  return (
    <MainLayout showSidebars={false}>
      <div className="min-h-screen max-w-2xl mx-auto">
        {/* Header */}
        <div className="p-4 border-b-2 border-foreground">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted transition-colors">
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <h1 className="font-display text-xl text-foreground">PROFILE</h1>
            </div>
            {isOwnProfile && (
              <Link to="/settings" className="p-2 hover:bg-muted transition-colors">
                <Settings className="w-5 h-5 text-foreground" />
              </Link>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-muted border-2 border-foreground flex items-center justify-center overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-2xl text-foreground">{avatarInitials}</span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-display text-lg text-foreground">{displayName}</h2>
              <p className="font-mono text-xs text-muted-foreground">@{profile.username}</p>
              <div className="flex items-center gap-2 mt-2">
                {profile.stream && (
                  <span className="px-2 py-1 bg-primary text-primary-foreground font-mono text-[10px] border-2 border-foreground">
                    {profile.stream}
                  </span>
                )}
                {profile.year && (
                  <span className="px-2 py-1 bg-secondary text-secondary-foreground font-mono text-[10px] border-2 border-foreground">
                    {profile.year}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="font-mono text-sm text-foreground mt-4">{profile.bio}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <p className="font-display text-xl text-foreground">{postsCount}</p>
              <p className="font-mono text-[10px] text-muted-foreground">POSTS</p>
            </div>
            <div className="text-center">
              <p className="font-display text-xl text-foreground">{followersCount}</p>
              <p className="font-mono text-[10px] text-muted-foreground">FOLLOWERS</p>
            </div>
            <div className="text-center">
              <p className="font-display text-xl text-foreground">{followingCount}</p>
              <p className="font-mono text-[10px] text-muted-foreground">FOLLOWING</p>
            </div>
          </div>

          {/* Action Buttons */}
          {isOwnProfile ? (
            <Link
              to="/settings"
              className="w-full mt-4 py-2 bg-card border-2 border-foreground font-mono text-sm text-foreground hover-brutal flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              <span>EDIT PROFILE</span>
            </Link>
          ) : (
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={cn(
                  "flex-1 py-2 border-2 border-foreground font-mono text-sm flex items-center justify-center gap-2 hover-brutal",
                  isFollowing ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
                )}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>FOLLOWING</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>FOLLOW</span>
                  </>
                )}
              </button>
              <button
                onClick={handleMessage}
                className="flex-1 py-2 bg-card border-2 border-foreground font-mono text-sm text-foreground hover-brutal flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>MESSAGE</span>
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-foreground">
          <button
            onClick={() => setActiveTab("posts")}
            className={cn(
              "flex-1 py-3 flex items-center justify-center gap-2 font-mono text-sm transition-colors",
              activeTab === "posts"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Grid className="w-4 h-4" />
            <span>POSTS</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {postsLoading ? (
            <div className="text-center py-8 font-mono text-muted-foreground">Loading...</div>
          ) : formattedPosts.length > 0 ? (
            formattedPosts.map((post) => (
              <PostCard key={post.id} post={{ ...post, user_id: post.user_id }} onUpdate={refetch} />
            ))
          ) : (
            <div className="text-center py-16">
              <Grid className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-display text-lg text-foreground mb-2">NO POSTS YET</h2>
              <p className="font-mono text-sm text-muted-foreground">
                {isOwnProfile ? "Create your first post!" : "This user hasn't posted yet"}
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
