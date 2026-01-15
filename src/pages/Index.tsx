import { MainLayout } from "@/components/layout/MainLayout";
import { StoriesBar } from "@/components/feed/StoriesBar";
import { BentoFeed } from "@/components/feed/BentoFeed";

const Index = () => {
  return (
    <MainLayout>
      <div className="min-h-screen">
        {/* Stories Bar */}
        <StoriesBar />
        
        {/* Bento Grid Feed */}
        <BentoFeed />
      </div>
    </MainLayout>
  );
};

export default Index;
