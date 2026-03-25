/**
 * Mobile Experience Enhancement - Mobile Optimization Hook
 * Detects mobile devices and provides mobile-specific utilities
 */

import { useState, useEffect } from 'react';

/**
 * Custom hook for mobile detection and optimization
 * @returns {Object} Mobile optimization utilities
 */
export const useMobileOptimization = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [orientation, setOrientation] = useState('portrait');
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    const checkDevice = () => {
      // Check if mobile
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      setIsMobile(mobile);

      // Check if tablet
      const tablet = /(iPad|tablet|playbook|silk)|(android(?!.*mobile))/i.test(
        navigator.userAgent
      );
      setIsTablet(tablet);

      // Check touch support
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouch(touch);

      // Check orientation
      const orient = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
      setOrientation(orient);

      // Update viewport height (for mobile address bar)
      setViewportHeight(window.innerHeight);
    };

    // Initial check
    checkDevice();

    // Listen for orientation changes
    window.addEventListener('orientationchange', checkDevice);
    window.addEventListener('resize', checkDevice);

    return () => {
      window.removeEventListener('orientationchange', checkDevice);
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  /**
   * Get touch-friendly input props
   * @returns {Object} Props to apply to input elements
   */
  const getTouchFriendlyProps = () => {
    if (!isMobile) {
      return {};
    }

    return {
      style: {
        fontSize: '16px', // Prevent zoom on iOS
        minHeight: '44px', // Apple's recommended touch target size
      },
    };
  };

  /**
   * Check if device is in standalone mode (PWA)
   * @returns {boolean}
   */
  const isPWA = () => {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  };

  /**
   * Get optimal button size for touch
   * @returns {string} Button size class
   */
  const getTouchButtonSize = () => {
    return isMobile ? 'lg' : 'default';
  };

  /**
   * Get mobile-optimized spacing
   * @returns {string} Spacing class
   */
  const getMobileSpacing = () => {
    return isMobile ? 'space-y-4' : 'space-y-6';
  };

  return {
    isMobile,
    isTablet,
    isTouch,
    orientation,
    viewportHeight,
    isPWA: isPWA(),
    getTouchFriendlyProps,
    getTouchButtonSize,
    getMobileSpacing,
  };
};

export default useMobileOptimization;
