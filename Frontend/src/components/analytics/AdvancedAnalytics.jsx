import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ShieldCheck } from "lucide-react";
import TrendChart from "./TrendChart";
import WardRanking from "./WardRanking";
import ResolutionTime from "./ResolutionTime";
import CategoryCorrelation from "./CategoryCorrelation";
import ExportAnalytics from "./ExportAnalytics";
import ErrorBoundary from "./ErrorBoundary";
import AdvancedKPICards from "../analytics-advanced/AdvancedKPICards";
import PerformanceBenchmark from "../analytics-advanced/PerformanceBenchmark";
import HistoricalComparison from "../analytics-advanced/HistoricalComparison";
import PatternInsights from "../analytics-advanced/PatternInsights";

const AdvancedAnalytics = () => {
  const [isEnabled, setIsEnabled] = useState(false);

  return (
    <div className="space-y-8 mt-12 pt-8 border-t-2 border-slate-200">
      {/* Feature Flag Toggle */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-none shadow-xl">
        <CardContent className="flex items-center justify-between py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Sparkles className="h-6 w-6 text-yellow-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Advanced Analytics Module</h3>
              <p className="text-blue-100 text-sm">Enhanced insights with historical trends and performance metrics</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-full backdrop-blur-sm border border-white/20">
            <Label htmlFor="advanced-analytics" className="font-bold cursor-pointer">
              {isEnabled ? "ENABLED" : "DISABLED"}
            </Label>
            <Switch 
              id="advanced-analytics" 
              checked={isEnabled} 
              onCheckedChange={setIsEnabled}
              className="data-[state=checked]:bg-green-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Conditional Rendering */}
      {isEnabled ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Advanced KPI Cards - NEW */}
          <ErrorBoundary>
            <AdvancedKPICards />
          </ErrorBoundary>

          {/* Performance Benchmarking - NEW */}
          <ErrorBoundary>
            <PerformanceBenchmark />
          </ErrorBoundary>

          {/* Historical Comparison - NEW */}
          <ErrorBoundary>
            <HistoricalComparison />
          </ErrorBoundary>

          {/* Pattern Insights - NEW */}
          <ErrorBoundary>
            <PatternInsights />
          </ErrorBoundary>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ErrorBoundary>
              <TrendChart />
            </ErrorBoundary>
            
            <ErrorBoundary>
              <WardPerformanceSection />
            </ErrorBoundary>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ErrorBoundary>
              <ResolutionTime />
            </ErrorBoundary>
            
            <ErrorBoundary>
              <CategoryCorrelation />
            </ErrorBoundary>
          </div>

          <ErrorBoundary>
            <ExportAnalytics />
          </ErrorBoundary>

          <div className="flex items-center justify-center gap-2 py-4 text-slate-400 text-sm">
            <ShieldCheck className="h-4 w-4" />
            <span>Advanced Analytics Sandbox | Zero-Regression Guaranteed</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <p className="text-slate-500 font-medium italic">Enable the Advanced Analytics module to view additional insights</p>
        </div>
      )}
    </div>
  );
};

// Helper sub-component for Ward Ranking to keep clean
const WardPerformanceSection = () => {
  return (
    <div className="space-y-8">
      <WardRanking />
    </div>
  );
};

export default AdvancedAnalytics;
