import { Phone, PhoneOff, Video } from "lucide-react";
import { useCall } from "@/contexts/CallContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function IncomingCallDialog() {
    const { isIncomingCall, caller, acceptCall, rejectCall } = useCall();

    if (!isIncomingCall || !caller) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-card border-2 border-foreground p-8 max-w-sm w-full shadow-brutal flex flex-col items-center gap-6">
                <div className="relative">
                    <Avatar className="w-24 h-24 border-2 border-foreground">
                        <AvatarImage src={caller.avatar} />
                        <AvatarFallback className="text-2xl font-display">
                            {caller.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-2 border-2 border-foreground rounded-full animate-bounce">
                        <Phone className="w-6 h-6" />
                    </div>
                </div>

                <div className="text-center">
                    <h2 className="font-display text-2xl text-foreground mb-1">Incoming Call</h2>
                    <p className="font-mono text-muted-foreground">{caller.name}</p>
                </div>

                <div className="flex items-center gap-8 w-full justify-center">
                    <button
                        onClick={rejectCall}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="w-14 h-14 bg-destructive text-destructive-foreground border-2 border-foreground flex items-center justify-center rounded-full group-hover:scale-110 transition-transform">
                            <PhoneOff className="w-6 h-6" />
                        </div>
                        <span className="font-mono text-xs text-destructive">Decline</span>
                    </button>

                    <button
                        onClick={acceptCall}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="w-14 h-14 bg-primary text-primary-foreground border-2 border-foreground flex items-center justify-center rounded-full group-hover:scale-110 transition-transform">
                            <Video className="w-6 h-6" />
                        </div>
                        <span className="font-mono text-xs text-primary">Accept</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
