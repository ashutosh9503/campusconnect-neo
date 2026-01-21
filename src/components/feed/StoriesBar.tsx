import { useEffect, useState, useRef } from "react";
import { Plus, Camera, Image, X, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  created_at: string;
  expires_at: string;
  views_count?: number;
  profile?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function StoriesBar() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStories();
  }, []);

  useEffect(() => {
    if (selectedStory && user && selectedStory.user_id !== user.id) {
      markAsSeen(selectedStory.id);
    }
  }, [selectedStory, user]);

  const markAsSeen = async (storyId: string) => {
    try {
      await supabase.from("story_views" as any).insert({
        story_id: storyId,
        user_id: user?.id
      }).select(); // Ignore duplicate error
    } catch (err) {
      // ignore
    }
  };

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(data.map(s => s.user_id))];

        // Fetch profiles
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .in("id", userIds);

        const profilesMap = new Map(profiles?.map(p => [p.id, p]));

        // Fetch views counts for own stories (or all?)
        // RLS allows seeing counts? Actually need a count query on story_views
        // Let's just fetch view counts for all active stories if possible, or lazy load.
        // For simplicity, fetch all views for these stories.
        const storyIds = data.map(s => s.id);
        const { data: viewsData } = await supabase
          .from("story_views" as any)
          .select("story_id")
          .in("story_id", storyIds);

        const viewsMap = new Map<string, number>();
        viewsData?.forEach((v: any) => {
          viewsMap.set(v.story_id, (viewsMap.get(v.story_id) || 0) + 1);
        });

        const storiesWithProfiles = data.map((story: any) => ({
          ...story,
          profile: profilesMap.get(story.user_id) || null,
          views_count: viewsMap.get(story.id) || 0
        }));

        setStories(storiesWithProfiles);
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group stories by user
  const groupedStories = stories.reduce((acc, story) => {
    const userId = story.user_id;
    if (!acc[userId]) {
      acc[userId] = [];
    }
    acc[userId].push(story);
    return acc;
  }, {} as Record<string, Story[]>);

  const uniqueUserStories = Object.values(groupedStories).map(userStories => userStories[0]);

  // Handle opening a story (find all stories for that user)
  const handleOpenStory = (startStory: Story) => {
    const userStories = groupedStories[startStory.user_id] || [startStory];
    // Find index of the clicked story in the user's list (though usually we start from newest or oldest?)
    // Instagram starts from the oldest UNREAD, or just the first one if all read.
    // For simplicity, let's start from the specific one clicked (which is the newest in the ring preview)
    // Wait, the ring preview shows the latest one? Usually yes.
    // Let's just play them in order (chronological).
    const sorted = [...userStories].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Find index of startStory
    const index = sorted.findIndex(s => s.id === startStory.id);
    const startIndex = index >= 0 ? index : 0;

    // Actually, distinct users is better. Steps:
    // 1. Set playlist to this user's sorted stories.
    // 2. Set current index to 0 (or find first unread).
    setViewerData({
      stories: sorted,
      currentIndex: startIndex
    });
  };

  const [viewerData, setViewerData] = useState<{ stories: Story[], currentIndex: number } | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (viewerData) {
      const story = viewerData.stories[viewerData.currentIndex];
      // Auto advance after 5s for images
      if (story.media_type !== 'video') {
        interval = setTimeout(() => {
          handleNext();
        }, 5000);
      }
    }
    return () => clearTimeout(interval);
  }, [viewerData]);

  const handleNext = () => {
    if (!viewerData) return;
    if (viewerData.currentIndex < viewerData.stories.length - 1) {
      setViewerData(prev => prev ? ({ ...prev, currentIndex: prev.currentIndex + 1 }) : null);
    } else {
      setViewerData(null); // Close or go to next user (bonus)
    }
  };

  const handlePrev = () => {
    if (!viewerData) return;
    if (viewerData.currentIndex > 0) {
      setViewerData(prev => prev ? ({ ...prev, currentIndex: prev.currentIndex - 1 }) : null);
    }
  };

  const currentStory = viewerData ? viewerData.stories[viewerData.currentIndex] : null;

  return (
    <>
      <div className="border-b-2 border-foreground bg-card p-4">
        <div
          ref={scrollRef}
          className="flex items-center gap-4 overflow-x-auto scrollbar-hide pb-2"
        >
          {/* Add Story Button */}
          <Link to="/stories/create" className="flex-shrink-0 flex flex-col items-center gap-2">
            <div className="relative">
              <div className="w-16 h-16 bg-muted border-2 border-dashed border-primary flex items-center justify-center hover:bg-muted/80 transition-colors">
                <Camera className="w-6 h-6 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary border-2 border-foreground flex items-center justify-center">
                <Plus className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">ADD STORY</span>
          </Link>

          {/* Stories from DB */}
          {uniqueUserStories.map((story) => (
            <button
              key={story.id}
              onClick={() => handleOpenStory(story)}
              className="flex-shrink-0 flex flex-col items-center gap-2 group"
            >
              <div className="story-ring-animated">
                <div className="w-16 h-16 bg-card border-2 border-foreground flex items-center justify-center group-hover:bg-muted transition-colors overflow-hidden">
                  {story.profile?.avatar_url ? (
                    <img
                      src={story.profile.avatar_url}
                      alt={story.profile.username || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-display text-lg text-foreground">
                      {(story.profile?.username || story.profile?.full_name || "U").slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground truncate max-w-16">
                {story.profile?.username || "user"}
              </span>
            </button>
          ))}

          {/* Empty state */}
          {!loading && stories.length === 0 && (
            <div className="flex items-center gap-2 px-4">
              <Image className="w-5 h-5 text-muted-foreground" />
              <span className="font-mono text-xs text-muted-foreground">No stories yet</span>
            </div>
          )}
        </div>
      </div>

      {/* Story Viewer Modal */}
      {currentStory && viewerData && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Progress bar */}
          <div className="flex gap-1 p-2 pt-4 absolute top-0 left-0 right-0 z-20">
            {viewerData.stories.map((s, idx) => (
              <div key={s.id} className="h-1 bg-white/30 flex-1 rounded overflow-hidden">
                <div
                  className={cn("h-full bg-white transition-all duration-300 ease-linear",
                    idx < viewerData.currentIndex ? "w-full" :
                      idx === viewerData.currentIndex ? "w-full animate-progress origin-left" : "w-0" // Need generic progress anim or manual width
                  )}
                  style={{
                    width: idx < viewerData.currentIndex ? '100%' : idx === viewerData.currentIndex ? 'auto' : '0%' // Animation handled by CSS ideally or manual
                  }}
                />
                {/* Fallback for active item full width for now since we don't have CSS keyframes injected easily */}
                {idx === viewerData.currentIndex && <div className="h-full bg-white animate-[progress_5s_linear]" />}
              </div>
            ))}
          </div>

          <div className="flex-1 relative flex items-center justify-center bg-black">
            {/* Tap areas */}
            <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={handlePrev}></div>
            <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={handleNext}></div>

            {currentStory.media_type === "video" ? (
              <video
                src={currentStory.media_url}
                className="max-h-screen w-full object-contain"
                autoPlay
                playsInline
                onEnded={handleNext}
              />
            ) : (
              <img
                src={currentStory.media_url}
                alt="Story"
                className="max-h-screen w-full object-contain"
              />
            )}

            <div className="absolute top-8 left-4 flex items-center gap-2 z-20 pointer-events-none">
              <div className="w-8 h-8 bg-muted border-2 border-white/50 flex items-center justify-center rounded-full overflow-hidden">
                {currentStory.profile?.avatar_url && <img src={currentStory.profile.avatar_url} className="w-full h-full object-cover" />}
              </div>
              <div className="drop-shadow-md">
                <span className="font-mono text-sm text-white font-bold block">
                  {currentStory.profile?.username || "user"}
                </span>
                <span className="font-mono text-[10px] text-white/80">
                  {new Date(currentStory.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => setViewerData(null)}
              className="absolute top-8 right-4 p-2 bg-black/50 rounded-full text-white z-30 hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Viewers (Only for owner) */}
            {user?.id === currentStory.user_id && (
              <div className="absolute bottom-10 left-4 bg-black/50 p-2 rounded backdrop-blur-sm z-20">
                <div className="flex items-center gap-2 text-white">
                  <Eye className="w-4 h-4" />
                  <span className="font-mono text-xs">{currentStory.views_count || 0} views</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
