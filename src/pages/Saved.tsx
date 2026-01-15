import { MainLayout } from "@/components/layout/MainLayout";
import { Bookmark, Trash2 } from "lucide-react";
import { PostCard } from "@/components/feed/PostCard";

const savedPosts = [
  {
    id: "1",
    author: {
      name: "Sneha Rao",
      username: "sneha.r",
      avatar: "SR",
      stream: "IT",
      year: "TY",
    },
    content: "Placement season tip: When they ask 'Where do you see yourself in 5 years?', don't say 'With a working AC in this college'",
    reactions: { brainrot: 234, w: 178, l: 3, coffee: 56 },
    comments: 89,
    timestamp: "1d ago",
  },
  {
    id: "2",
    author: {
      name: "Neha Mehta",
      username: "neha.m",
      avatar: "NM",
      stream: "CS",
      year: "TY",
    },
    content: "Library 3rd floor has AC finally working after 2 months. This is not a drill. I repeat, THIS IS NOT A DRILL 🚨",
    reactions: { brainrot: 156, w: 89, l: 0, coffee: 45 },
    comments: 67,
    timestamp: "6h ago",
  },
];

export default function Saved() {
  return (
    <MainLayout showSidebars={false}>
      <div className="min-h-screen max-w-2xl mx-auto">
        {/* Header */}
        <div className="p-4 border-b-2 border-foreground sticky top-0 bg-background z-10">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-primary" />
            <h1 className="font-display text-xl text-foreground">SAVED POSTS</h1>
          </div>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            {savedPosts.length} posts saved
          </p>
        </div>

        {/* Saved Posts */}
        <div className="p-4 space-y-4">
          {savedPosts.length > 0 ? (
            savedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="text-center py-16">
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
