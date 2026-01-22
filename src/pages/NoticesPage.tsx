import { MainLayout } from "@/components/layout/MainLayout";
import { NoticeWall } from "@/components/feed/NoticeWall";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NoticesPage() {
    const navigate = useNavigate();

    return (
        <MainLayout showSidebars={false}>
            <div className="min-h-screen bg-background flex flex-col">
                <div className="p-4 border-b-2 border-foreground sticky top-0 bg-background z-10 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted transition-colors">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="font-display text-xl text-foreground">NOTICES</h1>
                </div>
                <div className="p-4">
                    <NoticeWall />
                </div>
            </div>
        </MainLayout>
    );
}
