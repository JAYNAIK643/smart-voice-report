/**
 * Haptics Utility - Mobile Experience Enhancement
 * Haptic feedback system for mobile interactions
 * 
 * Features:
 * - Pattern-based haptic feedback
 * - Device capability detection
 * - Graceful fallback for unsupported devices
 * - Predefined patterns for common actions
 */

// Check if haptics are supported
export const isHapticsSupported = () => {
  return typeof navigator !== 'undefined' && 
         'vibrate' in navigator && 
         typeof navigator.vibrate === 'function';
};

// Check if device is mobile
export const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Haptic patterns (in milliseconds)
const HAPTIC_PATTERNS = {
  // Subtle feedback
  light: 10,
  medium: 20,
  heavy: 30,
  
  // Action feedback
  success: [50],
  error: [100, 50, 100],
  warning: [200],
  
  // Interaction feedback
  buttonPress: 10,
  longPress: 200,
  swipe: 15,
  
  // Notification feedback
  notification: [100, 50, 100],
  message: [50, 100, 50],
  
  // Special patterns
  heartbeat: [100, 100, 100, 100, 300],
  tick: [10, 50, 10],
  doubleTick: [10, 50, 10, 50, 10]
};

/**
 * Trigger haptic feedback
 * @param {string|number|number[]} pattern - Pattern name, duration, or custom pattern
 * @returns {boolean} Whether haptics were triggered
 */
export const vibrate = (pattern = 'light') => {
  if (!isHapticsSupported() || !isMobileDevice()) {
    return false;
  }

  try {
    let vibrationPattern;
    
    if (typeof pattern === 'string') {
      vibrationPattern = HAPTIC_PATTERNS[pattern] || HAPTIC_PATTERNS.light;
    } else if (typeof pattern === 'number') {
      vibrationPattern = pattern;
    } else if (Array.isArray(pattern)) {
      vibrationPattern = pattern;
    } else {
      vibrationPattern = HAPTIC_PATTERNS.light;
    }

    return navigator.vibrate(vibrationPattern);
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
    return false;
  }
};

/**
 * Stop ongoing haptic feedback
 */
export const stopVibration = () => {
  if (isHapticsSupported()) {
    navigator.vibrate(0);
  }
};

/**
 * Create a custom haptic pattern
 * @param {number[]} durations - Array of vibration durations in ms
 * @returns {number[]} The pattern
 */
export const createPattern = (...durations) => durations;

/**
 * Predefined haptic feedback functions
 */
export const haptics = {
  // Basic feedback
  light: () => vibrate('light'),
  medium: () => vibrate('medium'),
  heavy: () => vibrate('heavy'),
  
  // Action feedback
  success: () => vibrate('success'),
  error: () => vibrate('error'),
  warning: () => vibrate('warning'),
  
  // Interaction feedback
  buttonPress: () => vibrate('buttonPress'),
  longPress: () => vibrate('longPress'),
  swipe: () => vibrate('swipe'),
  
  // Notification feedback
  notification: () => vibrate('notification'),
  message: () => vibrate('message'),
  
  // Special patterns
  heartbeat: () => vibrate('heartbeat'),
  tick: () => vibrate('tick'),
  doubleTick: () => vibrate('doubleTick')
};

/**
 * Hook-compatible haptic feedback with state
 * @returns {Object} Haptic utilities
 */
export const useHaptics = () => {
  return {
    isSupported: isHapticsSupported(),
    isMobile: isMobileDevice(),
    vibrate,
    stop: stopVibration,
    patterns: HAPTIC_PATTERNS,
    ...haptics
  };
};

export default {
  isHapticsSupported,
  isMobileDevice,
  vibrate,
  stopVibration,
  createPattern,
  haptics,
  useHaptics,
  HAPTIC_PATTERNS
};
