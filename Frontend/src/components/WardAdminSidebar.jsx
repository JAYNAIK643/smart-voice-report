import { useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  MapPin,
  LogOut,
  FileArchive,
  Mail,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

const WardAdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const sidebarRef = useRef(null);

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
      <nav className="fixed top-0 right-0 left-0 z-40 h-16 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center">
              <FileArchive className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Ward Admin Portal
              </h1>
              <p className="text-xs text-gray-500">{user?.ward || "Ward Administrator"}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <Link to="/" className="text-gray-600 hover:text-gray-900">Home</Link>
            <Link to="/services" className="text-gray-600 hover:text-gray-900">Services</Link>
            <Link to="/about" className="text-gray-600 hover:text-gray-900">About</Link>
            <span className="text-green-600 font-medium">Ward Admin</span>
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
                    ? "bg-green-50 text-green-600"
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

export default WardAdminSidebar;
