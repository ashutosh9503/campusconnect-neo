import { MainLayout } from "@/components/layout/MainLayout";
import { Users, Plus, Lock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface Group {
  id: string;
  name: string;
  description: string;
  members: number;
  isPrivate: boolean;
  avatar: string;
  isMember: boolean;
}

const mockGroups: Group[] = [
  { id: "1", name: "CS 2024 Batch", description: "Official group for Computer Science 2024 batch", members: 156, isPrivate: false, avatar: "CS", isMember: true },
  { id: "2", name: "Placement Prep", description: "DSA, aptitude, and interview prep", members: 234, isPrivate: false, avatar: "PP", isMember: true },
  { id: "3", name: "TY Project Teams", description: "Find teammates for final year projects", members: 89, isPrivate: false, avatar: "TY", isMember: false },
  { id: "4", name: "Meme Lords", description: "Only dank college memes allowed 💀", members: 445, isPrivate: false, avatar: "ML", isMember: true },
  { id: "5", name: "GATE Aspirants", description: "GATE 2025 preparation group", members: 67, isPrivate: true, avatar: "GA", isMember: false },
  { id: "6", name: "Canteen Critics", description: "Reviewing canteen food since 2020", members: 178, isPrivate: false, avatar: "CC", isMember: false },
];

export default function Groups() {
  return (
    <MainLayout showSidebars={false}>
      <div className="min-h-screen max-w-4xl mx-auto">
        {/* Header */}
        <div className="p-4 border-b-2 border-foreground sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-xl text-foreground">GROUPS</h1>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground border-2 border-foreground font-mono text-sm hover-brutal">
              <Plus className="w-4 h-4" />
              <span>CREATE</span>
            </button>
          </div>
        </div>

        {/* Groups Grid */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockGroups.map((group) => (
            <div
              key={group.id}
              className="bg-card border-2 border-foreground p-4 hover-brutal cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-secondary border-2 border-foreground flex items-center justify-center flex-shrink-0">
                  <span className="font-display text-lg text-secondary-foreground">{group.avatar}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono text-sm text-foreground truncate">{group.name}</h3>
                    {group.isPrivate ? (
                      <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <Globe className="w-3 h-3 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="font-mono text-xs text-muted-foreground mt-1 line-clamp-2">
                    {group.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {group.members} members
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <button
                  className={cn(
                    "w-full py-2 border-2 border-foreground font-mono text-xs transition-all",
                    group.isMember
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {group.isMember ? "JOINED" : "JOIN GROUP"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
