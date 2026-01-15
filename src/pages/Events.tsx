import { MainLayout } from "@/components/layout/MainLayout";
import { Calendar, MapPin, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  type: "cultural" | "academic" | "sports" | "workshop";
  isRegistered: boolean;
}

const mockEvents: Event[] = [
  { id: "1", title: "Cultural Fest 2024", description: "Annual cultural extravaganza with performances, competitions, and more!", date: "Nov 25", time: "10:00 AM", location: "Main Auditorium", attendees: 450, type: "cultural", isRegistered: true },
  { id: "2", title: "Placement Workshop", description: "Resume building and interview preparation session", date: "Nov 22", time: "2:00 PM", location: "Seminar Hall 2", attendees: 89, type: "workshop", isRegistered: false },
  { id: "3", title: "Inter-College Cricket", description: "Semi-finals of the inter-college cricket tournament", date: "Nov 28", time: "9:00 AM", location: "Sports Ground", attendees: 200, type: "sports", isRegistered: false },
  { id: "4", title: "Tech Talk: AI/ML", description: "Guest lecture on AI/ML trends by industry expert", date: "Nov 30", time: "11:00 AM", location: "CS Lab", attendees: 120, type: "academic", isRegistered: true },
];

const typeColors = {
  cultural: "bg-secondary border-secondary",
  academic: "bg-primary border-primary",
  sports: "bg-destructive border-destructive",
  workshop: "bg-warning border-warning",
};

const typeLabels = {
  cultural: "CULTURAL",
  academic: "ACADEMIC",
  sports: "SPORTS",
  workshop: "WORKSHOP",
};

export default function Events() {
  return (
    <MainLayout showSidebars={false}>
      <div className="min-h-screen max-w-4xl mx-auto">
        {/* Header */}
        <div className="p-4 border-b-2 border-foreground sticky top-0 bg-background z-10">
          <h1 className="font-display text-xl text-foreground">UPCOMING EVENTS</h1>
        </div>

        {/* Events List */}
        <div className="p-4 space-y-4">
          {mockEvents.map((event) => (
            <div
              key={event.id}
              className="bg-card border-2 border-foreground hover-brutal cursor-pointer"
            >
              {/* Type Badge */}
              <div className={cn(
                "px-4 py-1 text-center",
                typeColors[event.type]
              )}>
                <span className="font-display text-xs text-foreground">
                  {typeLabels[event.type]}
                </span>
              </div>

              <div className="p-4">
                <h3 className="font-display text-lg text-foreground mb-2">
                  {event.title}
                </h3>
                <p className="font-mono text-xs text-muted-foreground mb-4">
                  {event.description}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-mono text-xs text-foreground">{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="font-mono text-xs text-foreground">{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="font-mono text-xs text-foreground">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-mono text-xs text-foreground">{event.attendees} going</span>
                  </div>
                </div>

                <button
                  className={cn(
                    "w-full py-2 border-2 border-foreground font-mono text-xs transition-all",
                    event.isRegistered
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {event.isRegistered ? "REGISTERED ✓" : "REGISTER NOW"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
