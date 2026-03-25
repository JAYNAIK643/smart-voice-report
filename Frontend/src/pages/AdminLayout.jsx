// import { useEffect, useState } from "react";
// import { Outlet, Navigate, useLocation } from "react-router-dom";
// import { gsap } from "gsap";
// import AdminSidebar from "@/components/AdminSidebar";

// const AdminLayout = () => {
//   const location = useLocation();
//   const [sidebarOpen, setSidebarOpen] = useState(true);

//   useEffect(() => {
//     document.title = "Admin Dashboard | SmartCity";
//     const desc = document.querySelector('meta[name="description"]');
//     if (desc) {
//       desc.setAttribute(
//         "content",
//         "SmartCity Admin Dashboard: manage complaints, monitor trends, and improve civic services."
//       );
//     }
//   }, []);

//   useEffect(() => {
//     // Page transition animation
//     gsap.fromTo(
//       ".admin-content",
//       { opacity: 0, x: 20 },
//       { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }
//     );
//   }, [location.pathname]);

//   // Redirect /admin to /admin/dashboard
//   if (location.pathname === "/admin") {
//     return <Navigate to="/admin/dashboard" replace />;
//   }

//   return (
//     <div className="admin-layout min-h-screen bg-background">
//       <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
//       <main 
//         className="pt-16 transition-all duration-500"
//         style={{ paddingLeft: sidebarOpen ? 280 : 80 }}
//       >
//         <div className="admin-content p-8">
//           <Outlet />
//         </div>
//       </main>
//     </div>
//   );
// };

// export default AdminLayout;

//--------Main Part---------------//
import { useEffect } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import AdminSidebar from "@/components/AdminSidebar";

const AdminLayout = () => {
  const location = useLocation();

  // Debug: log route changes
  useEffect(() => {
    console.log('AdminLayout: Current path:', location.pathname);
    document.title = "Admin Dashboard | SmartCity";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        "content",
        "SmartCity Admin Dashboard: manage complaints, monitor trends, and improve civic services."
      );
    }
  }, [location.pathname]);

  // Redirect /admin to /admin/dashboard
  if (location.pathname === "/admin" || location.pathname === "/admin/") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="admin-layout min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <main className="pt-16 pl-[200px]">
        <div className="admin-content p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

//---------------------next part--------------//
// import { useEffect, useState } from "react";
// import { Outlet, Navigate, useLocation } from "react-router-dom";
// import AdminSidebar from "@/components/AdminSidebar";

// const AdminLayout = () => {
//   const location = useLocation();
//   const [sidebarOpen, setSidebarOpen] = useState(true);

//   useEffect(() => {
//     document.title = "Admin Dashboard | SmartCity";
//     const desc = document.querySelector('meta[name="description"]');
//     if (desc) {
//       desc.setAttribute(
//         "content",
//         "SmartCity Admin Dashboard: manage complaints, monitor trends, and improve civic services."
//       );
//     }
//   }, []);

//   if (location.pathname === "/admin") {
//     return <Navigate to="/admin/dashboard" replace />;
//   }

//   return (
//     <div className="admin-layout min-h-screen bg-gray-50">
//       <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
//       <main className="pt-16 pl-[200px]">
//         <div className="admin-content p-8">
//           <Outlet />
//         </div>
//       </main>
//     </div>
//   );
// };

// export default AdminLayout;