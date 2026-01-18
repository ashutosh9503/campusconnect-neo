import React, { createContext, useContext, useEffect, useRef, useState } from "react";
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
    const signalingChannelRef = useRef<any>(null);
    const activeCallUserIdRef = useRef<string | null>(null); // Who we are talking to

    useEffect(() => {
        if (!user) return;

        // Listen for incoming calls on my personal channel
        const channel = supabase.channel(`calls:${user.id}`)
            .on("broadcast", { event: "offer" }, handleReceiveOffer)
            .on("broadcast", { event: "answer" }, handleReceiveAnswer)
            .on("broadcast", { event: "ice-candidate" }, handleReceiveIceCandidate)
            .on("broadcast", { event: "end-call" }, handleReceiveEndCall)
            .subscribe();

        signalingChannelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const createPeerConnection = () => {
        if (peerConnectionRef.current) return peerConnectionRef.current;

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

        peerConnectionRef.current = pc;
        return pc;
    };

    const startCall = async (targetUserId: string, isVideo: boolean) => {
        if (!user) return;

        setIsInCall(true);
        activeCallUserIdRef.current = targetUserId;
        setIsCameraOn(isVideo);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: isVideo,
                audio: true
            });
            setLocalStream(stream);

            const pc = createPeerConnection();
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // Send offer
            await supabase.channel(`calls:${targetUserId}`).send({
                type: "broadcast",
                event: "offer",
                payload: {
                    offer,
                    caller: { id: user.id, name: user.email /* Placeholder, better fetch profile */ },
                    isVideo
                }
            });

        } catch (err) {
            console.error("Error starting call:", err);
            endCall();
            toast.error("Could not access camera/microphone");
        }
    };

    const handleReceiveOffer = async (payload: any) => {
        // payload: { offer, caller, isVideo }
        const { offer, caller: incomingCaller, isVideo } = payload.payload;
        console.log("Incoming call from", incomingCaller);

        if (isInCall) {
            // Busy
            // Optionally send busy signal
            return;
        }

        setCaller(incomingCaller);
        setIsIncomingCall(true);
        activeCallUserIdRef.current = incomingCaller.id;
        // We store the offer specifically to set it later
        // For simplicity, we createPC now but don't setRemoteDesc until answer? 
        // Actually typically we need to setRemoteDesc to generate answer.

        // Store offer for 'accept'
        (window as any).pendingOffer = offer;
        (window as any).pendingIsVideo = isVideo;
    };

    const acceptCall = async () => {
        if (!user || !activeCallUserIdRef.current) return;

        setIsIncomingCall(false);
        setIsInCall(true);

        const offer = (window as any).pendingOffer;
        const isVideo = (window as any).pendingIsVideo; // The caller desired video

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true, // Always enable video capabilities? Or match request?
                audio: true
            });
            setLocalStream(stream);
            if (!isVideo) {
                stream.getVideoTracks().forEach(t => t.enabled = false);
                setIsCameraOn(false);
            }

            const pc = createPeerConnection();
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await supabase.channel(`calls:${activeCallUserIdRef.current}`).send({
                type: "broadcast",
                event: "answer",
                payload: { answer, from: user.id }
            });

        } catch (err) {
            console.error("Error accepting call:", err);
            endCall();
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
        cleanup();
    };

    const handleReceiveAnswer = async (payload: any) => {
        const { answer } = payload.payload;
        if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
    };

    const handleReceiveIceCandidate = async (payload: any) => {
        const { candidate } = payload.payload;
        if (peerConnectionRef.current) {
            try {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error("Error adding ice candidate", e);
            }
        }
    };

    const handleReceiveEndCall = () => {
        cleanup();
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
        cleanup();
    };

    const cleanup = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        setLocalStream(null);
        setRemoteStream(null);
        setIsInCall(false);
        setIsIncomingCall(false);
        setCaller(null);
        activeCallUserIdRef.current = null;
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
