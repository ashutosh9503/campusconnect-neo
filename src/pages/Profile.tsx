import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Settings, Grid, Bookmark, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PostCard } from "@/components/feed/PostCard";

const userPosts = [
  {
    id: "1",
    author: {
      name: "Guest User",
      username: "guest",
      avatar: "GU",
      stream: "CS",
      year: "TY",
    },
    content: "Just joined CampusConnect! Ready to connect with the TSNDC fam 🎓",
    reactions: { brainrot: 12, w: 8, l: 0, coffee: 5 },
    comments: 3,
    timestamp: "1h ago",
  },
];

export default function Profile() {
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");

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
            <div className="w-20 h-20 bg-muted border-2 border-foreground flex items-center justify-center">
              <span className="font-display text-2xl text-foreground">GU</span>
            </div>
            <div className="flex-1">
              <h2 className="font-display text-lg text-foreground">Guest User</h2>
              <p className="font-mono text-xs text-muted-foreground">@guest</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-1 bg-primary text-primary-foreground font-mono text-[10px] border-2 border-foreground">
                  CS
                </span>
                <span className="px-2 py-1 bg-secondary text-secondary-foreground font-mono text-[10px] border-2 border-foreground">
                  TY 2024
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          <p className="font-mono text-sm text-foreground mt-4">
            Just another engineering student trying to survive 💀
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <p className="font-display text-xl text-foreground">12</p>
              <p className="font-mono text-[10px] text-muted-foreground">POSTS</p>
            </div>
            <div className="text-center">
              <p className="font-display text-xl text-foreground">234</p>
              <p className="font-mono text-[10px] text-muted-foreground">FOLLOWERS</p>
            </div>
            <div className="text-center">
              <p className="font-display text-xl text-foreground">189</p>
              <p className="font-mono text-[10px] text-muted-foreground">FOLLOWING</p>
            </div>
          </div>

          {/* Edit Button */}
          <button className="w-full mt-4 py-2 bg-card border-2 border-foreground font-mono text-sm text-foreground hover-brutal flex items-center justify-center gap-2">
            <Edit className="w-4 h-4" />
            <span>EDIT PROFILE</span>
          </button>
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
          {activeTab === "posts" ? (
            userPosts.map((post) => (
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
