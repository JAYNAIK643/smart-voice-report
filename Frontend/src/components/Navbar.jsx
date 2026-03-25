import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, FileText, LogOut, User, Settings, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationCenter from "@/components/NotificationCenter";
import VoiceNavigation from "@/components/voice/VoiceNavigation";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isWardAdmin, user, signOut, loading } = useAuth();
  const { toast } = useToast();

  const publicItems = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: "All Complaints", path: "/all-complaints" },
    { name: "Leaderboard", path: "/leaderboard" },
    { name: "About", path: "/about" },
  ];

  const userItems = [
    { name: "Submit Complaint", path: "/submit" },
    { name: "Track Complaint", path: "/track" },
  ];

  const getNavItems = () => {
    let items = [...publicItems];
    
    // Don't show user-specific items to admins or ward admins
    if (isAuthenticated && !isAdmin && !isWardAdmin) {
      items = [...items, ...userItems];
    }
    
    return items;
  };

  const navItems = getNavItems();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      navigate("/");
      setIsOpen(false);
    }
  };

  const handleAdminClick = () => {
    navigate("/admin-login");
    setIsOpen(false);
  };

  // Hide admin button on home page
  const showAdminButton = location.pathname !== "/";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border shadow-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              className="w-10 h-10 gradient-hero rounded-lg flex items-center justify-center shadow-glow"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <FileText className="w-6 h-6 text-white" />
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              SmartCity Portal
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  className={`relative ${
                    isActive(item.path)
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.name}
                  {isActive(item.path) && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      layoutId="navbar-indicator"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Button>
              </Link>
            ))}

            {/* Voice Navigation - NEW */}
            <VoiceNavigation className="ml-2" />

            <ThemeToggle />

            {isAuthenticated && !isAdmin && !isWardAdmin && <NotificationCenter />}

            {!loading && (
              <>
                {isAuthenticated ? (
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {user?.email?.split("@")[0]}
                    </span>
                    {isWardAdmin && (
                      <Link to="/ward-admin/dashboard">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Shield className="w-4 h-4" />
                          Dashboard
                        </Button>
                      </Link>
                    )}
                    {!isAdmin && !isWardAdmin && (
                      <Link to="/settings">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className="flex items-center gap-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 ml-2">
                    <Link to="/auth">
                      <Button variant="default" size="sm" className="gradient-button text-primary-foreground">
                        Login
                      </Button>
                    </Link>
                    {showAdminButton && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAdminClick}
                          className="flex items-center gap-1"
                        >
                          <Shield className="w-4 h-4" />
                          Admin
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { navigate("/ward-admin-login"); setIsOpen(false); }}
                          className="flex items-center gap-1"
                        >
                          <Shield className="w-4 h-4" />
                          Ward Admin
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden pb-4"
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
              >
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    isActive(item.path) ? "text-primary bg-primary/10" : ""
                  }`}
                >
                  {item.name}
                </Button>
              </Link>
            ))}

            <div className="flex items-center justify-between pt-2 border-t border-border mt-2 px-2">
              <span className="text-sm text-muted-foreground">Theme</span>
              <div className="flex items-center gap-2">
                {isAuthenticated && !isAdmin && !isWardAdmin && <NotificationCenter />}
                <ThemeToggle />
              </div>
            </div>
            
            {!loading && (
              <>
                {isAuthenticated ? (
                  <div className="pt-2 border-t border-border mt-2">
                    <div className="px-4 py-2 text-sm text-muted-foreground flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {user?.email}
                    </div>
                    {isWardAdmin && (
                      <Link to="/ward-admin/dashboard" onClick={() => setIsOpen(false)}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Ward Admin Dashboard
                        </Button>
                      </Link>
                    )}
                    {!isAdmin && !isWardAdmin && (
                      <Link to="/settings" onClick={() => setIsOpen(false)}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 mt-2">
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <Button
                        variant="default"
                        className="w-full gradient-button text-primary-foreground"
                      >
                        Login / Sign Up
                      </Button>
                    </Link>
                    {showAdminButton && (
                      <Button
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={handleAdminClick}
                      >
                        <Shield className="w-4 h-4" />
                        Admin Login
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;