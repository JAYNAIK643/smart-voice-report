import { SkeletonBase, SkeletonText, SkeletonAvatar } from './SkeletonBase';

/**
 * ComplaintSkeleton Component - Mobile Experience Enhancement
 * Loading skeleton for complaint cards
 * 
 * Matches the layout of ComplaintCard component
 */

export const ComplaintCardSkeleton = ({ className = '' }) => (
  <div className={`bg-card border border-border rounded-lg overflow-hidden ${className}`}>
    {/* Image placeholder */}
    <SkeletonBase height="200px" className="rounded-none" />
    
    {/* Content */}
    <div className="p-4 space-y-3">
      {/* Title and status */}
      <div className="flex items-start justify-between gap-2">
        <SkeletonBase height="20px" width="70%" />
        <SkeletonBase height="24px" width="80px" variant="rounded" />
      </div>
      
      {/* Description */}
      <SkeletonText lines={2} />
      
      {/* Meta info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <SkeletonAvatar size="24px" />
          <SkeletonBase height="14px" width="100px" />
        </div>
        <SkeletonBase height="14px" width="80px" />
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-4">
          <SkeletonBase height="32px" width="80px" variant="rounded" />
          <SkeletonBase height="32px" width="60px" variant="rounded" />
        </div>
        <SkeletonBase height="32px" width="100px" variant="rounded" />
      </div>
    </div>
  </div>
);

export const ComplaintListSkeleton = ({ count = 3, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <ComplaintCardSkeleton key={i} />
    ))}
  </div>
);

export const ComplaintGridSkeleton = ({ count = 6, className = '' }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <ComplaintCardSkeleton key={i} />
    ))}
  </div>
);

export default ComplaintCardSkeleton;
