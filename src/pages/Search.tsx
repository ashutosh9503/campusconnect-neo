import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { UserSearch } from "@/components/UserSearch";
import { Search as SearchIcon } from "lucide-react";

export default function Search() {
    const navigate = useNavigate();

    const handleSelectUser = (user: { username: string | null; id: string }) => {
        navigate(`/profile/${user.username || user.id}`); // Fallback to ID if username missing (shouldn't happen with valid profile)
    };

    return (
        <MainLayout showSidebars={true}>
            <div className="max-w-2xl mx-auto p-4 min-h-screen">
                <div className="mb-8 flex items-center gap-3 border-b-2 border-foreground pb-4">
                    <SearchIcon className="w-8 h-8 text-primary" />
                    <h1 className="font-display text-3xl text-foreground">SEARCH</h1>
                </div>

                <div className="space-y-6">
                    <div className="bg-card border-2 border-foreground p-6">
                        <h2 className="font-mono text-lg text-foreground mb-4">FIND USERS</h2>
                        <UserSearch
                            onSelectUser={handleSelectUser}
                            placeholder="Search by username or name..."
                            className="w-full"
                        />
                    </div>

                    <div className="bg-muted p-6 border-2 border-foreground text-center">
                        <p className="font-mono text-sm text-muted-foreground">
                            Search for students, faculty, and friends on CampusConnect.
                        </p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
