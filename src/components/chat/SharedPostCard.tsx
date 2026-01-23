import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface SharedPostCardProps {
    postId: string;
}

interface PostDetails {
    id: string;
    content: string;
    media_url?: string | null;
    media_type?: string | null;
    user_id: string;
    created_at: string;
    author?: {
        username: string;
        avatar_url: string | null;
    };
}

export function SharedPostCard({ postId }: SharedPostCardProps) {
    const [post, setPost] = useState<PostDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPost() {
            try {
                const { data: postData, error } = await supabase
                    .from("posts")
                    .select(`
            id,
            content,
            media_url,
            media_type,
            user_id,
            created_at
          `)
                    .eq("id", postId)
                    .single();

                if (error || !postData) throw error;

                // Fetch author profile
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("username, avatar_url")
                    .eq("id", postData.user_id)
                    .single();

                // Check for new media table if legacy media is empty
                let mediaUrl = postData.media_url;
                let mediaType = postData.media_type;

                if (!mediaUrl) {
                    const { data: mediaData } = await supabase
                        .from("post_media" as any)
                        .select("url, type")
                        .eq("post_id", postId)
                        .limit(1)
                        .single();

                    if (mediaData) {
                        mediaUrl = (mediaData as any).url;
                        mediaType = (mediaData as any).type;
                    }
                }

                setPost({
                    ...postData,
                    media_url: mediaUrl,
                    media_type: mediaType,
                    author: profile || { username: "unknown", avatar_url: null }
                });
            } catch (err) {
                console.error("Error fetching shared post:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchPost();
    }, [postId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4 bg-muted/50 rounded-md border border-border w-48 h-32">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="p-3 bg-muted/50 rounded-md border border-border">
                <p className="text-xs text-muted-foreground italic">Post unavailable</p>
            </div>
        );
    }

    return (
        <Link to={`/`} className="block group">
            <div className="bg-card border border-foreground/20 rounded-md overflow-hidden hover:border-foreground transition-colors max-w-sm">
                {/* Header */}
                <div className="p-2 border-b border-foreground/10 flex items-center gap-2 bg-muted/30">
                    <div className="w-5 h-5 bg-muted rounded-sm border border-foreground/20 overflow-hidden flex items-center justify-center">
                        {post.author?.avatar_url ? (
                            <img src={post.author.avatar_url} alt={post.author.username} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-[8px] font-display">{post.author?.username?.slice(0, 1).toUpperCase()}</span>
                        )}
                    </div>
                    <span className="text-xs font-mono font-bold text-foreground">@{post.author?.username}</span>
                </div>

                {/* Media Preview */}
                {post.media_url && (
                    <div className="aspect-video bg-black flex items-center justify-center overflow-hidden">
                        {post.media_type === "video" ? (
                            <video src={post.media_url} className="w-full h-full object-cover" />
                        ) : (
                            <img src={post.media_url} alt="Post media" className="w-full h-full object-cover" />
                        )}
                    </div>
                )}

                {/* Content Preview */}
                <div className="p-2">
                    <p className="text-xs font-mono text-muted-foreground line-clamp-2">
                        {post.content || (post.media_url ? "Shared a post" : "Shared text content")}
                    </p>
                </div>
            </div>
        </Link>
    );
}
