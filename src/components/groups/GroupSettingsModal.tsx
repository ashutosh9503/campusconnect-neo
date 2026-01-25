import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { User, Shield, Trash2, Plus, Search, LogOut, Settings, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface GroupSettingsModalProps {
    groupId: string;
    isOpen: boolean;
    onClose: () => void;
    onGroupDeleted?: () => void;
}

interface Member {
    user_id: string;
    role: "admin" | "moderator" | "member";
    status?: "joined" | "pending" | "invited";
    profile: {
        username: string;
        full_name: string;
        avatar_url: string | null;
    };
}

export function GroupSettingsModal({ groupId, isOpen, onClose, onGroupDeleted }: GroupSettingsModalProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [members, setMembers] = useState<Member[]>([]);
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [originalGroupName, setOriginalGroupName] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && groupId) {
            fetchMembers();
            fetchGroupDetails();
        }
    }, [isOpen, groupId]);

    const fetchGroupDetails = async () => {
        const { data } = await supabase.from("groups").select("name").eq("id", groupId).single();
        if (data) {
            setGroupName(data.name);
            setOriginalGroupName(data.name);
        }
    };

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("group_members")
                .select(`
          user_id,
          role,
          status,
          profile:profiles!group_members_user_id_fkey(username, full_name, avatar_url)
        `)
                .eq("group_id", groupId);

            if (error) throw error;

            const formattedMembers = data.map((item: any) => ({
                user_id: item.user_id,
                role: item.role,
                profile: item.profile
            }));

            setMembers(formattedMembers);

            const myMember = formattedMembers.find(m => m.user_id === user?.id);
            setCurrentUserRole(myMember?.role || null);
        } catch (error: any) {
            console.error("Error fetching members:", error);
            toast({ title: "Error", description: "Failed to load members" });
        } finally {
            setLoading(false);
        }
    };

    const handleSearchUsers = async (term: string) => {
        setSearchTerm(term);
        if (term.length < 3) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const { data } = await supabase
                .from("profiles")
                .select("id, username, full_name, avatar_url")
                .ilike("username", `%${term}%`)
                .limit(5);

            if (data) {
                // Filter out existing members
                const memberIds = new Set(members.map(m => m.user_id));
                setSearchResults(data.filter(u => !memberIds.has(u.id)));
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setSearching(false);
        }
    };

    const addMember = async (userId: string) => {
        try {
            const { error } = await supabase
                .from("group_members")
                .insert({
                    group_id: groupId,
                    user_id: userId,
                    role: "member",
                    status: "pending"
                });

            if (error) throw error;

            toast({ title: "Invitation Sent", description: "User has been invited to the group" });
            setSearchTerm("");
            setSearchResults([]);
            fetchMembers();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const removeMember = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this user?")) return;

        try {
            const { error } = await supabase
                .from("group_members")
                .delete()
                .eq("group_id", groupId)
                .eq("user_id", userId);

            if (error) throw error;

            toast({ title: "Success", description: "User removed" });
            fetchMembers();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const updateGroup = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from("groups")
                .update({ name: groupName })
                .eq("id", groupId);

            if (error) throw error;
            setOriginalGroupName(groupName);
            toast({ title: "Success", description: "Group updated" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const leaveGroup = async () => {
        if (!confirm("Are you sure you want to leave this group?")) return;
        if (!user) return;

        try {
            const { error } = await supabase
                .from("group_members")
                .delete()
                .eq("group_id", groupId)
                .eq("user_id", user.id);

            if (error) throw error;

            onClose();
            if (onGroupDeleted) onGroupDeleted(); // Redirects to groups page
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const deleteGroup = async () => {
        const currentUserMember = members.find(m => m.user_id === user?.id);
        const username = currentUserMember?.profile?.username?.toLowerCase();

        const isSuperUser = username === "ashutosh9503";
        // Allow deletion if user is admin OR is the superuser
        if (!isAdmin && !isSuperUser) {
            toast({
                title: "Permission Denied",
                description: "Only group admins can delete goups.",
                variant: "destructive"
            });
            return;
        }

        if (!confirm("Are you sure you want to DELETE this group? This action cannot be undone.")) return;

        try {
            const { error } = await supabase
                .from("groups")
                .delete()
                .eq("id", groupId);

            if (error) throw error;

            onClose();
            if (onGroupDeleted) onGroupDeleted();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const canManage = currentUserRole === "admin" || currentUserRole === "moderator";
    const isAdmin = currentUserRole === "admin";
    const currentUserMember = members.find(m => m.user_id === user?.id);
    const isSuperUser = currentUserMember?.profile?.username?.toLowerCase() === "ashutosh9503";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="border-2 border-foreground max-w-md bg-background">
                <DialogHeader>
                    <DialogTitle className="font-display">GROUP SETTINGS</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="members" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 border-2 border-foreground bg-muted p-0">
                        <TabsTrigger
                            value="members"
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-mono rounded-none"
                        >
                            MEMBERS
                        </TabsTrigger>
                        <TabsTrigger
                            value="settings"
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-mono rounded-none"
                        >
                            SETTINGS
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="members" className="space-y-4 mt-4">
                        {/* Add Member Section */}
                        {canManage && (
                            <div className="space-y-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search users to add..."
                                        value={searchTerm}
                                        onChange={(e) => handleSearchUsers(e.target.value)}
                                        className="pl-9 font-mono text-sm border-2 border-foreground"
                                    />
                                </div>
                                {searchResults.length > 0 && (
                                    <div className="border-2 border-foreground divide-y-2 divide-muted bg-card">
                                        {searchResults.map((user) => (
                                            <button
                                                key={user.id}
                                                onClick={() => addMember(user.id)}
                                                className="w-full p-2 flex items-center justify-between hover:bg-muted transition-colors text-left"
                                            >
                                                <span className="font-mono text-xs">{user.username}</span>
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Members List */}
                        <ScrollArea className="h-[300px] border-2 border-foreground p-2 bg-card">
                            {loading ? (
                                <div className="text-center py-4 font-mono text-xs text-muted-foreground">Loading...</div>
                            ) : (
                                <div className="space-y-2">
                                    {members.map((member) => (
                                        <div key={member.user_id} className="flex items-center justify-between p-2 bg-muted/20 border border-transparent hover:border-foreground/20 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-card border border-foreground flex items-center justify-center">
                                                    <span className="font-display text-xs">
                                                        {(member.profile.username || "U").slice(0, 2).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-mono text-xs font-bold flex items-center gap-1">
                                                        {member.profile.username}
                                                        {member.role === "admin" && <Shield className="w-3 h-3 text-primary fill-current" />}
                                                        {member.role === "moderator" && <Shield className="w-3 h-3 text-secondary fill-current" />}
                                                    </p>
                                                    <p className="font-mono text-[10px] text-muted-foreground capitalize">
                                                        {member.role === "admin" ? "Admin" : member.status === "pending" ? "Invited" : "Member"}
                                                    </p>
                                                </div>
                                            </div>

                                            {canManage && member.user_id !== user?.id && member.role !== "admin" && (
                                                <button
                                                    onClick={() => removeMember(member.user_id)}
                                                    className="p-1 hover:bg-destructive hover:text-destructive-foreground transition-colors rounded"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-4 mt-4 p-1">
                        {canManage ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="font-mono text-xs font-bold">GROUP NAME</label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={groupName}
                                            onChange={(e) => setGroupName(e.target.value)}
                                            className="font-mono border-2 border-foreground"
                                        />
                                        <Button
                                            onClick={updateGroup}
                                            disabled={groupName === originalGroupName || saving}
                                            className="bg-primary text-primary-foreground border-2 border-foreground hover-brutal"
                                        >
                                            {saving ? "..." : <Save className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4 font-mono text-sm text-muted-foreground">
                                Only admins can check settings.
                            </div>
                        )}

                        <div className="pt-4 border-t-2 border-muted space-y-2">
                            <Button
                                variant="outline"
                                className="w-full border-2 border-foreground font-mono hover:bg-muted justify-start gap-2"
                                onClick={leaveGroup}
                            >
                                <LogOut className="w-4 h-4" />
                                LEAVE GROUP
                            </Button>

                            {(isAdmin || isSuperUser) && (
                                <Button
                                    variant="destructive"
                                    className="w-full border-2 border-foreground font-mono hover:scale-[1.02] transition-transform justify-start gap-2"
                                    onClick={deleteGroup}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    DELETE GROUP
                                </Button>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
