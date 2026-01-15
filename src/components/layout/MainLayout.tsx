import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { NoticeWall } from "@/components/feed/NoticeWall";
import { TrendingPanel } from "@/components/feed/TrendingPanel";

interface MainLayoutProps {
  children: ReactNode;
  showSidebars?: boolean;
}

export function MainLayout({ children, showSidebars = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Main Content Area */}
      <main className={`
        ${showSidebars ? 'md:ml-64 md:mr-80' : 'md:ml-64'}
        min-h-screen pb-20 md:pb-0
      `}>
        {children}
      </main>

      {/* Right Sidebar - Desktop Only */}
      {showSidebars && (
        <div className="hidden md:block fixed right-0 top-0 w-80 h-screen border-l-2 border-foreground bg-background overflow-y-auto">
          <NoticeWall />
          <TrendingPanel />
        </div>
      )}
    </div>
  );
}
