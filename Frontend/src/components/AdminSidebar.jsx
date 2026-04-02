// import { useState, useEffect, useRef } from "react";
// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { gsap } from "gsap";
// import {
//   LayoutDashboard,
//   FileText,
//   Users,
//   BarChart3,
//   MessageSquare,
//   Settings,
//   LogOut,
//   Menu,
//   X,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";

// const AdminSidebar = ({ sidebarOpen, setSidebarOpen }) => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const sidebarRef = useRef(null);
//   const buttonRefs = useRef([]);

//   const menuItems = [
//     { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
//     { icon: FileText, label: "Complaints", path: "/admin/complaints" },
//     { icon: Users, label: "Users", path: "/admin/users" },
//     { icon: BarChart3, label: "Reports", path: "/admin/reports" },
//     { icon: MessageSquare, label: "Feedback", path: "/admin/feedback" },
//     { icon: Settings, label: "Settings", path: "/admin/settings" },
//   ];

//   useEffect(() => {
//     gsap.to(sidebarRef.current, {
//       width: sidebarOpen ? 280 : 80,
//       duration: 0.5,
//       ease: "power3.inOut",
//     });
//   }, [sidebarOpen]);

//   const isActive = (path) => location.pathname === path;

//   const handleNavClick = (index, path) => {
//     // Animate button click
//     gsap.to(buttonRefs.current[index], {
//       scale: 0.95,
//       duration: 0.1,
//       yoyo: true,
//       repeat: 1,
//       ease: "power2.inOut",
//     });
//   };

//   const handleLogout = () => {
//     gsap.to(".admin-layout", {
//       opacity: 0,
//       duration: 0.3,
//       onComplete: () => {
//         navigate("/");
//       },
//     });
//   };

//   return (
//     <>
//       {/* Top Navbar */}
//       <nav className="fixed top-0 right-0 left-0 z-40 h-16 bg-card border-b border-border backdrop-blur-lg bg-card/80">
//         <div className="flex items-center justify-between h-full px-6">
//           <div className="flex items-center gap-4">
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={() => setSidebarOpen(!sidebarOpen)}
//               className="hover:bg-primary/10"
//             >
//               {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
//             </Button>
//             <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
//               SmartCity Admin Panel
//             </h1>
//           </div>
          
//           <div className="flex items-center gap-4">
//             <div className="flex items-center gap-3 pl-4 border-l border-border">
//               <div className="text-right">
//                 <p className="text-sm font-medium text-foreground">Admin User</p>
//                 <p className="text-xs text-muted-foreground">admin@smartcity.gov</p>
//               </div>
//               <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold shadow-glow">
//                 AU
//               </div>
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* Sidebar */}
//       <aside
//         ref={sidebarRef}
//         className="fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r border-border overflow-hidden z-30"
//         style={{ width: sidebarOpen ? 280 : 80 }}
//       >
//         <div className="p-4 space-y-2">
//           {menuItems.map((item, index) => {
//             const active = isActive(item.path);
//             return (
//               <Link
//                 key={index}
//                 to={item.path}
//                 ref={(el) => (buttonRefs.current[index] = el)}
//                 onClick={() => handleNavClick(index, item.path)}
//                 className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 relative overflow-hidden group ${
//                   active
//                     ? "bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-glow"
//                     : "text-muted-foreground hover:bg-primary/10"
//                 }`}
//               >
//                 {/* Animated glow effect for active item */}
//                 {active && (
//                   <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-accent/30 blur-xl animate-pulse" />
//                 )}
                
//                 {/* Sliding highlight bar */}
//                 {active && (
//                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-accent" />
//                 )}
                
//                 <item.icon 
//                   className={`h-5 w-5 flex-shrink-0 relative z-10 transition-transform duration-300 ${
//                     active ? "scale-110" : "group-hover:scale-110"
//                   }`} 
//                 />
//                 {sidebarOpen && (
//                   <span className="font-medium relative z-10 transition-all duration-300">
//                     {item.label}
//                   </span>
//                 )}
//               </Link>
//             );
//           })}
//         </div>

//         <div className="absolute bottom-4 left-0 right-0 px-4">
//           <button 
//             onClick={handleLogout}
//             className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-all duration-300 group"
//           >
//             <LogOut className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
//             {sidebarOpen && <span className="font-medium">Logout</span>}
//           </button>
//         </div>
//       </aside>
//     </>
//   );
// };

// export default AdminSidebar;

