import { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Trash2, Edit, CheckCircle, ArrowUpCircle, X } from 'lucide-react';

/**
 * SwipeableItem Component - Mobile Experience Enhancement
 * Swipe gesture support for list items with action buttons
 * 
 * Features:
 * - Swipe left/right to reveal actions
 * - Haptic feedback on action trigger
 * - Visual preview of actions while swiping
 * - Cancel on vertical scroll
 * - Undo option after swipe (3 seconds)
 * - Smooth 60fps animations
 */

const SwipeableItem = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftActions = [],
  rightActions = [],
  threshold = 80,
  disabled = false,
  className = ''
}) => {
  const [isSwiping, setIsSwiping] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const x = useMotionValue(0);
  const containerRef = useRef(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const undoTimeoutRef = useRef(null);

  // Transform x position to opacity for action buttons
  const leftOpacity = useTransform(x, [0, threshold], [0, 1]);
  const rightOpacity = useTransform(x, [0, -threshold], [0, 1]);

  // Trigger haptic feedback
  const triggerHaptic = useCallback((pattern = 'light') => {
    if (navigator.vibrate && /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      const patterns = {
        light: 10,
        medium: 20,
        heavy: 30,
        success: [50],
        error: [100, 50, 100]
      };
      navigator.vibrate(patterns[pattern] || 10);
    }
  }, []);

  // Execute action with undo option
  const executeAction = useCallback((action, direction) => {
    triggerHaptic('success');
    
    // Show undo option
    setShowUndo(true);
    setLastAction({ action, direction, timestamp: Date.now() });
    
    // Auto-hide undo after 3 seconds
    undoTimeoutRef.current = setTimeout(() => {
      setShowUndo(false);
      // Actually execute the action after undo period
      if (direction === 'left' && onSwipeLeft) {
        onSwipeLeft();
      } else if (direction === 'right' && onSwipeRight) {
        onSwipeRight();
      }
    }, 3000);
  }, [onSwipeLeft, onSwipeRight, triggerHaptic]);

  // Handle undo
  const handleUndo = useCallback(() => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    setShowUndo(false);
    setLastAction(null);
    triggerHaptic('light');
    
    // Animate back to center
    animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
  }, [x, triggerHaptic]);

  // Touch start handler
  const handleTouchStart = useCallback((e) => {
    if (disabled || showUndo) return;
    
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    isDragging.current = false;
  }, [disabled, showUndo]);

  // Touch move handler
  const handleTouchMove = useCallback((e) => {
    if (disabled || showUndo) return;
    
    const touch = e.touches[0];
    const diffX = touch.clientX - startX.current;
    const diffY = touch.clientY - startY.current;
    
    // Determine if horizontal or vertical swipe
    if (!isDragging.current) {
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
        isDragging.current = true;
        setIsSwiping(true);
      } else if (Math.abs(diffY) > 10) {
        // Vertical scroll, don't interfere
        return;
      }
    }
    
    if (isDragging.current) {
      e.preventDefault();
      
      // Apply resistance
      const resistance = 0.8;
      const newX = diffX * resistance;
      
      // Limit swipe distance
      const maxSwipe = Math.max(threshold * 2, 200);
      const clampedX = Math.max(-maxSwipe, Math.min(maxSwipe, newX));
      
      x.set(clampedX);
    }
  }, [disabled, showUndo, x, threshold]);

  // Touch end handler
  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || showUndo) {
      setIsSwiping(false);
      return;
    }
    
    isDragging.current = false;
    setIsSwiping(false);
    
    const currentX = x.get();
    
    if (currentX > threshold && rightActions.length > 0) {
      // Swiped right - execute right action
      executeAction(rightActions[0], 'right');
      animate(x, threshold, { type: 'spring', stiffness: 500, damping: 30 });
    } else if (currentX < -threshold && leftActions.length > 0) {
      // Swiped left - execute left action
      executeAction(leftActions[0], 'left');
      animate(x, -threshold, { type: 'spring', stiffness: 500, damping: 30 });
    } else {
      // Not enough swipe, snap back
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
    }
  }, [x, threshold, leftActions, rightActions, showUndo, executeAction]);

  // Render action button
  const renderActionButton = (action, direction) => {
    const Icon = action.icon || (direction === 'left' ? Trash2 : Edit);
    const bgColor = action.color || (direction === 'left' ? 'bg-red-500' : 'bg-blue-500');
    
    return (
      <button
        onClick={() => {
          triggerHaptic('medium');
          if (direction === 'left' && onSwipeLeft) {
            onSwipeLeft();
          } else if (direction === 'right' && onSwipeRight) {
            onSwipeRight();
          }
          animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
        }}
        className={`${bgColor} text-white flex items-center justify-center px-4 h-full min-w-[80px]`}
      >
        <Icon className="w-5 h-5" />
        {action.label && (
          <span className="ml-2 text-sm font-medium">{action.label}</span>
        )}
      </button>
    );
  };

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Background actions layer */}
      <div className="absolute inset-0 flex justify-between items-stretch">
        {/* Left actions (revealed on swipe right) */}
        <motion.div 
          className="flex items-stretch"
          style={{ opacity: rightOpacity }}
        >
          {rightActions.map((action, index) => (
            <div key={index}>
              {renderActionButton(action, 'right')}
            </div>
          ))}
        </motion.div>
        
        {/* Right actions (revealed on swipe left) */}
        <motion.div 
          className="flex items-stretch"
          style={{ opacity: leftOpacity }}
        >
          {leftActions.map((action, index) => (
            <div key={index}>
              {renderActionButton(action, 'left')}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Swipeable content */}
      <motion.div
        style={{ x }}
        className="relative bg-background touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </motion.div>

      {/* Undo notification */}
      {showUndo && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
        >
          <span className="text-sm">Action performed</span>
          <button
            onClick={handleUndo}
            className="text-primary font-medium text-sm hover:underline"
          >
            Undo
          </button>
          <button
            onClick={() => setShowUndo(false)}
            className="ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </div>
  );
};

// Preset action configurations
export const SwipeActions = {
  delete: { icon: Trash2, color: 'bg-red-500', label: 'Delete' },
  edit: { icon: Edit, color: 'bg-blue-500', label: 'Edit' },
  complete: { icon: CheckCircle, color: 'bg-green-500', label: 'Complete' },
  upvote: { icon: ArrowUpCircle, color: 'bg-primary', label: 'Upvote' }
};

export default SwipeableItem;
