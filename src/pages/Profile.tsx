import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Settings, Grid, Bookmark, Edit, UserPlus, UserCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PostCard } from "@/components/feed/PostCard";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useFollowStats, usePostsCount } from "@/hooks/useProfile";
import { usePosts } from "@/hooks/usePosts";

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const { profile, loading: profileLoading } = useProfile();
  const { followersCount, followingCount } = useFollowStats();
  const postsCount = usePostsCount();
  const { posts, loading: postsLoading } = usePosts(user?.id);

  if (authLoading || profileLoading) {
    return (
      <MainLayout showSidebars={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="font-mono text-muted-foreground">LOADING...</div>
        </div>
      </MainLayout>
    );
  }

  if (!user) return null;

  const displayName = profile?.display_name || profile?.username || "User";
  const username = profile?.username || "user";
  const avatarInitials = displayName.slice(0, 2).toUpperCase();

  return (
    <MainLayout showSidebars={false}>
      <div className="min-h-screen max-w-2xl mx-auto">
        {/* Header */}
        <div className="p-4 border-b-2 border-foreground">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-xl text-foreground">PROFILE</h1>
            <Link to="/settings" className="p-2 hover:bg-muted transition-colors">
              <Settings className="w-5 h-5 text-foreground" />
            </Link>
          </div>

          {/* Profile Info */}
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-muted border-2 border-foreground flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-2xl text-foreground">{avatarInitials}</span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-display text-lg text-foreground">{displayName}</h2>
              <p className="font-mono text-xs text-muted-foreground">@{username}</p>
              <div className="flex items-center gap-2 mt-2">
                {profile?.stream && (
                  <span className="px-2 py-1 bg-primary text-primary-foreground font-mono text-[10px] border-2 border-foreground">
                    {profile.stream}
                  </span>
                )}
                {profile?.year && (
                  <span className="px-2 py-1 bg-secondary text-secondary-foreground font-mono text-[10px] border-2 border-foreground">
                    {profile.year}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile?.bio && (
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

          {/* Edit Button */}
          <Link 
            to="/settings"
            className="w-full mt-4 py-2 bg-card border-2 border-foreground font-mono text-sm text-foreground hover-brutal flex items-center justify-center gap-2"
          >
            <Edit className="w-4 h-4" />
            <span>EDIT PROFILE</span>
          </Link>
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
          <button
            onClick={() => setActiveTab("saved")}
            className={cn(
              "flex-1 py-3 flex items-center justify-center gap-2 font-mono text-sm transition-colors",
              activeTab === "saved"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Bookmark className="w-4 h-4" />
            <span>SAVED</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {postsLoading ? (
            <div className="text-center py-8 font-mono text-muted-foreground">Loading...</div>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post.id} post={{
                id: post.id,
                author: {
                  name: post.profile?.display_name || post.profile?.username || "User",
                  username: post.profile?.username || "user",
                  avatar: (post.profile?.username || "U").slice(0, 2).toUpperCase(),
                  stream: post.profile?.stream || "CS",
                  year: post.profile?.year || "TY",
                },
                content: post.content,
                media: post.media_url ? { type: post.media_type === "video" ? "video" : "image", url: post.media_url } : undefined,
                reactions: post.reactions_count || { brainrot: 0, w: 0, l: 0, coffee: 0 },
                comments: post.comments_count || 0,
                timestamp: new Date(post.created_at).toLocaleDateString(),
              }} />
            ))
          ) : (
            <div className="text-center py-16">
              <Grid className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-display text-lg text-foreground mb-2">NO POSTS YET</h2>
              <p className="font-mono text-sm text-muted-foreground">Create your first post!</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
