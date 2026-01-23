import { useState } from "react";
import { Plus, PenTool, Image, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export function MobileCreateButton() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);

    if (!user) return null;

    return (
        <div className="fixed bottom-20 right-4 z-40 md:hidden">
            <div className={cn(
                "absolute bottom-full right-0 mb-4 flex flex-col gap-2 transition-all duration-200",
                open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            )}>
                <Link
                    to="/create-story"
                    className="flex items-center gap-2 bg-secondary text-secondary-foreground p-3 rounded-full border-2 border-foreground shadow-brutal hover:scale-105 transition-transform"
                    onClick={() => setOpen(false)}
                >
                    <span className="font-mono text-xs font-bold whitespace-nowrap bg-background px-2 py-1 border border-foreground rounded">Story</span>
                    <Image className="w-5 h-5" />
                </Link>

                <Link
                    to="/create-post"
                    className="flex items-center gap-2 bg-primary text-primary-foreground p-3 rounded-full border-2 border-foreground shadow-brutal hover:scale-105 transition-transform"
                    onClick={() => setOpen(false)}
                >
                    <span className="font-mono text-xs font-bold whitespace-nowrap bg-background text-foreground px-2 py-1 border border-foreground rounded">Post</span>
                    <PenTool className="w-5 h-5" />
                </Link>

                {/* Notices/Events could be added here if allowed */}
            </div>

            <button
                onClick={() => setOpen(!open)}
                className={cn(
                    "w-12 h-12 rounded-full border-2 border-foreground shadow-brutal flex items-center justify-center transition-all duration-300",
                    open ? "bg-destructive text-destructive-foreground rotate-45" : "bg-primary text-primary-foreground"
                )}
            >
                <Plus className="w-6 h-6" />
            </button>

            {/* Backdrop */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/50 z-[-1] backdrop-blur-sm"
                    onClick={() => setOpen(false)}
                />
            )}
        </div>
    );
}
