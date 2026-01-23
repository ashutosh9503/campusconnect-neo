import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Calendar, MapPin, Clock, Users, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEvents } from "@/hooks/useEvents";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const typeColors: Record<string, string> = {
  cultural: "bg-secondary border-secondary",
  academic: "bg-primary border-primary",
  sports: "bg-destructive border-destructive",
  workshop: "bg-warning border-warning",
  general: "bg-muted border-muted",
};

const typeLabels: Record<string, string> = {
  cultural: "CULTURAL",
  academic: "ACADEMIC",
  sports: "SPORTS",
  workshop: "WORKSHOP",
  general: "GENERAL",
};

export default function Events() {
  const { user } = useAuth();
  const { events, loading, createEvent, registerForEvent, unregisterFromEvent, deleteEvent } = useEvents();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    type: "general",
  });

  const handleCreateEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.date) {
      toast({ title: "Error", description: "Title and date are required", variant: "destructive" });
      return;
    }

    setCreating(true);
    const { error } = await createEvent(
      newEvent.title,
      newEvent.description,
      newEvent.date,
      newEvent.time,
      newEvent.location,
      newEvent.type
    );
    setCreating(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Event created successfully!" });
      setShowCreateDialog(false);
      setNewEvent({ title: "", description: "", date: "", time: "", location: "", type: "general" });
    }
  };

  const handleRegisterToggle = async (eventId: string, isRegistered: boolean) => {
    if (!user) {
      toast({ title: "Error", description: "Please login to register for events", variant: "destructive" });
      return;
    }

    if (isRegistered) {
      const { error } = await unregisterFromEvent(eventId);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Unregistered", description: "You have unregistered from this event" });
      }
    } else {
      const { error } = await registerForEvent(eventId);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Registered", description: "You have registered for this event!" });
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "TBD";
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <MainLayout showSidebars={false}>
      <div className="min-h-screen max-w-4xl mx-auto">
        {/* Header */}
        <div className="p-4 border-b-2 border-foreground sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-xl text-foreground">UPCOMING EVENTS</h1>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground border-2 border-foreground font-mono text-sm hover-brutal"
            >
              <Plus className="w-4 h-4" />
              <span>CREATE</span>
            </button>
          </div>
        </div>

        {/* Events List */}
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="text-center py-16 font-mono text-muted-foreground">
              LOADING...
            </div>
          ) : events.length > 0 ? (
            events.map((event) => (
              <div
                key={event.id}
                className="bg-card border-2 border-foreground hover-brutal cursor-pointer"
              >
                {/* Type Badge */}
                <div className={cn(
                  "px-4 py-1 text-center relative",
                  typeColors[event.type] || typeColors.general
                )}>
                  <span className="font-display text-xs text-foreground">
                    {typeLabels[event.type] || "EVENT"}
                  </span>
                  {user && user.id === event.created_by && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this event?")) deleteEvent(event.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-black/20 rounded text-white"
                    >
                      <img src="https://api.iconify.design/lucide:trash-2.svg" className="w-3 h-3 text-white" />
                    </button>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-display text-lg text-foreground mb-2">
                    {event.title}
                  </h3>
                  <p className="font-mono text-xs text-muted-foreground mb-4">
                    {event.description || "No description"}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="font-mono text-xs text-foreground">{formatDate(event.event_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="font-mono text-xs text-foreground">{formatTime(event.event_time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="font-mono text-xs text-foreground">{event.location || "TBD"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="font-mono text-xs text-foreground">{event.attendees_count || 0} going</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRegisterToggle(event.id, event.is_registered || false)}
                    className={cn(
                      "w-full py-2 border-2 border-foreground font-mono text-xs transition-all",
                      event.is_registered
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {event.is_registered ? "REGISTERED ✓" : "REGISTER NOW"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-display text-lg text-foreground mb-2">NO UPCOMING EVENTS</h2>
              <p className="font-mono text-sm text-muted-foreground">Create the first event!</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Event Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="border-2 border-foreground">
          <DialogHeader>
            <DialogTitle className="font-display">CREATE EVENT</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="font-mono text-xs">Event Title</Label>
              <Input
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter event title"
                className="border-2 border-foreground font-mono"
              />
            </div>
            <div>
              <Label className="font-mono text-xs">Description</Label>
              <Textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What's this event about?"
                className="border-2 border-foreground font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-mono text-xs">Date</Label>
                <Input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                  className="border-2 border-foreground font-mono"
                />
              </div>
              <div>
                <Label className="font-mono text-xs">Time</Label>
                <Input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                  className="border-2 border-foreground font-mono"
                />
              </div>
            </div>
            <div>
              <Label className="font-mono text-xs">Location</Label>
              <Input
                value={newEvent.location}
                onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Where is the event?"
                className="border-2 border-foreground font-mono"
              />
            </div>
            <div>
              <Label className="font-mono text-xs">Type</Label>
              <Select value={newEvent.type} onValueChange={(value) => setNewEvent(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="border-2 border-foreground font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="cultural">Cultural</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <button
              onClick={handleCreateEvent}
              disabled={creating}
              className="w-full py-2 bg-primary text-primary-foreground border-2 border-foreground font-mono text-sm hover-brutal disabled:opacity-50"
            >
              {creating ? "CREATING..." : "CREATE EVENT"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
