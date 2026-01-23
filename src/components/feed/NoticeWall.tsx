import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Notice {
  id: string;
  type: "urgent" | "event" | "academic" | "general";
  title: string;
  content: string;
  created_at: string;
  created_by?: string;
}

export function NoticeWall() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: "", content: "", type: "general" as Notice["type"] });
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotices(data as Notice[] || []);
    } catch (err: any) {
      console.error("Error fetching notices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('notices_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notices' },
        () => {
          fetchNotices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from("notices").insert({
        title: newNotice.title,
        content: newNotice.content,
        type: newNotice.type,
        created_by: user.id
      } as any);

      if (error) throw error;

      toast({ title: "Notice created!" });
      setIsCreating(false);
      setNewNotice({ title: "", content: "", type: "general" });
    } catch (err: any) {
      toast({
        title: "Error creating notice",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirm("Delete this notice?")) return;
    try {
      const { error } = await supabase.from("notices").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Notice deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="p-4 text-center font-mono text-xs">Loading notices...</div>;

  return (
    <div className="bg-card border-2 border-foreground p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          <h2 className="font-display text-lg uppercase">Notice Board</h2>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="text-xs font-mono underline hover:text-primary"
          >
            POST NOTICE
          </button>
        )}
      </div>

      {isCreating && (
        <form onSubmit={handleCreateNotice} className="mb-4 space-y-3 p-3 border border-dashed border-foreground">
          <input
            placeholder="Title"
            value={newNotice.title}
            onChange={e => setNewNotice({ ...newNotice, title: e.target.value })}
            className="w-full p-2 bg-background border border-foreground font-mono text-xs focus:outline-none focus:border-primary"
            required
          />
          <textarea
            placeholder="Content"
            value={newNotice.content}
            onChange={e => setNewNotice({ ...newNotice, content: e.target.value })}
            className="w-full p-2 bg-background border border-foreground font-mono text-xs focus:outline-none focus:border-primary"
            rows={3}
            required
          />
          <div className="flex gap-2">
            <select
              value={newNotice.type}
              onChange={e => setNewNotice({ ...newNotice, type: e.target.value as any })}
              className="p-2 bg-background border border-foreground font-mono text-xs focus:outline-none focus:border-primary"
            >
              <option value="general">General</option>
              <option value="academic">Academic</option>
              <option value="event">Event</option>
              <option value="urgent">Urgent</option>
            </select>
            <button type="submit" className="px-3 py-2 bg-primary text-primary-foreground text-xs font-mono border border-foreground hover:opacity-90">
              POST
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-2 bg-muted text-xs font-mono border border-foreground hover:opacity-90"
            >
              CANCEL
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
        {notices.length === 0 && !isCreating ? (
          <p className="text-center font-mono text-xs text-muted-foreground py-4">
            No notices yet.
          </p>
        ) : (
          notices.map((notice) => (
            <div
              key={notice.id}
              className={cn(
                "p-3 border-l-4 bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in group relative",
                notice.type === "urgent" && "border-l-red-500",
                notice.type === "event" && "border-l-blue-500",
                notice.type === "academic" && "border-l-green-500",
                notice.type === "general" && "border-l-gray-500"
              )}
            >
              <div className="flex items-start justify-between mb-1">
                <span className={cn(
                  "text-[10px] uppercase font-bold px-1.5 py-0.5 text-white",
                  notice.type === "urgent" && "bg-red-500",
                  notice.type === "event" && "bg-blue-500",
                  notice.type === "academic" && "bg-green-500",
                  notice.type === "general" && "bg-gray-500"
                )}>
                  {notice.type}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {formatDistanceToNow(new Date(notice.created_at), { addSuffix: true })}
                </span>
              </div>
              <h3 className="font-bold text-sm mb-1">{notice.title}</h3>
              <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                {notice.content}
              </p>
              {user && user.id === notice.created_by && (
                <button
                  onClick={() => handleDeleteNotice(notice.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-destructive hover:bg-destructive/10 rounded transition-all"
                >
                  <img src="https://api.iconify.design/lucide:trash-2.svg" className="w-3 h-3" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <button className="w-full mt-4 py-2 border-2 border-dashed border-foreground font-mono text-xs hover:bg-muted transition-colors opacity-50 cursor-not-allowed">
        VIEW ALL NOTICES
      </button>
    </div>
  );
}
