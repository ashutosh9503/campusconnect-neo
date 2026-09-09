import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Send, Bot, Check, Zap } from "lucide-react";
import { useUserPreferences, PresetType } from "@/contexts/UserPreferenceContext";
import { useToast } from "@/hooks/use-toast";

interface NeoAIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NeoAIModal({ isOpen, onClose }: NeoAIModalProps) {
  const { preferences, updatePreferences, applyPreset } = useUserPreferences();
  const { toast } = useToast();
  const [command, setCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const QUICK_COMMANDS = [
    "Make my CCNEO look minimal",
    "Make everything futuristic & 3D",
    "Set layout to Creator mode",
    "Put chat on the left side",
    "Set to fast Productivity mode",
  ];

  const handleProcessCommand = (promptText: string) => {
    const prompt = promptText.toLowerCase().trim();
    if (!prompt) return;

    setIsProcessing(true);
    setAiMessage(null);

    setTimeout(() => {
      let response = "Applied customization based on your request!";

      if (prompt.includes("minimal") || prompt.includes("clean") || prompt.includes("simple")) {
        applyPreset("Minimal");
        response = "⚡ Switched to Minimal mode! Reduced 3D motion, clean list feed, and focused layout.";
      } else if (prompt.includes("futuristic") || prompt.includes("3d") || prompt.includes("cyber")) {
        applyPreset("3D");
        updatePreferences({ motionLevel: "full" });
        response = "🚀 Futuristic 3D mode activated! Full 3D rotatable posts, 3D stories, and cyber lighting enabled.";
      } else if (prompt.includes("creator")) {
        applyPreset("Creator");
        response = "🎬 Creator mode enabled! Optimized for media creation, cinematic stories, and engagement.";
      } else if (prompt.includes("productivity") || prompt.includes("fast")) {
        applyPreset("Productivity");
        response = "📊 Productivity mode set! Fast grid layout, low latency 3D, and quick shortcuts enabled.";
      } else if (prompt.includes("left")) {
        updatePreferences({ chatPosition: "left" });
        response = "👈 Chat position moved to the left sidebar!";
      } else if (prompt.includes("right")) {
        updatePreferences({ chatPosition: "right" });
        response = "👉 Chat position moved to the right side!";
      } else {
        // Fallback default smart boost
        applyPreset("3D");
        response = "✨ Optimized your CCNEO interface settings for peak interactive experience!";
      }

      setAiMessage(response);
      setIsProcessing(false);

      toast({
        title: "NEO AI Personalization Applied! 🤖",
        description: response,
      });
    }, 600);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-2 border-foreground max-w-md bg-card shadow-brutal-purple">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2 text-foreground">
            <Bot className="w-5 h-5 text-secondary animate-bounce" />
            NEO AI PERSONALIZATION ASSISTANT
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="font-mono text-xs text-muted-foreground">
            Tell NEO AI how you want your CCNEO interface organized or styled in plain words:
          </p>

          {/* Prompt Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Make my CCNEO look minimal..."
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleProcessCommand(command)}
              className="w-full pl-3 pr-10 py-3 bg-background border-2 border-foreground font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary"
            />
            <button
              onClick={() => handleProcessCommand(command)}
              disabled={isProcessing || !command.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-secondary text-secondary-foreground border border-foreground disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Command Chips */}
          <div className="space-y-2">
            <p className="font-mono text-[10px] text-muted-foreground font-bold uppercase">Quick Suggestions:</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_COMMANDS.map((suggest) => (
                <button
                  key={suggest}
                  onClick={() => {
                    setCommand(suggest);
                    handleProcessCommand(suggest);
                  }}
                  className="px-2.5 py-1 bg-muted/60 hover:bg-secondary/20 hover:text-secondary border border-foreground font-mono text-[10px] text-foreground transition-colors flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 text-primary" />
                  <span>{suggest}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Response Output Box */}
          {aiMessage && (
            <div className="p-3 bg-secondary/10 border-2 border-secondary font-mono text-xs text-foreground flex items-start gap-2">
              <Check className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
              <p>{aiMessage}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
