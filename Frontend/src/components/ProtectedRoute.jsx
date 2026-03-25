import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";

const ProtectedRoute = ({ children, requireAdmin = false, requireWardAdmin = false }) => {
  const { isAuthenticated, isManagement, isWardAdmin, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // If admin route is accessed without auth, redirect to admin login
    if (requireAdmin || location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin-login" state={{ from: location.pathname + location.search }} replace />;
    }
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    // Only super admins can access admin routes
    if (isWardAdmin) {
      // Ward admins should go to their own dashboard
      return <Navigate to="/ward-admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  if (requireWardAdmin && !isWardAdmin) {
    // Ward admin routes should only be accessible to ward admins
    if (isAdmin) {
      // Super admins should go to their dashboard
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
