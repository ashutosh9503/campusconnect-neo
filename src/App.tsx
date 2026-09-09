import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CallProvider } from "@/contexts/CallContext";
import { UserPreferenceProvider } from "@/contexts/UserPreferenceContext";
import { ShakePhysicsProvider } from "@/contexts/ShakePhysicsContext";
import { IncomingCallDialog } from "@/components/chat/IncomingCallDialog";
import { VideoCallOverlay } from "@/components/chat/VideoCallOverlay";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Chat from "./pages/Chat";
import ChatConversation from "./pages/ChatConversation";
import CreatePost from "./pages/CreatePost";
import CreateStory from "./pages/CreateStory";
import Notifications from "./pages/Notifications";
import Groups from "./pages/Groups";
import GroupChat from "./pages/GroupChat";
import Events from "./pages/Events";
import Saved from "./pages/Saved";
import Trending from "./pages/Trending";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Search from "./pages/Search";
import NotFound from "./pages/NotFound";
import NoticesPage from "./pages/NoticesPage";
import NeoSpace from "./pages/NeoSpace";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <UserPreferenceProvider>
        <ShakePhysicsProvider>
          <CallProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <IncomingCallDialog />
              <VideoCallOverlay />
              <BrowserRouter>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />

                  {/* Protected Routes */}
                  <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                  <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                  <Route path="/chat/:id" element={<ProtectedRoute><ChatConversation /></ProtectedRoute>} />
                  <Route path="/create-post" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
                  <Route path="/create-story" element={<ProtectedRoute><CreateStory /></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                  <Route path="/notices" element={<ProtectedRoute><NoticesPage /></ProtectedRoute>} />
                  <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
                  <Route path="/groups/:groupId/chat" element={<ProtectedRoute><GroupChat /></ProtectedRoute>} />
                  <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
                  <Route path="/saved" element={<ProtectedRoute><Saved /></ProtectedRoute>} />
                  <Route path="/trending" element={<ProtectedRoute><Trending /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
                  <Route path="/neo-space" element={<ProtectedRoute><NeoSpace /></ProtectedRoute>} />
                  <Route path="/profile/:username" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </CallProvider>
        </ShakePhysicsProvider>
      </UserPreferenceProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
