import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateListing from "./pages/CreateListing";
import CreateRequest from "./pages/CreateRequest";
import ListingDetail from "./pages/ListingDetail";
import RequestDetail from "./pages/RequestDetail";
import Profile from "./pages/Profile";
import Matches from "./pages/Matches";
import Notifications from "./pages/Notifications";
import Chat from "./pages/Chat";
import RateExchange from "./pages/RateExchange";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <Layout>
                  <Home />
                </Layout>
              }
            />
            <Route path="/create-listing" element={<CreateListing />} />
            <Route path="/create-request" element={<CreateRequest />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/request/:id" element={<RequestDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-listings" element={<Profile />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/chat/:matchId" element={<Chat />} />
            <Route path="/chats" element={<Matches />} />
            <Route path="/rate/:matchId" element={<RateExchange />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
