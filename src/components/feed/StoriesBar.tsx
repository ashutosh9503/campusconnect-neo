import { Plus, Camera } from "lucide-react";
import { Link } from "react-router-dom";

interface Story {
  id: string;
  username: string;
  avatar: string;
  hasNew: boolean;
}

const mockStories: Story[] = [
  { id: "1", username: "rahul.k", avatar: "RK", hasNew: true },
  { id: "2", username: "priya.s", avatar: "PS", hasNew: true },
  { id: "3", username: "amit.j", avatar: "AJ", hasNew: false },
  { id: "4", username: "neha.m", avatar: "NM", hasNew: true },
  { id: "5", username: "vikram", avatar: "VK", hasNew: false },
  { id: "6", username: "sneha.r", avatar: "SR", hasNew: true },
  { id: "7", username: "arjun.p", avatar: "AP", hasNew: false },
];

export function StoriesBar() {
  return (
    <div className="border-b-2 border-foreground bg-card p-4">
      <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide pb-2">
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

        {/* Stories */}
        {mockStories.map((story) => (
          <button
            key={story.id}
            className="flex-shrink-0 flex flex-col items-center gap-2 group"
          >
            <div className={story.hasNew ? "story-ring-animated" : "p-[2px] bg-muted"}>
              <div className="w-16 h-16 bg-card border-2 border-foreground flex items-center justify-center group-hover:bg-muted transition-colors">
                <span className="font-display text-lg text-foreground">{story.avatar}</span>
              </div>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground truncate max-w-16">
              {story.username}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
