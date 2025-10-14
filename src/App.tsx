import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useAuth } from "@/hooks/useAuth";
import BottomBanner from "@/components/BottomBanner";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Registration from "./pages/Registration";
import WaitingApproval from "./pages/WaitingApproval";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import OrganizationMaster from "./pages/OrganizationMaster";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ApprovedGuard = ({ children }: { children: JSX.Element }) => {
  const { user, loading, isApproved, underRegistration } = useAuth();
  if (loading) return children;

  // If user is on auth page, let them stay there
  if (window.location.pathname === "/auth") {
    return children;
  }

  // If user is on registration page, let them stay there
  if (window.location.pathname === "/registration") {
    return children;
  }

  // If user is on waiting-approval page, let them stay there
  if (window.location.pathname === "/waiting-approval") {
    return children;
  }

  // If user is on forgot-password page, let them stay there
  if (window.location.pathname === "/forgot-password") {
    return children;
  }

  // If user is on reset-password page, let them stay there
  if (window.location.pathname === "/reset-password") {
    return children;
  }

  // If no user, redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user is under registration process, redirect to registration
  if (underRegistration) {
    return <Navigate to="/registration" replace />;
  }

  // If user exists but profile is incomplete, redirect to registration
  if (!user?.profile?.first_name || !user?.profile?.phone) {
    return <Navigate to="/registration" replace />;
  }

  // If user exists but not approved, redirect to waiting approval
  if (user && !isApproved && user?.profile?.first_name && user?.profile?.phone) {
    return <Navigate to="/waiting-approval" replace />;
  }

  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="pb-16">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/profile" element={<ApprovedGuard><Profile /></ApprovedGuard>} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/registration" element={<Registration />} />
              <Route path="/waiting-approval" element={<WaitingApproval />} />
              <Route path="/admin" element={<ApprovedGuard><AdminDashboard /></ApprovedGuard>} />
              <Route path="/dashboard" element={<ApprovedGuard><UserDashboard /></ApprovedGuard>} />
              <Route path="/organizations" element={<ApprovedGuard><OrganizationMaster /></ApprovedGuard>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <BottomBanner />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