//---------Main Part------------//
import { useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
  FileArchive,
  Brain,
  HeartHandshake,
  Target,
  Layout,
  PieChart,
  Mail,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const sidebarRef = useRef(null);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    // Complaints management removed - handled by Ward Admins only
    { icon: Users, label: "Users", path: "/admin/users" },
    { icon: BarChart3, label: "Reports", path: "/admin/reports" },
    { icon: Brain, label: "Predictive Analytics", path: "/admin/predictive-analytics" },
    { icon: HeartHandshake, label: "Sentiment Analytics", path: "/admin/sentiment-analytics" },
    { icon: Target, label: "KPI Tracker", path: "/admin/kpi-tracker" },
    { icon: Layout, label: "Custom Dashboards", path: "/admin/custom-dashboards" },
    { icon: PieChart, label: "Analytics Dashboard", path: "/admin/analytics-dashboard" },
    { icon: Mail, label: "Contact Messages", path: "/admin/contact-messages" },
    { icon: MessageSquare, label: "Feedback", path: "/admin/feedback" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <>
      <nav className="fixed top-0 right-0 left-0 z-40 h-16 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileArchive className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">
              SmartCity Portal
            </h1>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <Link to="/" className="text-gray-600 hover:text-gray-900">Home</Link>
            <Link to="/services" className="text-gray-600 hover:text-gray-900">Services</Link>
            <Link to="/submit" className="text-gray-600 hover:text-gray-900">Submit Complaint</Link>
            <Link to="/track" className="text-gray-600 hover:text-gray-900">Track Complaint</Link>
            <Link to="/about" className="text-gray-600 hover:text-gray-900">About</Link>
            <span className="text-blue-600 font-medium">Admin</span>
          </div>
        </div>
      </nav>

      <aside
        ref={sidebarRef}
        className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-[200px] bg-white border-r border-gray-200 overflow-y-auto z-30"
      >
        <div className="py-6 px-3 space-y-1">
          {menuItems.map((item, index) => {
            const active = isActive(item.path);
            return (
              <Link
                key={index}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  active
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="absolute bottom-6 left-0 right-0 px-3">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
//-----------next part-----------------------//

// import { useState, useEffect, useRef } from "react";
// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { gsap } from "gsap";
// import {
//   LayoutDashboard,
//   FileText,
//   Users,
//   BarChart3,
//   MessageSquare,
//   Settings,
//   LogOut,
//   FileArchive,
// } from "lucide-react";
// import { useAuth } from "@/context/auth-context";

// const AdminSidebar = ({ sidebarOpen, setSidebarOpen }) => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { signOut } = useAuth();
//   const sidebarRef = useRef(null);

//   const menuItems = [
//     { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
//     { icon: FileText, label: "Complaints", path: "/admin/complaints" },
//     { icon: Users, label: "Users", path: "/admin/users" },
//     { icon: BarChart3, label: "Reports", path: "/admin/reports" },
//     { icon: MessageSquare, label: "Feedback", path: "/admin/feedback" },
//     { icon: Settings, label: "Settings", path: "/admin/settings" },
//   ];

//   const isActive = (path) => location.pathname === path;

//   const handleLogout = async () => {
//     await signOut();
//     navigate("/");
//   };

//   return (
//     <>
//       {/* Top Navbar - Clean White Design */}
//       <nav className="fixed top-0 right-0 left-0 z-40 h-16 bg-white border-b border-gray-200">
//         <div className="flex items-center justify-between h-full px-6">
//           <div className="flex items-center gap-3">
//             <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
//               <FileArchive className="w-5 h-5 text-white" />
//             </div>
//             <h1 className="text-lg font-semibold text-gray-900">
//               SmartCity Portal
//             </h1>
//           </div>
          
//           <div className="flex items-center gap-6 text-sm">
//             <Link to="/" className="text-gray-600 hover:text-gray-900">Home</Link>
//             <Link to="/services" className="text-gray-600 hover:text-gray-900">Services</Link>
//             <Link to="/submit" className="text-gray-600 hover:text-gray-900">Submit Complaint</Link>
//             <Link to="/track" className="text-gray-600 hover:text-gray-900">Track Complaint</Link>
//             <Link to="/about" className="text-gray-600 hover:text-gray-900">About</Link>
//             <span className="text-blue-600 font-medium">Admin</span>
//           </div>
//         </div>
//       </nav>

//       {/* Sidebar - Clean White Design */}
//       <aside
//         ref={sidebarRef}
//         className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-[200px] bg-white border-r border-gray-200 overflow-y-auto z-30"
//       >
//         <div className="py-6 px-3 space-y-1">
//           {menuItems.map((item, index) => {
//             const active = isActive(item.path);
//             return (
//               <Link
//                 key={index}
//                 to={item.path}
//                 className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
//                   active
//                     ? "bg-blue-50 text-blue-600"
//                     : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
//                 }`}
//               >
//                 <item.icon className="h-5 w-5 flex-shrink-0" />
//                 <span className="text-sm font-medium">{item.label}</span>
//               </Link>
//             );
//           })}
//         </div>

//         <div className="absolute bottom-6 left-0 right-0 px-3">
//           <button 
//             onClick={handleLogout}
//             className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
//           >
//             <LogOut className="h-5 w-5 flex-shrink-0" />
//             <span className="text-sm font-medium">Logout</span>
//           </button>
//         </div>
//       </aside>
//     </>
//   );
// };

// export default AdminSidebar;