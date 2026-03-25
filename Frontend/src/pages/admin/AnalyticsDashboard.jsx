import { useEffect } from "react";
import { motion } from "framer-motion";
import EnhancedAnalyticsDashboard from "@/components/analytics/EnhancedAnalyticsDashboard";

const AnalyticsDashboard = () => {
  useEffect(() => {
    document.title = "Analytics Dashboard | SmartCity Admin";
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 py-8"
    >
      <div className="container mx-auto px-4 max-w-7xl">
        <EnhancedAnalyticsDashboard />
      </div>
    </motion.div>
  );
};

export default AnalyticsDashboard;