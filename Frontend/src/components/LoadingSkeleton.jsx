import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Shimmer animation overlay
const ShimmerOverlay = () => (
  <motion.div
    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
    animate={{ x: ["0%", "200%"] }}
    transition={{
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
      repeatDelay: 0.5,
    }}
  />
);

// Stats Card Skeleton
export const StatCardSkeleton = ({ index = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50">
      <ShimmerOverlay />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  </motion.div>
);

// Table Row Skeleton
export const TableRowSkeleton = ({ index = 0, columns = 6 }) => (
  <motion.tr
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    className="border-b border-border/50"
  >
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="py-4 px-4">
        <Skeleton className={`h-4 ${i === 2 ? "w-32" : "w-16"}`} />
      </td>
    ))}
  </motion.tr>
);

// Complaint Card Skeleton
export const ComplaintCardSkeleton = ({ index = 0, variant = "grid" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    <Card className={`relative overflow-hidden border-border/50 ${variant === "list" ? "flex items-center" : ""}`}>
      <ShimmerOverlay />
      <div className={`p-5 flex-1 ${variant === "list" ? "flex items-center gap-4" : ""}`}>
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className={`h-6 ${variant === "grid" ? "w-3/4" : "w-48"} mb-2`} />
        {variant === "grid" && (
          <>
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-2/3 mb-3" />
          </>
        )}
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        {variant === "grid" && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <Skeleton className="h-9 w-full" />
          </div>
        )}
      </div>
    </Card>
  </motion.div>
);

// Chart Skeleton
export const ChartSkeleton = ({ height = 300 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="relative overflow-hidden"
  >
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
      <ShimmerOverlay />
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2" style={{ height }}>
          {[...Array(7)].map((_, i) => (
            <motion.div
              key={i}
              className="flex-1"
              initial={{ height: 0 }}
              animate={{ height: `${30 + Math.random() * 60}%` }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Skeleton className="w-full h-full rounded-t-md" />
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

// Dashboard Skeleton
export const DashboardSkeleton = () => (
  <div className="space-y-8">
    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <StatCardSkeleton key={i} index={i} />
      ))}
    </div>

    {/* Charts Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>

    {/* Table */}
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-64" />
        </div>
      </CardHeader>
      <CardContent>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {[...Array(6)].map((_, i) => (
                <th key={i} className="py-3 px-4 text-left">
                  <Skeleton className="h-4 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <TableRowSkeleton key={i} index={i} />
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  </div>
);

// Track Complaint Skeleton
export const TrackComplaintSkeleton = () => (
  <motion.section
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <Card className="relative overflow-hidden rounded-3xl border border-border p-8">
      <ShimmerOverlay />
      <div className="flex items-start justify-between gap-6 mb-6 flex-wrap">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-20 rounded-full" />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>

      <div className="space-y-2 mb-8">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>

      {/* Timeline */}
      <Skeleton className="h-6 w-40 mb-6" />
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start gap-4">
            <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
            <div className="flex-1 pt-2 space-y-1">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  </motion.section>
);

// Public Issues Skeleton
export const PublicIssuesSkeleton = ({ viewMode = "grid" }) => (
  <div className={`gap-4 ${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col"}`}>
    {[...Array(9)].map((_, i) => (
      <ComplaintCardSkeleton key={i} index={i} variant={viewMode} />
    ))}
  </div>
);

export default {
  StatCardSkeleton,
  TableRowSkeleton,
  ComplaintCardSkeleton,
  ChartSkeleton,
  DashboardSkeleton,
  TrackComplaintSkeleton,
  PublicIssuesSkeleton,
};
