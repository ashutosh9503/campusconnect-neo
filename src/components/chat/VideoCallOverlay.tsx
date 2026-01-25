import { useEffect, useRef } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { useCall } from "@/contexts/CallContext";
import { cn } from "@/lib/utils";

export function VideoCallOverlay() {
    const {
        isInCall,
        localStream,
        remoteStream,
        endCall,
        toggleMic,
        toggleCamera,
        isMicOn,
        isCameraOn
    } = useCall();

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
            // iOS requires explicit play() call
            localVideoRef.current.play().catch(error => {
                if (error.name !== 'AbortError') console.error(error);
            });
        }
    }, [localStream, isInCall]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
            // iOS requires explicit play() call
            remoteVideoRef.current.play().catch(error => {
                if (error.name !== 'AbortError') console.error(error);
            });
        }
    }, [remoteStream, isInCall]);

    if (!isInCall) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
            {/* Remote Stream (Full Screen) */}
            <div className="absolute inset-0">
                {remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                        <span className="font-mono text-muted-foreground animate-pulse">
                            {remoteStream && remoteStream.getVideoTracks().length === 0
                                ? "Audio Only"
                                : "Connecting..."}
                        </span>
                    </div>
                )}
            </div>

            {/* Local Stream (PIP) */}
            <div className="absolute top-4 right-4 w-32 md:w-48 aspect-video bg-black border-2 border-primary shadow-brutal overflow-hidden">
                <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={cn(
                        "w-full h-full object-cover transform scale-x-[-1]",
                        !isCameraOn && "hidden"
                    )}
                />
                {!isCameraOn && (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-muted-foreground">
                        <VideoOff className="w-6 h-6" />
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 p-4 bg-background/90 border-2 border-foreground backdrop-blur shadow-brutal rounded-full">
                <button
                    onClick={toggleMic}
                    className={cn(
                        "p-3 border-2 border-foreground rounded-full transition-colors",
                        isMicOn ? "bg-muted hover:bg-muted/80" : "bg-destructive/20 text-destructive border-destructive"
                    )}
                >
                    {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                </button>

                <button
                    onClick={endCall}
                    className="p-4 bg-destructive text-destructive-foreground border-2 border-foreground rounded-full hover:scale-110 transition-transform"
                >
                    <PhoneOff className="w-8 h-8" />
                </button>

                <button
                    onClick={toggleCamera}
                    className={cn(
                        "p-3 border-2 border-foreground rounded-full transition-colors",
                        isCameraOn ? "bg-muted hover:bg-muted/80" : "bg-destructive/20 text-destructive border-destructive"
                    )}
                >
                    {isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </button>
            </div>
        </div>
    );
}
