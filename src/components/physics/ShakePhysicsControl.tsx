import React from "react";
import { useShakePhysics } from "@/contexts/ShakePhysicsContext";
import { Zap } from "lucide-react";
import { useUserPreferences } from "@/contexts/UserPreferenceContext";

export function ShakePhysicsControl() {
  const { isShaking, triggerShake } = useShakePhysics();
  const { preferences } = useUserPreferences();

  if (preferences?.shakePhysicsEnabled === false) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-40 flex items-center gap-2">
      <button
        type="button"
        onClick={() => triggerShake(1.2)}
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
