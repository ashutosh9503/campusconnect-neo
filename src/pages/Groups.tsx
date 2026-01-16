import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Users, Plus, Lock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGroups } from "@/hooks/useGroups";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Groups() {
  const { user } = useAuth();
  const { groups, loading, createGroup, joinGroup, leaveGroup } = useGroups();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    isPrivate: false,
  });

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      toast({ title: "Error", description: "Group name is required", variant: "destructive" });
      return;
    }

    setCreating(true);
    const { error } = await createGroup(newGroup.name, newGroup.description, newGroup.isPrivate);
    setCreating(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Group created successfully!" });
      setShowCreateDialog(false);
      setNewGroup({ name: "", description: "", isPrivate: false });
    }
  };

  const handleJoinLeave = async (groupId: string, isMember: boolean) => {
    if (!user) {
      toast({ title: "Error", description: "Please login to join groups", variant: "destructive" });
      return;
    }

    if (isMember) {
      const { error } = await leaveGroup(groupId);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Left group", description: "You have left the group" });
      }
    } else {
      const { error } = await joinGroup(groupId);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Joined group", description: "You have joined the group!" });
      }
    }
  };

  return (
    <MainLayout showSidebars={false}>
      <div className="min-h-screen max-w-4xl mx-auto">
        {/* Header */}
        <div className="p-4 border-b-2 border-foreground sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-xl text-foreground">GROUPS</h1>
            <button 
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground border-2 border-foreground font-mono text-sm hover-brutal"
            >
              <Plus className="w-4 h-4" />
              <span>CREATE</span>
            </button>
          </div>
        </div>

        {/* Groups Grid */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 text-center py-16 font-mono text-muted-foreground">
              LOADING...
            </div>
          ) : groups.length > 0 ? (
            groups.map((group) => (
              <div
                key={group.id}
                className="bg-card border-2 border-foreground p-4 hover-brutal cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-secondary border-2 border-foreground flex items-center justify-center flex-shrink-0">
                    <span className="font-display text-lg text-secondary-foreground">
                      {group.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-mono text-sm text-foreground truncate">{group.name}</h3>
                      {group.is_private ? (
                        <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <Globe className="w-3 h-3 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="font-mono text-xs text-muted-foreground mt-1 line-clamp-2">
                      {group.description || "No description"}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {group.member_count || 0} members
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => handleJoinLeave(group.id, group.is_member || false)}
                    className={cn(
                      "w-full py-2 border-2 border-foreground font-mono text-xs transition-all",
                      group.is_member
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {group.is_member ? "JOINED" : "JOIN GROUP"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-16">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-display text-lg text-foreground mb-2">NO GROUPS YET</h2>
              <p className="font-mono text-sm text-muted-foreground">Create the first group!</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="border-2 border-foreground">
          <DialogHeader>
            <DialogTitle className="font-display">CREATE GROUP</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="font-mono text-xs">Group Name</Label>
              <Input
                value={newGroup.name}
                onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter group name"
                className="border-2 border-foreground font-mono"
              />
            </div>
            <div>
              <Label className="font-mono text-xs">Description</Label>
              <Textarea
                value={newGroup.description}
                onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What's this group about?"
                className="border-2 border-foreground font-mono"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="font-mono text-xs">Private Group</Label>
              <Switch
                checked={newGroup.isPrivate}
                onCheckedChange={(checked) => setNewGroup(prev => ({ ...prev, isPrivate: checked }))}
              />
            </div>
            <button
              onClick={handleCreateGroup}
              disabled={creating}
              className="w-full py-2 bg-primary text-primary-foreground border-2 border-foreground font-mono text-sm hover-brutal disabled:opacity-50"
            >
              {creating ? "CREATING..." : "CREATE GROUP"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
