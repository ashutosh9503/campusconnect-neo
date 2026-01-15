import { useEffect, useState, useRef } from "react";
import { Plus, Camera, Image } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  created_at: string;
  expires_at: string;
  profile?: {
    username: string | null;
    display_name: string | null;
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
          .select("user_id, username, display_name, avatar_url")
          .in("user_id", userIds);
        
        const profilesMap = new Map(profiles?.map(p => [p.user_id, p]));
        
        const storiesWithProfiles = data.map(story => ({
          ...story,
          profile: profilesMap.get(story.user_id) || null,
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
              onClick={() => setSelectedStory(story)}
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
                      {(story.profile?.username || story.profile?.display_name || "U").slice(0, 2).toUpperCase()}
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
      {selectedStory && (
        <div 
          className="fixed inset-0 z-50 bg-background flex items-center justify-center"
          onClick={() => setSelectedStory(null)}
        >
          <div className="relative w-full max-w-md h-full max-h-[80vh]">
            <img 
              src={selectedStory.media_url} 
              alt="Story"
              className="w-full h-full object-contain"
            />
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-muted border-2 border-foreground flex items-center justify-center">
                <span className="font-display text-xs text-foreground">
                  {(selectedStory.profile?.username || "U").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <span className="font-mono text-sm text-foreground">
                {selectedStory.profile?.username || "user"}
              </span>
            </div>
            <button
              onClick={() => setSelectedStory(null)}
              className="absolute top-4 right-4 font-mono text-sm text-foreground hover:text-primary"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </>
  );
}
