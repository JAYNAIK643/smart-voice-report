import { useEffect } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import WardAdminSidebar from "@/components/WardAdminSidebar";

const WardAdminLayout = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = "Ward Admin Dashboard | SmartCity";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        "content",
        "SmartCity Ward Admin Dashboard: manage ward complaints and serve your community."
      );
    }
  }, []);

  if (location.pathname === "/ward-admin") {
    return <Navigate to="/ward-admin/dashboard" replace />;
  }

  return (
    <div className="ward-admin-layout min-h-screen bg-gray-50">
      <WardAdminSidebar />
      
      <main className="pt-16 pl-[200px]">
        <div className="ward-admin-content p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default WardAdminLayout;
