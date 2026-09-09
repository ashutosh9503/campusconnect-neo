import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { MobileHeader } from "./MobileHeader";
import { MobileCreateButton } from "@/components/layout/MobileCreateButton";
import { NoticeWall } from "@/components/feed/NoticeWall";
import { TrendingPanel } from "@/components/feed/TrendingPanel";
import { Background3D } from "@/components/3d/Background3D";
import { ShakePhysicsControl } from "@/components/physics/ShakePhysicsControl";

interface MainLayoutProps {
  children: ReactNode;
  showSidebars?: boolean;
}

export function MainLayout({ children, showSidebars = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Dynamic 3D Ambient WebGL/Canvas Layer */}
      <Background3D />

      {/* Sticky Mobile Header */}
      <MobileHeader />

      {/* Desktop Sidebar */}
      <div className="hidden md:block relative z-30">
        <Sidebar />
      </div>

      {/* Mobile Sliding Bottom Navigation Bar */}
      <MobileNav />

      {/* Desktop & Mobile Shake Test Trigger */}
      <ShakePhysicsControl />

      {/* Main Content Area */}
      <main
        className={`
        ${showSidebars ? "md:ml-64 md:mr-80" : "md:ml-64"}
        min-h-screen pb-28 md:pb-0 relative z-10 perspective-1000 transform-style-3d
      `}
      >
        {children}
      </main>

      {/* Right Sidebar - Desktop Only */}
      {showSidebars && (
        <div className="hidden md:block fixed right-0 top-0 w-80 h-screen border-l-2 border-foreground bg-background overflow-y-auto z-30">
          <NoticeWall />
          <TrendingPanel />
        </div>
      )}
    </div>
  );
}

