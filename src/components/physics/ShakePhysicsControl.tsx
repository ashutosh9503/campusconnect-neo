import React from "react";
import { useShakePhysics } from "@/contexts/ShakePhysicsContext";
import { Zap, Smartphone } from "lucide-react";
import { useUserPreferences } from "@/contexts/UserPreferenceContext";

export function ShakePhysicsControl() {
  const { isShaking, permissionGranted, triggerShake, requestMotionPermission } = useShakePhysics();
  const { preferences } = useUserPreferences();

  if (preferences?.shakePhysicsEnabled === false) return null;

  const handleClick = async () => {
    // Enable sensors on iOS / Android browsers requiring explicit user gesture permission
    await requestMotionPermission();
    triggerShake(1.2);
  };

  const needsPermissionPrompt = permissionGranted === false || (
    typeof window !== "undefined" &&
    typeof (DeviceMotionEvent as any)?.requestPermission === "function" &&
    permissionGranted === null
  );

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {needsPermissionPrompt && (
        <button
          type="button"
          onClick={handleClick}
          className="px-3 py-1.5 bg-secondary text-secondary-foreground border-2 border-foreground shadow-brutal font-mono text-[10px] font-bold flex items-center gap-1.5 animate-pulse"
        >
          <Smartphone className="w-3.5 h-3.5 text-white" />
          <span>TAP ONCE TO ENABLE IPHONE SHAKE SENSORS 📱</span>
        </button>
      )}

      <button
        type="button"
        onClick={handleClick}
        className={`px-3 py-2 bg-primary text-primary-foreground border-2 border-foreground shadow-brutal font-mono text-xs font-bold flex items-center gap-2 transition-all active:scale-90 hover:bg-primary/90 ${
          isShaking ? "animate-bounce bg-secondary text-secondary-foreground" : ""
        }`}
        title="Test Shake Physics (or press Shift + S)"
      >
        <Zap className="w-4 h-4 text-black animate-pulse" />
        <span className="hidden sm:inline">🫨 SHAKE CCNEO</span>
        <span className="sm:hidden">🫨 SHAKE</span>
      </button>
    </div>
  );
}
