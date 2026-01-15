import { MainLayout } from "@/components/layout/MainLayout";
import { 
  User, 
  Bell, 
  Lock, 
  Smartphone, 
  Moon, 
  LogOut, 
  ChevronRight,
  Shield,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingItem {
  icon: typeof User;
  label: string;
  description: string;
  action?: () => void;
  danger?: boolean;
}

const settingsGroups = [
  {
    title: "ACCOUNT",
    items: [
      { icon: User, label: "Edit Profile", description: "Update your name, bio, and avatar" },
      { icon: Lock, label: "Privacy", description: "Manage who can see your content" },
      { icon: Bell, label: "Notifications", description: "Configure push and email notifications" },
    ],
  },
  {
    title: "APP",
    items: [
      { icon: Smartphone, label: "Install App", description: "Add CampusConnect to your home screen" },
      { icon: Moon, label: "Appearance", description: "Always dark mode (OLED optimized)" },
    ],
  },
  {
    title: "SUPPORT",
    items: [
      { icon: HelpCircle, label: "Help Center", description: "FAQs and support" },
      { icon: Shield, label: "Report Issue", description: "Report bugs or inappropriate content" },
    ],
  },
  {
    title: "DANGER ZONE",
    items: [
      { icon: LogOut, label: "Sign Out", description: "Sign out of your account", danger: true },
    ],
  },
];

export default function Settings() {
  return (
    <MainLayout showSidebars={false}>
      <div className="min-h-screen max-w-2xl mx-auto">
        {/* Header */}
        <div className="p-4 border-b-2 border-foreground sticky top-0 bg-background z-10">
          <h1 className="font-display text-xl text-foreground">SETTINGS</h1>
        </div>

        {/* Settings Groups */}
        <div className="p-4 space-y-6">
          {settingsGroups.map((group) => (
            <div key={group.title}>
              <h2 className="font-display text-xs text-muted-foreground mb-2">{group.title}</h2>
              <div className="border-2 border-foreground divide-y-2 divide-border">
                {group.items.map((item) => (
                  <button
                    key={item.label}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 hover:bg-muted transition-colors text-left",
                      item.danger && "hover:bg-destructive/10"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 border-2 border-foreground flex items-center justify-center",
                      item.danger ? "bg-destructive/20" : "bg-muted"
                    )}>
                      <item.icon className={cn(
                        "w-5 h-5",
                        item.danger ? "text-destructive" : "text-foreground"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-mono text-sm",
                        item.danger ? "text-destructive" : "text-foreground"
                      )}>
                        {item.label}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 text-center border-t-2 border-foreground mt-8">
          <p className="font-mono text-xs text-muted-foreground">
            CampusConnect v1.0.0
          </p>
          <p className="font-mono text-[10px] text-muted-foreground mt-1">
            TSNDC Edition • Made with 💚
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
