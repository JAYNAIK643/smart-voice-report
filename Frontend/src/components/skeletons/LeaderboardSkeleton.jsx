import { SkeletonBase, SkeletonText, SkeletonAvatar } from './SkeletonBase';

/**
 * LeaderboardSkeleton Component - Mobile Experience Enhancement
 * Loading skeleton for leaderboard page
 * 
 * Matches the layout of Leaderboard page components
 */

export const LeaderboardItemSkeleton = ({ rank = 1, className = '' }) => (
  <div className={`flex items-center gap-3 p-3 border border-border rounded-lg ${className}`}>
    {/* Rank */}
    <div className="w-8 flex justify-center">
      {rank <= 3 ? (
        <SkeletonBase width="24px" height="24px" variant="circle" />
      ) : (
        <SkeletonBase width="20px" height="16px" />
      )}
    </div>
    
    {/* Avatar */}
    <SkeletonAvatar size="40px" />
    
    {/* User info */}
    <div className="flex-1 min-w-0 space-y-1">
      <SkeletonBase height="16px" width="60%" />
      <SkeletonBase height="12px" width="40%" />
    </div>
    
    {/* Points */}
    <SkeletonBase height="20px" width="80px" />
  </div>
);

export const LeaderboardListSkeleton = ({ count = 10, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <LeaderboardItemSkeleton key={i} rank={i + 1} />
    ))}
  </div>
);

export const LeaderboardStatsSkeleton = ({ className = '' }) => (
  <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="p-4 border border-border rounded-lg text-center space-y-2">
        <SkeletonBase height="32px" width="60%" className="mx-auto" />
        <SkeletonBase height="14px" width="80%" className="mx-auto" />
      </div>
    ))}
  </div>
);

export const TopThreeSkeleton = ({ className = '' }) => (
  <div className={`flex items-end justify-center gap-4 py-8 ${className}`}>
    {/* 2nd place */}
    <div className="flex flex-col items-center gap-2">
      <SkeletonAvatar size="56px" />
      <SkeletonBase height="16px" width="80px" />
      <SkeletonBase height="14px" width="60px" />
    </div>
    
    {/* 1st place */}
    <div className="flex flex-col items-center gap-2 -mt-4">
      <SkeletonBase width="32px" height="32px" variant="circle" />
      <SkeletonAvatar size="72px" />
      <SkeletonBase height="18px" width="100px" />
      <SkeletonBase height="14px" width="70px" />
    </div>
    
    {/* 3rd place */}
    <div className="flex flex-col items-center gap-2">
      <SkeletonAvatar size="56px" />
      <SkeletonBase height="16px" width="80px" />
      <SkeletonBase height="14px" width="60px" />
    </div>
  </div>
);

export default LeaderboardListSkeleton;
