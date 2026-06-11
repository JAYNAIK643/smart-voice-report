import { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  MapPin,
  LogOut,
  FileArchive,
  Mail,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

const WardAdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const sidebarRef = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/ward-admin/dashboard" },
    { icon: FileText, label: "Ward Complaints", path: "/ward-admin/complaints" },
    { icon: Mail, label: "Contact Messages", path: "/ward-admin/contact-messages" },
    { icon: MapPin, label: "My Ward", path: "/ward-admin/ward-info" },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <>
      {/* Top Navbar */}
      <nav className="fixed top-0 right-0 left-0 z-40 h-16 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-full px-4 md:px-6">
          {/* Left: hamburger (mobile) + logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Toggle sidebar menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileArchive className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">
                Ward Admin Portal
              </h1>
              <p className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-none">{user?.ward || "Ward Administrator"}</p>
            </div>
          </div>
          
          {/* Right: navigation links (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6 text-sm">
            <Link to="/" className="text-gray-600 hover:text-gray-900 whitespace-nowrap">Home</Link>
            <Link to="/services" className="text-gray-600 hover:text-gray-900 whitespace-nowrap">Services</Link>
            <Link to="/about" className="text-gray-600 hover:text-gray-900 whitespace-nowrap">About</Link>
            <span className="text-green-600 font-medium whitespace-nowrap">Ward Admin</span>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          fixed left-0 top-16 h-[calc(100vh-4rem)] w-[200px] bg-white border-r border-gray-200
          overflow-y-auto z-30 transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="py-6 px-3 space-y-1">
          {menuItems.map((item, index) => {
            const active = isActive(item.path);
            return (
              <Link
                key={index}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  active
                    ? "bg-green-50 text-green-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
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

export default WardAdminSidebar;
