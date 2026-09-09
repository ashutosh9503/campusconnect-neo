import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type PresetType = "Minimal" | "Classic" | "3D" | "Cinematic" | "Productivity" | "Creator" | "Custom";
export type Post3DMode = "flat" | "tilt" | "flip" | "parallax";
export type Story3DMode = "flat" | "3d" | "cinematic";
export type Profile3DMode = "static" | "spin" | "tilt" | "parallax";
export type FrameStyle = "lime" | "purple" | "cyber";

export interface UserPreferences {
  preset: PresetType;
  navigationOrder: string[];
  hiddenMenus: string[];
  pinnedMenus: string[];
  post3D: {
    mode: Post3DMode;
    maxTilt: number;
    depth: number;
    autoRotate: boolean;
  };
  story3D: {
    mode: Story3DMode;
  };
  profile3D: {
    mode: Profile3DMode;
    speed: number;
    frame: FrameStyle;
  };
  chatPosition: "right" | "left";
  feedLayout: "bento" | "grid" | "list";
  motionLevel: "off" | "subtle" | "full" | "cinematic";
}

const DEFAULT_PREFERENCES: UserPreferences = {
  preset: "3D",
  navigationOrder: [
    "/",
    "/chat",
    "/neo-space",
    "/groups",
    "/notices",
    "/events",
    "/saved",
    "/trending",
    "/settings",
    "/profile",
  ],
  hiddenMenus: [],
  pinnedMenus: ["/", "/chat", "/neo-space"],
  post3D: {
    mode: "flip",
    maxTilt: 10,
    depth: 20,
    autoRotate: false,
  },
  story3D: {
    mode: "3d",
  },
  profile3D: {
    mode: "tilt",
    speed: 2,
    frame: "lime",
  },
  chatPosition: "right",
  feedLayout: "bento",
  motionLevel: "full",
};

export const PRESET_CONFIGS: Record<PresetType, Partial<UserPreferences>> = {
  Minimal: {
    preset: "Minimal",
    motionLevel: "subtle",
    post3D: { mode: "flat", maxTilt: 0, depth: 0, autoRotate: false },
    story3D: { mode: "flat" },
    profile3D: { mode: "static", speed: 0, frame: "lime" },
    feedLayout: "list",
  },
  Classic: {
    preset: "Classic",
    motionLevel: "subtle",
    post3D: { mode: "tilt", maxTilt: 6, depth: 10, autoRotate: false },
    story3D: { mode: "flat" },
    profile3D: { mode: "tilt", speed: 1, frame: "lime" },
    feedLayout: "bento",
  },
  "3D": {
    preset: "3D",
    motionLevel: "full",
    post3D: { mode: "flip", maxTilt: 10, depth: 20, autoRotate: false },
    story3D: { mode: "3d" },
    profile3D: { mode: "tilt", speed: 2, frame: "purple" },
    feedLayout: "bento",
  },
  Cinematic: {
    preset: "Cinematic",
    motionLevel: "cinematic",
    post3D: { mode: "flip", maxTilt: 15, depth: 30, autoRotate: true },
    story3D: { mode: "cinematic" },
    profile3D: { mode: "spin", speed: 3, frame: "cyber" },
    feedLayout: "bento",
  },
  Productivity: {
    preset: "Productivity",
    motionLevel: "subtle",
    post3D: { mode: "tilt", maxTilt: 4, depth: 8, autoRotate: false },
    story3D: { mode: "flat" },
    profile3D: { mode: "static", speed: 0, frame: "lime" },
    feedLayout: "grid",
  },
  Creator: {
    preset: "Creator",
    motionLevel: "full",
    post3D: { mode: "flip", maxTilt: 12, depth: 25, autoRotate: false },
    story3D: { mode: "cinematic" },
    profile3D: { mode: "parallax", speed: 2, frame: "cyber" },
    feedLayout: "bento",
  },
  Custom: {
    preset: "Custom",
  },
};

interface UserPreferenceContextType {
  preferences: UserPreferences;
  updatePreferences: (newPrefs: Partial<UserPreferences>) => void;
  applyPreset: (preset: PresetType) => void;
  reorderNavigation: (newOrder: string[]) => void;
  toggleHideMenu: (path: string) => void;
  resetPreferences: () => void;
}

const UserPreferenceContext = createContext<UserPreferenceContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "ccneo_user_preferences_v2";

export function UserPreferenceProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (e) {
      console.error("Error loading user preferences", e);
    }
    return DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(preferences));
    } catch (e) {
      console.error("Error saving user preferences", e);
    }
  }, [preferences]);

  const updatePreferences = (newPrefs: Partial<UserPreferences>) => {
    setPreferences((prev) => ({
      ...prev,
      ...newPrefs,
      preset: newPrefs.preset || "Custom",
    }));
  };

  const applyPreset = (preset: PresetType) => {
    if (preset === "Custom") return;
    const config = PRESET_CONFIGS[preset];
    if (config) {
      setPreferences((prev) => ({
        ...prev,
        ...config,
        preset,
      }));
    }
  };

  const reorderNavigation = (newOrder: string[]) => {
    setPreferences((prev) => ({
      ...prev,
      navigationOrder: newOrder,
      preset: "Custom",
    }));
  };

  const toggleHideMenu = (path: string) => {
    setPreferences((prev) => {
      const hidden = prev.hiddenMenus.includes(path)
        ? prev.hiddenMenus.filter((p) => p !== path)
        : [...prev.hiddenMenus, path];
      return { ...prev, hiddenMenus: hidden, preset: "Custom" };
    });
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  return (
    <UserPreferenceContext.Provider
      value={{
        preferences,
        updatePreferences,
        applyPreset,
        reorderNavigation,
        toggleHideMenu,
        resetPreferences,
      }}
    >
      {children}
    </UserPreferenceContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferenceContext);
  if (!context) {
    throw new Error("useUserPreferences must be used within UserPreferenceProvider");
  }
  return context;
}
