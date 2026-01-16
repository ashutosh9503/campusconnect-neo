import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  is_private: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  is_member?: boolean;
}

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all groups - use type assertion for new table
      const { data: groupsData, error } = await (supabase
        .from("groups" as any) as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get member counts for all groups
      const groupIds = (groupsData as any[])?.map((g: any) => g.id) || [];
      let memberCountsMap = new Map<string, number>();
      
      if (groupIds.length > 0) {
        const { data: membersData } = await (supabase
          .from("group_members" as any) as any)
          .select("group_id")
          .in("group_id", groupIds);
        
        (membersData as any[] || []).forEach((m: any) => {
          memberCountsMap.set(m.group_id, (memberCountsMap.get(m.group_id) || 0) + 1);
        });
      }

      // Check if current user is a member of each group
      let userMembershipsSet = new Set<string>();
      if (user && groupIds.length > 0) {
        const { data: userMemberships } = await (supabase
          .from("group_members" as any) as any)
          .select("group_id")
          .eq("user_id", user.id)
          .in("group_id", groupIds);
        
        userMembershipsSet = new Set((userMemberships as any[] || []).map((m: any) => m.group_id));
      }

      const enrichedGroups = (groupsData as any[] || []).map((group: any) => ({
        ...group,
        member_count: memberCountsMap.get(group.id) || 0,
        is_member: userMembershipsSet.has(group.id),
      })) as Group[];

      setGroups(enrichedGroups);
    } catch (err) {
      console.error("Error fetching groups:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = async (name: string, description: string, isPrivate: boolean) => {
    if (!user) return { error: new Error("Not logged in") };

    try {
      const { data: newGroup, error } = await (supabase
        .from("groups" as any) as any)
        .insert({
          name,
          description,
          is_private: isPrivate,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join the creator as admin
      await (supabase.from("group_members" as any) as any).insert({
        group_id: newGroup.id,
        user_id: user.id,
        role: "admin",
      });

      await fetchGroups();
      return { error: null, group: newGroup };
    } catch (err: any) {
      return { error: err };
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) return { error: new Error("Not logged in") };

    try {
      const { error } = await (supabase.from("group_members" as any) as any).insert({
        group_id: groupId,
        user_id: user.id,
        role: "member",
      });

      if (error) throw error;
      await fetchGroups();
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return { error: new Error("Not logged in") };

    try {
      const { error } = await (supabase
        .from("group_members" as any) as any)
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user.id);

      if (error) throw error;
      await fetchGroups();
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  return { groups, loading, createGroup, joinGroup, leaveGroup, refetch: fetchGroups };
}
