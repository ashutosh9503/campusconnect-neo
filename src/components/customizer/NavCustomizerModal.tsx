import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MoveUp, MoveDown, Eye, EyeOff, Check, RotateCcw, LayoutList } from "lucide-react";
import { useUserPreferences } from "@/contexts/UserPreferenceContext";
import { cn } from "@/lib/utils";

interface NavCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEM_NAMES: Record<string, string> = {
  "/": "Feed",
  "/chat": "Messages",
  "/neo-space": "NEO Space 3D",
  "/groups": "Groups",
  "/notices": "Notices",
  "/search": "Search",
  "/events": "Events",
  "/saved": "Saved",
  "/trending": "Trending",
  "/settings": "Settings",
  "/profile": "Profile",
};

export function NavCustomizerModal({ isOpen, onClose }: NavCustomizerModalProps) {
  const { preferences, reorderNavigation, toggleHideMenu, resetPreferences } = useUserPreferences();
  const [items, setItems] = useState<string[]>(preferences.navigationOrder);

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    const temp = newItems[index - 1];
    newItems[index - 1] = newItems[index];
    newItems[index] = temp;
    setItems(newItems);
    reorderNavigation(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    const temp = newItems[index + 1];
    newItems[index + 1] = newItems[index];
    newItems[index] = temp;
    setItems(newItems);
    reorderNavigation(newItems);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-2 border-foreground max-w-md bg-card shadow-brutal-lime">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2 text-foreground">
            <LayoutList className="w-5 h-5 text-primary" />
            CUSTOMIZE MENU LAYOUT
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="font-mono text-xs text-muted-foreground">
            Reorder items or hide sections to personalize your sidebar and mobile navigation:
          </p>

          <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
            {items.map((path, idx) => {
              const isHidden = preferences.hiddenMenus.includes(path);
              const name = NAV_ITEM_NAMES[path] || path;

              return (
                <div
                  key={path}
                  className={cn(
                    "flex items-center justify-between p-2.5 bg-background border-2 border-foreground font-mono text-xs transition-all",
                    isHidden && "opacity-50 bg-muted/40"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-muted border border-foreground flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-foreground">{name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">({path})</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      className="p-1 hover:bg-muted border border-foreground disabled:opacity-30"
                      title="Move Up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === items.length - 1}
                      className="p-1 hover:bg-muted border border-foreground disabled:opacity-30"
                      title="Move Down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleHideMenu(path)}
                      className={cn(
                        "p-1 border border-foreground transition-colors",
                        isHidden ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
                      )}
                      title={isHidden ? "Show Menu Item" : "Hide Menu Item"}
                    >
                      {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t-2 border-border">
            <button
              onClick={resetPreferences}
              className="px-3 py-2 bg-muted text-muted-foreground border-2 border-foreground font-mono text-xs flex items-center gap-1 hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Default
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-primary-foreground border-2 border-foreground font-mono text-xs font-bold hover-brutal flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              SAVE & APPLY
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
