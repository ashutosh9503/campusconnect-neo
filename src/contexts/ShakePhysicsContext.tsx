import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useUserPreferences } from "@/contexts/UserPreferenceContext";

interface ShakePhysicsContextType {
  isShaking: boolean;
  intensity: number; // 0 to 1
  permissionGranted: boolean | null;
  triggerShake: (strength?: number) => void;
  requestMotionPermission: () => Promise<boolean>;
}

const ShakePhysicsContext = createContext<ShakePhysicsContextType | undefined>(undefined);

export function ShakePhysicsProvider({ children }: { children: ReactNode }) {
  const { preferences } = useUserPreferences();
  const [isShaking, setIsShaking] = useState(false);
  const [intensity, setIntensity] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

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

      const ax = -stiff * state.x;
      const ay = -stiff * state.y;
      const ar = -stiff * state.r;

      state.vx = (state.vx + ax) * damp;
      state.vy = (state.vy + ay) * damp;
      state.vr = (state.vr + ar) * damp;

      state.x += state.vx;
      state.y += state.vy;
      state.r += state.vr;

      state.currentIntensity += (state.targetIntensity - state.currentIntensity) * 0.15;
      state.targetIntensity *= 0.92;

      if (state.targetIntensity < 0.01) {
        state.targetIntensity = 0;
      }

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

    const angle = Math.random() * Math.PI * 2;
    const force = clamped * 38;
    state.vx += Math.cos(angle) * force;
    state.vy += Math.sin(angle) * force;
    state.vr += (Math.random() - 0.5) * clamped * 50;
    state.targetIntensity = Math.min(1.5, state.targetIntensity + clamped);
    lastShakeTime.current = Date.now();
  };

  // Request motion permission (iOS Safari & Modern Browsers)
  const requestMotionPermission = async (): Promise<boolean> => {
    if (
      typeof window !== "undefined" &&
      typeof (DeviceMotionEvent as any)?.requestPermission === "function"
    ) {
      try {
        const response = await (DeviceMotionEvent as any).requestPermission();
        const granted = response === "granted";
        setPermissionGranted(granted);
        return granted;
      } catch (e) {
        console.error("Error requesting DeviceMotion permission", e);
        setPermissionGranted(false);
        return false;
      }
    }
    setPermissionGranted(true);
    return true;
  };

  // Device Motion & Gyroscope Detection Engine
  useEffect(() => {
    if (!isEnabled || typeof window === "undefined") return;

    let lastX: number | null = null;
    let lastY: number | null = null;
    let lastZ: number | null = null;
    let lastBeta: number | null = null;
    let lastGamma: number | null = null;
    let lastEventTime = 0;

    // Acceleration-based shake listener
    const handleDeviceMotion = (e: DeviceMotionEvent) => {
      const now = Date.now();
      if (now - lastEventTime < 30) return; // ~33Hz check
      lastEventTime = now;

      const acc = e.accelerationIncludingGravity || e.acceleration;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      if (lastX !== null && lastY !== null && lastZ !== null) {
        const deltaX = Math.abs(acc.x - lastX);
        const deltaY = Math.abs(acc.y - lastY);
        const deltaZ = Math.abs(acc.z - lastZ);
        const totalDelta = deltaX + deltaY + deltaZ;

        // Calibrated sensitive threshold (6.5 works for gentle and hard phone shakes)
        if (totalDelta > 6.5) {
          const computedStrength = Math.min(1.5, (totalDelta - 5) / 15);
          triggerShake(computedStrength);
        }
      }

      lastX = acc.x;
      lastY = acc.y;
      lastZ = acc.z;
    };

    // Gyroscope-based tilt/shake fallback listener
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;

      if (lastBeta !== null && lastGamma !== null) {
        const deltaBeta = Math.abs(e.beta - lastBeta);
        const deltaGamma = Math.abs(e.gamma - lastGamma);
        const totalGyroDelta = deltaBeta + deltaGamma;

        if (totalGyroDelta > 25) {
          triggerShake(Math.min(1.2, totalGyroDelta / 40));
        }
      }

      lastBeta = e.beta;
      lastGamma = e.gamma;
    };

    window.addEventListener("devicemotion", handleDeviceMotion, { passive: true });
    window.addEventListener("deviceorientation", handleOrientation, { passive: true });

    return () => {
      window.removeEventListener("devicemotion", handleDeviceMotion);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [isEnabled]);

  // Keyboard Shortcuts (Shift+S, Alt+S, Cmd+S)
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

  return (
    <ShakePhysicsContext.Provider
      value={{
        isShaking,
        intensity,
        permissionGranted,
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
