import { usePosts } from "@/hooks/usePosts";
import { PostCard } from "./PostCard";
import { FileText } from "lucide-react";

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function BentoFeed() {
  const { posts, loading, refetch } = usePosts();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="font-mono text-muted-foreground">Loading posts...</div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="font-display text-lg text-foreground mb-2">NO POSTS YET</h2>
        <p className="font-mono text-sm text-muted-foreground text-center">
          Be the first to share something with the campus!
        </p>
      </div>
    );
  }

  const formattedPosts = posts.map((post, index) => ({
    id: post.id,
    user_id: post.user_id,
    author: {
      name: post.profile?.full_name || post.profile?.username || "User",
      username: post.profile?.username || "user",
      avatar: post.profile?.avatar_url || (post.profile?.username || post.profile?.full_name || "U").slice(0, 2).toUpperCase(),
      stream: post.profile?.stream || "CS",
      year: post.profile?.year || "TY",
    },
    content: post.content,
    media: post.media,
    reactions: post.reactions_count || { brainrot: 0, w: 0, l: 0, coffee: 0 },
    comments: post.comments_count || 0,
    timestamp: formatTimeAgo(post.created_at),
    isSpan: index % 5 === 0 ? "row" as const : index % 7 === 0 ? "col" as const : undefined,
    user_reaction: post.user_reaction,
    is_saved: post.is_saved,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2 md:p-4 auto-rows-auto mb-20 md:mb-0">
      {formattedPosts.map((post) => (
        <PostCard key={post.id} post={post} onUpdate={refetch} />
      ))}
    </div>
  );
}
