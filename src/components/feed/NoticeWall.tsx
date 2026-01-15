import { AlertTriangle, Megaphone, Calendar, BookOpen } from "lucide-react";

interface Notice {
  id: string;
  type: "urgent" | "event" | "academic" | "general";
  title: string;
  content: string;
  author: string;
  timestamp: string;
}

const mockNotices: Notice[] = [
  {
    id: "1",
    type: "urgent",
    title: "EXAM SCHEDULE UPDATED",
    content: "Mid-semester exams postponed to next week. Check portal for details.",
    author: "Admin Office",
    timestamp: "2h ago"
  },
  {
    id: "2",
    type: "event",
    title: "CULTURAL FEST 2024",
    content: "Registrations open! Last date: 25th Nov",
    author: "Student Council",
    timestamp: "5h ago"
  },
  {
    id: "3",
    type: "academic",
    title: "ASSIGNMENT DEADLINE",
    content: "DBMS Lab 5 due tomorrow 11:59 PM",
    author: "Dr. Sharma",
    timestamp: "1d ago"
  },
];

const typeConfig = {
  urgent: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive" },
  event: { icon: Megaphone, color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary" },
  academic: { icon: BookOpen, color: "text-primary", bg: "bg-primary/10", border: "border-primary" },
  general: { icon: Calendar, color: "text-muted-foreground", bg: "bg-muted", border: "border-muted-foreground" },
};

export function NoticeWall() {
  return (
    <div className="border-b-2 border-foreground">
      {/* Header */}
      <div className="p-4 border-b-2 border-foreground bg-card notice-billboard relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-8 h-8 bg-destructive flex items-center justify-center animate-pulse">
            <Megaphone className="w-4 h-4 text-destructive-foreground" />
          </div>
          <div>
            <h2 className="font-display text-lg text-foreground glitch-text">NOTICE WALL</h2>
            <p className="font-mono text-[10px] text-muted-foreground">TSNDC OFFICIAL</p>
          </div>
        </div>
        {/* Scanlines overlay */}
        <div className="absolute inset-0 scanlines opacity-20" />
      </div>

      {/* Notices */}
      <div className="divide-y-2 divide-border">
        {mockNotices.map((notice) => {
          const config = typeConfig[notice.type];
          const Icon = config.icon;
          
          return (
            <div 
              key={notice.id} 
              className={`p-4 ${config.bg} border-l-4 ${config.border} hover:bg-opacity-20 transition-colors cursor-pointer`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-4 h-4 ${config.color} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <h3 className={`font-display text-xs ${config.color} mb-1`}>
                    {notice.title}
                  </h3>
                  <p className="font-mono text-xs text-muted-foreground line-clamp-2">
                    {notice.content}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {notice.author}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">•</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {notice.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View All */}
      <button className="w-full p-3 font-mono text-xs text-primary hover:bg-muted transition-colors border-t-2 border-foreground">
        VIEW ALL NOTICES →
      </button>
    </div>
  );
}
