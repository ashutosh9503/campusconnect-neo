import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Bookmark } from "lucide-react";
import { PostCard } from "@/components/feed/PostCard";
import { useSavedPosts } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";

export default function Saved() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { posts, loading } = useSavedPosts();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <MainLayout showSidebars={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="font-mono text-muted-foreground">LOADING...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout showSidebars={false}>
      <div className="min-h-screen w-full">
        {/* Header */}
        <div className="p-4 border-b-2 border-foreground sticky top-0 bg-background z-10">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-primary" />
            <h1 className="font-display text-xl text-foreground">SAVED POSTS</h1>
          </div>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            {posts.length} posts saved
          </p>
        </div>

        {/* Saved Posts */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} className="h-full">
                <PostCard
                  post={{
                    id: post.id,
                    author: {
                      name: (post as any).profile?.full_name || (post as any).profile?.username || "User",
                      username: (post as any).profile?.username || "user",
                      avatar: (post as any).profile?.avatar_url || ((post as any).profile?.username || "U").slice(0, 2).toUpperCase(),
                      stream: (post as any).profile?.stream || "CS",
                      year: (post as any).profile?.year || "TY",
                    },
                    content: post.content,
                    media: (post as any).media,
                    reactions: { brainrot: 0, w: 0, l: 0, coffee: 0 },
                    comments: 0,
                    timestamp: new Date(post.created_at).toLocaleDateString(),
                    is_saved: true,
                  }}
                />
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <Bookmark className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-display text-lg text-foreground mb-2">NO SAVED POSTS</h2>
              <p className="font-mono text-sm text-muted-foreground">
                Save posts to view them later
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
