import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  type: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  attendees_count?: number;
  is_registered?: boolean;
}

export function useEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all events ordered by date - use type assertion for new table
      const { data: eventsData, error } = await (supabase
        .from("events" as any) as any)
        .select("*")
        .order("event_date", { ascending: true });

      if (error) throw error;

      // Get registration counts for all events
      const eventIds = (eventsData as any[])?.map((e: any) => e.id) || [];
      let registrationCountsMap = new Map<string, number>();

      if (eventIds.length > 0) {
        const { data: registrationsData } = await (supabase
          .from("event_registrations" as any) as any)
          .select("event_id")
          .in("event_id", eventIds);

        (registrationsData as any[] || []).forEach((r: any) => {
          registrationCountsMap.set(r.event_id, (registrationCountsMap.get(r.event_id) || 0) + 1);
        });
      }

      // Check if current user is registered for each event
      let userRegistrationsSet = new Set<string>();
      if (user && eventIds.length > 0) {
        const { data: userRegistrations } = await (supabase
          .from("event_registrations" as any) as any)
          .select("event_id")
          .eq("user_id", user.id)
          .in("event_id", eventIds);

        userRegistrationsSet = new Set((userRegistrations as any[] || []).map((r: any) => r.event_id));
      }

      const enrichedEvents = (eventsData as any[] || []).map((event: any) => ({
        ...event,
        attendees_count: registrationCountsMap.get(event.id) || 0,
        is_registered: userRegistrationsSet.has(event.id),
      })) as Event[];

      setEvents(enrichedEvents);
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (
    title: string,
    description: string,
    eventDate: string,
    eventTime: string,
    location: string,
    type: string
  ) => {
    if (!user) return { error: new Error("Not logged in") };

    try {
      const { data: newEvent, error } = await (supabase
        .from("events" as any) as any)
        .insert({
          title,
          description,
          event_date: eventDate,
          event_time: eventTime || null,
          location,
          type,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-register the creator
      await (supabase.from("event_registrations" as any) as any).insert({
        event_id: newEvent.id,
        user_id: user.id,
      });

      await fetchEvents();
      return { error: null, event: newEvent };
    } catch (err: any) {
      return { error: err };
    }
  };

  const registerForEvent = async (eventId: string) => {
    if (!user) return { error: new Error("Not logged in") };

    try {
      const { error } = await (supabase.from("event_registrations" as any) as any).insert({
        event_id: eventId,
        user_id: user.id,
      });

      if (error) throw error;
      await fetchEvents();
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const unregisterFromEvent = async (eventId: string) => {
    if (!user) return { error: new Error("Not logged in") };

    try {
      const { error } = await (supabase
        .from("event_registrations" as any) as any)
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", user.id);

      if (error) throw error;
      await fetchEvents();
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!user) return { error: new Error("Not logged in") };

    try {
      const { error } = await (supabase
        .from("events" as any) as any)
        .delete()
        .eq("id", eventId);

      if (error) throw error;
      await fetchEvents();
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  return { events, loading, createEvent, registerForEvent, unregisterFromEvent, deleteEvent, refetch: fetchEvents };
}
