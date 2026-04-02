import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, PlusCircle, List, Bell, User, Shield } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notifications-context';
import { useToast } from '@/hooks/use-toast';

/**
 * Bottom Navigation Bar - Mobile Experience Enhancement
 * Fixed bottom navigation for quick one-handed access on mobile devices
 * 
 * Features:
 * - Fixed position with safe area insets for iPhone notch
 * - Haptic feedback on tap (mobile only)
 * - Badge notifications for unread items
 * - Hide on scroll down, show on scroll up
 * - Active state with smooth animations
 */

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isWardAdmin, user } = useAuth();
  const { unreadCount } = useNotifications();
  const { toast } = useToast();
  
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  // Navigation items configuration
  const getNavItems = () => {
    const items = [
      { icon: Home, label: 'Home', path: '/', show: true },
      { icon: PlusCircle, label: 'Submit', path: '/submit', show: isAuthenticated && !isAdmin && !isWardAdmin },
      { icon: List, label: 'Track', path: '/track', show: isAuthenticated && !isAdmin && !isWardAdmin },
      { 
        icon: Bell, 
        label: 'Alerts', 
        path: '/notifications', 
        show: isAuthenticated && !isAdmin && !isWardAdmin,
        badge: unreadCount > 0 ? unreadCount : null
      },
      { icon: User, label: 'Profile', path: '/settings', show: isAuthenticated && !isAdmin && !isWardAdmin },
    ];
    
    // If user is admin or ward admin, show dashboard link instead
    if (isAdmin || isWardAdmin) {
      items[1] = { icon: Shield, label: 'Dashboard', path: isWardAdmin ? '/ward-admin/dashboard' : '/admin', show: true };
      items[2] = { icon: List, label: 'Complaints', path: isWardAdmin ? '/ward-admin/complaints' : '/admin/complaints', show: true };
      items[3] = { icon: User, label: 'Profile', path: '/settings', show: true };
      items.pop(); // Remove extra item
    }
    
    // If not authenticated, show login
    if (!isAuthenticated) {
      return [
        { icon: Home, label: 'Home', path: '/', show: true },
        { icon: List, label: 'Issues', path: '/all-complaints', show: true },
        { icon: User, label: 'Login', path: '/auth', show: true },
      ];
    }
    
    return items.filter(item => item.show);
  };

  const navItems = getNavItems();

  // Update active index based on current path
  useEffect(() => {
    const index = navItems.findIndex(item => location.pathname === item.path);
    if (index !== -1) {
      setActiveIndex(index);
    }
  }, [location.pathname, navItems]);

  // Handle scroll behavior (hide on scroll down, show on scroll up)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Only hide on mobile (< 768px)
      if (window.innerWidth >= 768) {
        setIsVisible(true);
        return;
      }
      
      // Show when scrolling up or at top
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Haptic feedback on mobile
  const triggerHaptic = () => {
    if (navigator.vibrate && /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      navigator.vibrate(10); // Subtle 10ms vibration
    }
  };

  const handleNavClick = (index, path) => {
    triggerHaptic();
    setActiveIndex(index);
    navigate(path);
  };

  // Don't render on desktop
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          <div className="bg-background/95 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-around h-16 px-2">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeIndex === index;
                
                return (
                  <motion.button
                    key={item.path}
                    onClick={() => handleNavClick(index, item.path)}
                    className={`relative flex flex-col items-center justify-center flex-1 h-full min-w-[48px] transition-colors duration-200 ${
                      isActive 
                        ? 'text-primary' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    whileTap={{ scale: 0.9 }}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="bottom-nav-indicator"
                        className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                    
                    {/* Icon with badge */}
                    <div className="relative">
                      <Icon 
                        className={`w-6 h-6 transition-all duration-200 ${
                          isActive ? 'stroke-[2.5px]' : 'stroke-2'
                        }`} 
                      />
                      
                      {/* Badge */}
                      {item.badge && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </div>
                    
                    {/* Label */}
                    <span className={`text-[10px] mt-0.5 font-medium transition-all duration-200 ${
                      isActive ? 'opacity-100' : 'opacity-70'
                    }`}>
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
};

export default BottomNav;
