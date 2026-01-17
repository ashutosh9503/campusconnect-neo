import { useEffect, useState } from "react";
import { AlertTriangle, Megaphone, Calendar, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Notice {
  id: string;
  type: "urgent" | "event" | "academic" | "general";
  title: string;
  content: string;
  created_at: string;
}

const typeConfig = {
  urgent: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive" },
  event: { icon: Megaphone, color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary" },
  academic: { icon: BookOpen, color: "text-primary", bg: "bg-primary/10", border: "border-primary" },
  general: { icon: Calendar, color: "text-muted-foreground", bg: "bg-muted", border: "border-muted-foreground" },
};

// Fallback notices for demo
const fallbackNotices: Notice[] = [
  {
    id: "1",
    type: "urgent",
    title: "EXAM SCHEDULE UPDATED",
    content: "Mid-semester exams postponed to next week. Check portal for details.",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    type: "event",
    title: "CULTURAL FEST 2024",
    content: "Registrations open! Last date: 25th Nov",
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    type: "academic",
    title: "ASSIGNMENT DEADLINE",
    content: "DBMS Lab 5 due tomorrow 11:59 PM",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
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

export function NoticeWall() {
  const [notices, setNotices] = useState<Notice[]>(fallbackNotices);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      if (data && data.length > 0) {
        setNotices(data as Notice[]);
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
      // Keep fallback notices
    } finally {
      setLoading(false);
    }
  };

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
            <p className="font-mono text-[10px] text-muted-foreground">TSDC OFFICIAL</p>
          </div>
        </div>
        {/* Scanlines overlay */}
        <div className="absolute inset-0 scanlines opacity-20" />
      </div>

      {/* Notices */}
      <div className="divide-y-2 divide-border">
        {notices.map((notice) => {
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
                      {formatTimeAgo(notice.created_at)}
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
