import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import ChatConversation from "./pages/ChatConversation";
import CreatePost from "./pages/CreatePost";
import CreateStory from "./pages/CreateStory";
import Notifications from "./pages/Notifications";
import Groups from "./pages/Groups";
import Events from "./pages/Events";
import Saved from "./pages/Saved";
import Trending from "./pages/Trending";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:id" element={<ChatConversation />} />
            <Route path="/create" element={<CreatePost />} />
            <Route path="/stories/create" element={<CreateStory />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/events" element={<Events />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
