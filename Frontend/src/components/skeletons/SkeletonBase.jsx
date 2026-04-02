import { motion } from 'framer-motion';

/**
 * SkeletonBase Component - Mobile Experience Enhancement
 * Base skeleton component with shimmer animation
 * 
 * Features:
 * - Shimmer animation effect
 * - Configurable shape (rectangle, circle, text)
 * - Responsive sizing
 * - Accessible (aria-hidden)
 */

const SkeletonBase = ({
  variant = 'rectangle',
  width = '100%',
  height = '16px',
  className = '',
  animate = true
}) => {
  const getShapeClass = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full';
      case 'text':
        return 'rounded';
      case 'rounded':
        return 'rounded-lg';
      default:
        return 'rounded-md';
    }
  };

  return (
    <div
      className={`relative overflow-hidden bg-muted ${getShapeClass()} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    >
      {animate && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
          }}
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
    </div>
  );
};

// Preset skeleton shapes
export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBase
        key={i}
        variant="text"
        height="16px"
        width={i === lines - 1 ? '60%' : '100%'}
      />
    ))}
  </div>
);

export const SkeletonAvatar = ({ size = '48px', className = '' }) => (
  <SkeletonBase variant="circle" width={size} height={size} className={className} />
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`p-4 border border-border rounded-lg space-y-4 ${className}`}>
    <div className="flex items-center gap-3">
      <SkeletonAvatar size="40px" />
      <div className="flex-1 space-y-2">
        <SkeletonBase height="16px" width="60%" />
        <SkeletonBase height="12px" width="40%" />
      </div>
    </div>
    <SkeletonText lines={2} />
    <SkeletonBase height="120px" />
  </div>
);

export const SkeletonList = ({ count = 5, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-lg">
        <SkeletonAvatar size="40px" />
        <div className="flex-1 space-y-2">
          <SkeletonBase height="16px" width="70%" />
          <SkeletonBase height="12px" width="50%" />
        </div>
      </div>
    ))}
  </div>
);

export default SkeletonBase;
