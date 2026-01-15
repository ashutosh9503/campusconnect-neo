import { useEffect, useState } from "react";
import { PostCard } from "./PostCard";
import { supabase } from "@/integrations/supabase/client";

interface Post {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  profile?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    stream: string;
    year: string;
  };
}

// Fallback posts for demo
const fallbackPosts = [
  {
    id: "1",
    author: {
      name: "Rahul Kumar",
      username: "rahul.k",
      avatar: "RK",
      stream: "CS",
      year: "TY",
    },
    content: "Just survived the DBMS viva 💀 Prof asked about normalization and my brain went 3NF → BCNF → NULL. At least I got the attendance mark fr fr",
    reactions: { brainrot: 45, w: 12, l: 8, coffee: 23 },
    comments: 15,
    timestamp: "2h ago",
    isSpan: "row" as const,
  },
  {
    id: "2",
    author: {
      name: "Priya Sharma",
      username: "priya.s",
      avatar: "PS",
      stream: "IT",
      year: "SY",
    },
    content: "Canteen wale bhaiya remembered my order today. This is the peak of my college experience 🙏",
    media: {
      type: "image" as const,
      url: "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=600&h=400&fit=crop",
    },
    reactions: { brainrot: 89, w: 34, l: 2, coffee: 67 },
    comments: 28,
    timestamp: "4h ago",
    isSpan: "col" as const,
  },
  {
    id: "3",
    author: {
      name: "Amit Joshi",
      username: "amit.j",
      avatar: "AJ",
      stream: "EXTC",
      year: "FY",
    },
    content: "Who else bunked today's physics lecture? 👀 Asking for a friend",
    reactions: { brainrot: 23, w: 45, l: 15, coffee: 8 },
    comments: 42,
    timestamp: "5h ago",
  },
  {
    id: "4",
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
    isSpan: "both" as const,
  },
  {
    id: "5",
    author: {
      name: "Vikram Singh",
      username: "vikram",
      avatar: "VS",
      stream: "MECH",
      year: "SY",
    },
    content: "Day 47 of waiting for the elevator to work. Starting to believe it's a social experiment at this point.",
    reactions: { brainrot: 67, w: 5, l: 89, coffee: 12 },
    comments: 23,
    timestamp: "8h ago",
  },
  {
    id: "6",
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
    isSpan: "row" as const,
  },
];

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
  const [posts, setPosts] = useState<any[]>(fallbackPosts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const formattedPosts = data.map((post: any, index: number) => ({
          id: post.id,
          author: {
            name: "User",
            username: "user",
            avatar: "US",
            stream: "CS",
            year: "TY",
          },
          content: post.content,
          media: post.media_url ? {
            type: post.media_type === "video" ? "video" : "image",
            url: post.media_url,
          } : undefined,
          reactions: { brainrot: 0, w: 0, l: 0, coffee: 0 },
          comments: 0,
          timestamp: formatTimeAgo(post.created_at),
          isSpan: index % 5 === 0 ? "row" : index % 7 === 0 ? "col" : undefined,
        }));
        setPosts(formattedPosts);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      // Keep fallback posts
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 auto-rows-auto">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
