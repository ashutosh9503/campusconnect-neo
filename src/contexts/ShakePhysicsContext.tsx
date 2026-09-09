import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useUserPreferences } from "@/contexts/UserPreferenceContext";

interface ShakePhysicsContextType {
  isShaking: boolean;
  intensity: number; // 0 to 1
  triggerShake: (strength?: number) => void;
  requestMotionPermission: () => Promise<boolean>;
}

const ShakePhysicsContext = createContext<ShakePhysicsContextType | undefined>(undefined);

export function ShakePhysicsProvider({ children }: { children: ReactNode }) {
  const { preferences } = useUserPreferences();
  const [isShaking, setIsShaking] = useState(false);
  const [intensity, setIntensity] = useState(0);

  // Spring physics variables for smooth decay
  const physicsState = useRef({
    x: 0,
    y: 0,
    r: 0,
    vx: 0,
    vy: 0,
    vr: 0,
    targetIntensity: 0,
    currentIntensity: 0,
  });

  const animFrameId = useRef<number | null>(null);
  const lastShakeTime = useRef<number>(0);
  const isEnabled = preferences?.shakePhysicsEnabled !== false;

  // Spring solver running at 60fps via requestAnimationFrame
  useEffect(() => {
    if (!isEnabled) {
      document.documentElement.classList.remove("shake-active");
      return;
    }

    const stiff = 0.12;
    const damp = 0.82;

    const updatePhysics = () => {
      const state = physicsState.current;

      // Spring forces returning to 0
      const ax = -stiff * state.x;
      const ay = -stiff * state.y;
      const ar = -stiff * state.r;

      state.vx = (state.vx + ax) * damp;
      state.vy = (state.vy + ay) * damp;
      state.vr = (state.vr + ar) * damp;

      state.x += state.vx;
      state.y += state.vy;
      state.r += state.vr;

      // Decay intensity
      state.currentIntensity += (state.targetIntensity - state.currentIntensity) * 0.15;
      state.targetIntensity *= 0.92;

      if (state.targetIntensity < 0.01) {
        state.targetIntensity = 0;
      }

      // Update root CSS custom variables without React re-renders!
      document.documentElement.style.setProperty("--shake-x", `${state.x.toFixed(2)}px`);
      document.documentElement.style.setProperty("--shake-y", `${state.y.toFixed(2)}px`);
      document.documentElement.style.setProperty("--shake-r", `${state.r.toFixed(2)}deg`);
      document.documentElement.style.setProperty("--shake-intensity", state.currentIntensity.toFixed(2));

      const active = state.currentIntensity > 0.05 || Math.abs(state.x) > 0.5 || Math.abs(state.y) > 0.5;

      if (active) {
        document.documentElement.classList.add("shake-active");
        setIsShaking(true);
        setIntensity(state.currentIntensity);
      } else {
        document.documentElement.classList.remove("shake-active");
        setIsShaking(false);
        setIntensity(0);
      }

      animFrameId.current = requestAnimationFrame(updatePhysics);
    };

    animFrameId.current = requestAnimationFrame(updatePhysics);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      document.documentElement.classList.remove("shake-active");
    };
  }, [isEnabled]);

  // Impulse trigger function
  const triggerShake = (strength = 0.8) => {
    if (!isEnabled) return;
    const clamped = Math.min(1.5, Math.max(0.2, strength));
    const state = physicsState.current;

    // Apply random vector impulse
    const angle = Math.random() * Math.PI * 2;
    const force = clamped * 35;
    state.vx += Math.cos(angle) * force;
    state.vy += Math.sin(angle) * force;
    state.vr += (Math.random() - 0.5) * clamped * 45;
    state.targetIntensity = Math.min(1.5, state.targetIntensity + clamped);
    lastShakeTime.current = Date.now();
  };

  // Device Motion Shake Detection
  useEffect(() => {
    if (!isEnabled || typeof window === "undefined") return;

    let lastX: number | null = null;
    let lastY: number | null = null;
    let lastZ: number | null = null;
    let lastEventTime = 0;

    const handleDeviceMotion = (e: DeviceMotionEvent) => {
      const now = Date.now();
      if (now - lastEventTime < 40) return; // Cap at ~25Hz detection rate for efficiency
      lastEventTime = now;

      const acc = e.accelerationIncludingGravity || e.acceleration;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      if (lastX !== null && lastY !== null && lastZ !== null) {
        const deltaX = Math.abs(acc.x - lastX);
        const deltaY = Math.abs(acc.y - lastY);
        const deltaZ = Math.abs(acc.z - lastZ);
        const totalDelta = deltaX + deltaY + deltaZ;

        // Threshold for shake trigger (14 is a robust shake threshold)
        if (totalDelta > 14) {
          const computedStrength = Math.min(1.5, (totalDelta - 12) / 20);
          triggerShake(computedStrength);
        }
      }

      lastX = acc.x;
      lastY = acc.y;
      lastZ = acc.z;
    };

    window.addEventListener("devicemotion", handleDeviceMotion, { passive: true });
    return () => {
      window.removeEventListener("devicemotion", handleDeviceMotion);
    };
  }, [isEnabled]);

  // Keyboard Fallback (Shift + S or 's' key) & Desktop Shortcuts
  useEffect(() => {
    if (!isEnabled || typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === "s" && (e.shiftKey || e.metaKey || e.altKey)) {
        e.preventDefault();
        triggerShake(1.0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEnabled]);

  // Request motion permission (needed on iOS 13+)
  const requestMotionPermission = async (): Promise<boolean> => {
    if (
      typeof window !== "undefined" &&
      typeof (DeviceMotionEvent as any)?.requestPermission === "function"
    ) {
      try {
        const response = await (DeviceMotionEvent as any).requestPermission();
        return response === "granted";
      } catch (e) {
        console.error("Error requesting DeviceMotion permission", e);
        return false;
      }
    }
    return true;
  };

  return (
    <ShakePhysicsContext.Provider
      value={{
        isShaking,
        intensity,
        triggerShake,
        requestMotionPermission,
      }}
    >
      {children}
    </ShakePhysicsContext.Provider>
  );
}

export function useShakePhysics() {
  const context = useContext(ShakePhysicsContext);
  if (!context) {
    throw new Error("useShakePhysics must be used within ShakePhysicsProvider");
  }
  return context;
}
