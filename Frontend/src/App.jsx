import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Services from "./pages/Services";
import SubmitComplaint from "./pages/SubmitComplaint";
import TrackComplaint from "./pages/TrackComplaint";
import About from "./pages/About";
import Auth from "./pages/Auth";
import AdminLogin from "./pages/AdminLogin";
import WardAdminLogin from "./pages/WardAdminLogin";
import NotFound from "./pages/NotFound";
import UserDashboard from "./pages/UserDashboard";
import UserSettings from "./pages/UserSettings";
import LeaderboardPage from "./pages/LeaderboardPage";
import PublicIssues from "./pages/PublicIssues";
import AllComplaints from "@/pages/AllComplaints";
import DebugUpvote from "@/pages/DebugUpvote";
import AdminLayout from "./pages/AdminLayout";
import VerifyWardAdmin from "./pages/VerifyWardAdmin";
import WardAdminLayout from "./pages/WardAdminLayout";
import WardAdminManagement from "./pages/WardAdminManagement";
import Dashboard from "./pages/admin/Dashboard";
import Complaints from "./pages/admin/Complaints";
import Users from "./pages/admin/Users";
import Reports from "./pages/admin/Reports";
import Feedback from "./pages/admin/Feedback";
import Settings from "./pages/admin/Settings";
import PredictiveAnalytics from "./pages/admin/PredictiveAnalytics";
import SentimentAnalytics from "./pages/admin/SentimentAnalytics";
import KPITracker from "./pages/admin/KPITracker";
import CustomDashboards from "./pages/admin/CustomDashboards";
import AnalyticsDashboard from "./pages/admin/AnalyticsDashboard";
import WardAdminDashboard from "./pages/ward-admin/Dashboard";
import WardAdminComplaints from "./pages/ward-admin/Complaints";
import WardAdminWardInfo from "./pages/ward-admin/WardInfo";
import { ComplaintsProvider } from "@/context/complaints-context";
import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider } from "@/context/theme-context";
import { NotificationsProvider } from "@/context/notifications-context";
import { BadgesProvider } from "@/context/badges-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import AIChatbot from "@/components/AIChatbot";
import BadgeUnlockModal from "@/components/BadgeUnlockModal";
import FeedbackPrompt from "@/components/FeedbackPrompt";
import OfflineIndicator from "@/components/mobile/OfflineIndicator";
import PWAInstallPrompt from "@/components/mobile/PWAInstallPrompt";

const queryClient = new QueryClient();

const AppLayout = ({ children }) => {
  const location = useLocation();
  const hideNavAndFooter = location.pathname.startsWith('/ward-admin') || location.pathname.startsWith('/admin');

  console.log('🔍 AppLayout rendering:', { 
    pathname: location.pathname, 
    hideNavAndFooter,
    hasChildren: !!children 
  });

  return (
    <div className="flex flex-col min-h-screen">
      {!hideNavAndFooter && <Navbar />}
      <main className={hideNavAndFooter ? "" : "flex-1"}>
        {children}
      </main>
      {!hideNavAndFooter && <Footer />}
      {!hideNavAndFooter && <AIChatbot />}
      {!hideNavAndFooter && <BadgeUnlockModal />}
      {!hideNavAndFooter && <FeedbackPrompt />}
      {/* Mobile Experience Enhancements - Non-intrusive, fail-safe */}
      {!hideNavAndFooter && <OfflineIndicator />}
      {!hideNavAndFooter && <PWAInstallPrompt />}
    </div>
  );
};

const App = () => {
  console.log('🔍 App component rendering');
  
  // Force light mode for debugging
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    console.log('💡 Forced light mode');
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="smartcity-theme">
        <AuthProvider>
          <NotificationsProvider>
            <BadgesProvider>
              <ComplaintsProvider>
              <TooltipProvider>
            <Toaster />
            <Sonner />
            <HashRouter>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <UserDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/services" element={<Services />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/admin-login" element={<AdminLogin />} />
                  <Route path="/ward-admin-login" element={<WardAdminLogin />} />
                  <Route path="/verify-ward-admin/:token" element={<VerifyWardAdmin />} />
                  
                  {/* Ward Admin Routes */}
                  <Route 
                    path="/ward-admin" 
                    element={
                      <ProtectedRoute requireWardAdmin>
                        <WardAdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="dashboard" element={<WardAdminDashboard />} />
                    <Route path="complaints" element={<WardAdminComplaints />} />
                    <Route path="ward-info" element={<WardAdminWardInfo />} />
                  </Route>
                  
                  <Route 
                    path="/ward-admin/management" 
                    element={
                      <ProtectedRoute requireAdmin>
                        <WardAdminManagement />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/submit"
                    element={
                      <ProtectedRoute>
                        <SubmitComplaint />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/track"
                    element={
                      <ProtectedRoute>
                        <TrackComplaint />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/about" element={<About />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/issues" element={<PublicIssues />} />
                  <Route path="/debug-upvote" element={<DebugUpvote />} />
                  <Route
                    path="/all-complaints"
                    element={
                      <ProtectedRoute>
                        <AllComplaints />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <UserSettings />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requireAdmin>
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="complaints" element={<Complaints />} />
                    <Route path="users" element={<Users />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="feedback" element={<Feedback />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="predictive-analytics" element={<PredictiveAnalytics />} />
                    <Route path="sentiment-analytics" element={<SentimentAnalytics />} />
                    <Route path="kpi-tracker" element={<KPITracker />} />
                    <Route path="custom-dashboards" element={<CustomDashboards />} />
                    <Route path="analytics-dashboard" element={<AnalyticsDashboard />} />
                    <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            </HashRouter>
              </TooltipProvider>
              </ComplaintsProvider>
            </BadgesProvider>
          </NotificationsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;