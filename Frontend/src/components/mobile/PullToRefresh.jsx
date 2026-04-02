import { useState, useRef, useCallback } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

/**
 * PullToRefresh Component - Mobile Experience Enhancement
 * Native-like pull-to-refresh gesture for mobile devices
 * 
 * Features:
 * - Touch gesture detection
 * - Visual feedback with rotation animation
 * - Haptic feedback on trigger
 * - Debounced refresh (min 1 second between)
 * - Auto-cancel on scroll back
 */

const PullToRefresh = ({ 
  onRefresh, 
  children, 
  threshold = 100,
  maxPull = 150,
  disabled = false 
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef(null);
  const lastRefreshTime = useRef(0);

  // Spring animation for smooth pull effect
  const pullY = useSpring(0, { stiffness: 300, damping: 30 });
  
  // Transform pull distance to rotation (0-360 degrees)
  const rotation = useTransform(pullY, [0, threshold], [0, 360]);
  
  // Transform pull distance to opacity
  const opacity = useTransform(pullY, [0, threshold / 2], [0, 1]);

  // Check if at top of scroll
  const isAtTop = useCallback(() => {
    if (!containerRef.current) return false;
    return containerRef.current.scrollTop <= 0;
  }, []);

  // Trigger haptic feedback
  const triggerHaptic = useCallback(() => {
    if (navigator.vibrate && /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      navigator.vibrate(20);
    }
  }, []);

  // Handle refresh with debounce
  const handleRefresh = useCallback(async () => {
    const now = Date.now();
    if (now - lastRefreshTime.current < 1000) {
      // Less than 1 second since last refresh, skip
      pullY.set(0);
      setIsPulling(false);
      return;
    }

    lastRefreshTime.current = now;
    setIsRefreshing(true);
    triggerHaptic();

    try {
      await onRefresh();
    } catch (error) {
      console.error('Pull-to-refresh failed:', error);
    } finally {
      setIsRefreshing(false);
      pullY.set(0);
      setIsPulling(false);
    }
  }, [onRefresh, pullY, triggerHaptic]);

  // Touch event handlers
  const handleTouchStart = useCallback((e) => {
    if (disabled || isRefreshing) return;
    
    // Only start if at top of scroll
    if (!isAtTop()) return;
    
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [disabled, isRefreshing, isAtTop]);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling || disabled || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    // Only pull down (positive diff)
    if (diff > 0 && isAtTop()) {
      // Apply resistance (pull gets harder as you go)
      const resistance = 0.5;
      const pullDistance = Math.min(diff * resistance, maxPull);
      pullY.set(pullDistance);
      
      // Prevent default scrolling while pulling
      if (pullDistance > 10) {
        e.preventDefault();
      }
    }
  }, [isPulling, disabled, isRefreshing, isAtTop, pullY, maxPull]);

  const handleTouchEnd = useCallback(() => {
    if (!isPulling) return;
    
    const currentPull = pullY.get();
    
    if (currentPull >= threshold) {
      // Threshold reached, trigger refresh
      pullY.set(threshold);
      handleRefresh();
    } else {
      // Not enough pull, snap back
      pullY.set(0);
      setIsPulling(false);
    }
  }, [isPulling, pullY, threshold, handleRefresh]);

  // Mouse event handlers for desktop testing
  const handleMouseDown = useCallback((e) => {
    if (disabled || isRefreshing) return;
    if (!isAtTop()) return;
    
    startY.current = e.clientY;
    setIsPulling(true);
  }, [disabled, isRefreshing, isAtTop]);

  const handleMouseMove = useCallback((e) => {
    if (!isPulling || disabled || isRefreshing) return;
    
    const diff = e.clientY - startY.current;
    
    if (diff > 0 && isAtTop()) {
      const resistance = 0.5;
      const pullDistance = Math.min(diff * resistance, maxPull);
      pullY.set(pullDistance);
    }
  }, [isPulling, disabled, isRefreshing, isAtTop, pullY, maxPull]);

  const handleMouseUp = useCallback(() => {
    handleTouchEnd();
  }, [handleTouchEnd]);

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden"
      style={{ touchAction: isPulling ? 'none' : 'auto' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-10"
        style={{ 
          y: pullY,
          opacity,
          height: threshold
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <motion.div
            style={{ rotate: rotation }}
            className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <RefreshCw 
              className={`w-5 h-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`} 
            />
          </motion.div>
          <span className="text-xs text-muted-foreground">
            {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
          </span>
        </div>
      </motion.div>

      {/* Content with pull offset */}
      <motion.div
        style={{ y: pullY }}
        className="bg-background"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
