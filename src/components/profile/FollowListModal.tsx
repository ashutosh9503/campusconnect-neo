import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "lucide-react";

interface FollowListModalProps {
    type: "followers" | "following";
    userId: string;
    isOpen: boolean;
    onClose: () => void;
}

interface ProfilePreview {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
}

export function FollowListModal({ type, userId, isOpen, onClose }: FollowListModalProps) {
    const { user } = useAuth();
    const [users, setUsers] = useState<ProfilePreview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && userId) {
            fetchUsers();
        }
    }, [isOpen, userId, type]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let data;
            if (type === "followers") {
                const { data: follows } = await supabase
                    .from("follows")
                    .select("follower_id")
                    .eq("following_id", userId);

                if (follows && follows.length > 0) {
                    const followerIds = follows.map(f => f.follower_id);
                    const { data: profiles } = await supabase
                        .from("profiles")
                        .select("id, username, full_name, avatar_url")
                        .in("id", followerIds);
                    data = profiles;
                }
            } else {
                const { data: follows } = await supabase
                    .from("follows")
                    .select("following_id")
                    .eq("follower_id", userId);

                if (follows && follows.length > 0) {
                    const followingIds = follows.map(f => f.following_id);
                    const { data: profiles } = await supabase
                        .from("profiles")
                        .select("id, username, full_name, avatar_url")
                        .in("id", followingIds);
                    data = profiles;
                }
            }

            setUsers(data || []);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="border-2 border-foreground max-w-sm">
                <DialogHeader>
                    <DialogTitle className="font-display uppercase">{type}</DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[300px] mt-2">
                    {loading ? (
                        <div className="text-center py-8 font-mono text-muted-foreground">Loading...</div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-8 font-mono text-muted-foreground">
                            {type === "followers" ? "No followers yet" : "Not following anyone"}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {users.map((profile) => (
                                <Link
                                    key={profile.id}
                                    to={`/profile/${profile.username}`}
                                    onClick={onClose}
                                    className="flex items-center gap-3 p-2 hover:bg-muted transition-colors rounded"
                                >
                                    <div className="w-10 h-10 bg-card border border-foreground flex items-center justify-center overflow-hidden">
                                        {profile.avatar_url ? (
                                            <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="font-display text-sm">
                                                {(profile.username || "U").slice(0, 2).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-mono text-sm font-bold text-foreground">@{profile.username}</p>
                                        <p className="font-mono text-xs text-muted-foreground">{profile.full_name}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
