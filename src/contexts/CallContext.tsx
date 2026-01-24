import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CallContextType {
    isInCall: boolean;
    isIncomingCall: boolean;
    caller: { id: string; name: string; avatar?: string } | null;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    startCall: (userId: string, isVideo: boolean) => Promise<void>;
    acceptCall: () => Promise<void>;
    rejectCall: () => void;
    endCall: () => void;
    toggleMic: () => void;
    toggleCamera: () => void;
    isMicOn: boolean;
    isCameraOn: boolean;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" }
    ],
};

export function CallProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [isInCall, setIsInCall] = useState(false);
    const [isIncomingCall, setIsIncomingCall] = useState(false);
    const [caller, setCaller] = useState<{ id: string; name: string; avatar?: string } | null>(null);

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);

    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const activeCallUserIdRef = useRef<string | null>(null);
    const iceCandidatesQueue = useRef<RTCIceCandidate[]>([]);

    // Cleanup function to stop all tracks
    const stopLocalStream = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
    };

    const performCleanup = () => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        setIsInCall(false);
        setIsIncomingCall(false);
        setCaller(null);
        activeCallUserIdRef.current = null;
        setRemoteStream(null);
    };

    // Watch for local stream to stop tracks when it changes (unmount/replace)
    useEffect(() => {
        return () => {
            localStream?.getTracks().forEach(t => t.stop());
        };
    }, [localStream]);

    useEffect(() => {
        if (!user) return;

        const channel = supabase.channel(`calls:${user.id}`)
            .on("broadcast", { event: "offer" }, (payload) => handleReceiveOffer(payload))
            .on("broadcast", { event: "answer" }, (payload) => handleReceiveAnswer(payload))
            .on("broadcast", { event: "ice-candidate" }, (payload) => handleReceiveIceCandidate(payload))
            .on("broadcast", { event: "end-call" }, () => handleReceiveEndCall())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const createPeerConnection = () => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }

        const pc = new RTCPeerConnection(ICE_SERVERS);

        pc.onicecandidate = (event) => {
            if (event.candidate && activeCallUserIdRef.current) {
                supabase.channel(`calls:${activeCallUserIdRef.current}`).send({
                    type: "broadcast",
                    event: "ice-candidate",
                    payload: { candidate: event.candidate, from: user?.id }
                });
            }
        };

        pc.ontrack = (event) => {
            console.log("Remote track received", event.streams[0]);
            setRemoteStream(event.streams[0]);
        };

        pc.onconnectionstatechange = () => {
            console.log("Connection state:", pc.connectionState);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                performCleanup();
                toast.info("Call disconnected");
            }
        };

        peerConnectionRef.current = pc;
        return pc;
    };

    const getMediaStream = async (isVideo: boolean) => {
        try {
            return await navigator.mediaDevices.getUserMedia({
                video: isVideo,
                audio: true
            });
        } catch (err) {
            console.warn("Failed to get requested media, falling back to audio only", err);
            if (isVideo) {
                try {
                    return await navigator.mediaDevices.getUserMedia({
                        video: false,
                        audio: true
                    });
                } catch (retryErr) {
                    console.error("Failed audio fallback", retryErr);
                    throw retryErr;
                }
            }
            throw err;
        }
    };

    const startCall = async (targetUserId: string, isVideo: boolean) => {
        if (!user) return;
        performCleanup();

        setIsInCall(true);
        activeCallUserIdRef.current = targetUserId;
        setIsCameraOn(isVideo);
        iceCandidatesQueue.current = [];

        try {
            const stream = await getMediaStream(isVideo);
            setLocalStream(stream);

            // Update camera state based on what we actually got
            const hasVideo = stream.getVideoTracks().length > 0;
            setIsCameraOn(hasVideo);

            const pc = createPeerConnection();
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: isVideo
            });
            await pc.setLocalDescription(offer);

            await supabase.channel(`calls:${targetUserId}`).send({
                type: "broadcast",
                event: "offer",
                payload: {
                    offer,
                    caller: { id: user.id, name: user.email },
                    isVideo
                }
            });

            // Send notification
            await (supabase.from("notifications" as any) as any).insert({
                user_id: targetUserId,
                actor_id: user.id,
                type: "call",
                content: `Incoming ${isVideo ? "video" : "voice"} call from ${user.email?.split("@")[0] || "User"}`,
                is_read: false
            });

        } catch (err) {
            console.error("Error starting call:", err);
            performCleanup();
            toast.error("Could not access camera/microphone");
        }
    };

    const handleReceiveOffer = async (payload: any) => {
        const { offer, caller: incomingCaller, isVideo } = payload.payload;
        if (isInCall) return;

        setCaller(incomingCaller);
        setIsIncomingCall(true);
        activeCallUserIdRef.current = incomingCaller.id;

        (window as any).pendingOffer = offer;
        (window as any).pendingIsVideo = isVideo;
    };

    const acceptCall = async () => {
        if (!user || !activeCallUserIdRef.current) return;

        setIsIncomingCall(false);
        setIsInCall(true);
        iceCandidatesQueue.current = [];

        const offer = (window as any).pendingOffer;
        const isVideo = (window as any).pendingIsVideo;

        try {
            const stream = await getMediaStream(true);
            setLocalStream(stream);

            // If caller asked for video but we failed to get it (fallback), accept as audio
            if (!isVideo) {
                stream.getVideoTracks().forEach(t => t.enabled = false);
                setIsCameraOn(false);
            } else {
                // Check if we actually got video
                const hasVideo = stream.getVideoTracks().length > 0;
                setIsCameraOn(hasVideo);
            }

            const pc = createPeerConnection();
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            while (iceCandidatesQueue.current.length > 0) {
                const candidate = iceCandidatesQueue.current.shift();
                if (candidate) {
                    await pc.addIceCandidate(candidate);
                }
            }

            await supabase.channel(`calls:${activeCallUserIdRef.current}`).send({
                type: "broadcast",
                event: "answer",
                payload: { answer, from: user.id }
            });

        } catch (err) {
            console.error("Error accepting call:", err);
            performCleanup();
        }
    };

    const rejectCall = () => {
        if (activeCallUserIdRef.current) {
            supabase.channel(`calls:${activeCallUserIdRef.current}`).send({
                type: "broadcast",
                event: "end-call",
                payload: { from: user?.id }
            });
        }
        performCleanup();
    };

    const handleReceiveAnswer = async (payload: any) => {
        const { answer } = payload.payload;
        if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            while (iceCandidatesQueue.current.length > 0) {
                const candidate = iceCandidatesQueue.current.shift();
                if (candidate) {
                    await peerConnectionRef.current.addIceCandidate(candidate);
                }
            }
        }
    };

    const handleReceiveIceCandidate = async (payload: any) => {
        const { candidate } = payload.payload;
        if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
            try {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error("Error adding ice candidate", e);
            }
        } else {
            // Queue candidate if PC doesn't exist yet (ringing) or remote description isn't set
            iceCandidatesQueue.current.push(new RTCIceCandidate(candidate));
        }
    };

    const handleReceiveEndCall = () => {
        performCleanup();
        toast.info("Call ended");
    };

    const endCall = () => {
        if (activeCallUserIdRef.current) {
            supabase.channel(`calls:${activeCallUserIdRef.current}`).send({
                type: "broadcast",
                event: "end-call",
                payload: { from: user?.id }
            });
        }
        performCleanup();
    };

    const toggleMic = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(t => t.enabled = !isMicOn);
            setIsMicOn(!isMicOn);
        }
    };

    const toggleCamera = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(t => t.enabled = !isCameraOn);
            setIsCameraOn(!isCameraOn);
        }
    };

    return (
        <CallContext.Provider value={{
            isInCall,
            isIncomingCall,
            caller,
            localStream,
            remoteStream,
            startCall,
            acceptCall,
            rejectCall,
            endCall,
            toggleMic,
            toggleCamera,
            isMicOn,
            isCameraOn
        }}>
            {children}
        </CallContext.Provider>
    );
}

export function useCall() {
    const context = useContext(CallContext);
    if (context === undefined) {
        throw new Error("useCall must be used within a CallProvider");
    }
    return context;
}
