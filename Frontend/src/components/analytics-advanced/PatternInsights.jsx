import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Brain, TrendingUp } from "lucide-react";

/**
 * Pattern Insights Component
 * NEW component for pattern and trend identification
 * Zero-Regression Strategy: Extension-only
 */

const PatternInsights = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch("http://localhost:3000/api/analytics-advanced/patterns", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const result = await response.json();
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Pattern analysis error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPatterns();
  }, []);

  if (loading) {
    return (
      <Card className="border-2 border-slate-200">
        <CardContent className="p-6">
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return null; // Fail silently
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Peak Days Analysis */}
      <Card className="border-2 border-slate-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Brain className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Peak Complaint Days</CardTitle>
              <p className="text-sm text-slate-500 mt-0.5">Day-of-week patterns</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {data.peakDays.slice(0, 5).map((dayData, index) => (
              <div 
                key={dayData.day}
                className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-white ${
                    index === 0 ? 'bg-red-500' :
                    index === 1 ? 'bg-orange-500' :
                    'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-semibold text-slate-900">{dayData.day}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">{dayData.count} complaints</span>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resolution Time Patterns */}
      <Card className="border-2 border-slate-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Resolution Time by Category</CardTitle>
              <p className="text-sm text-slate-500 mt-0.5">Average hours to resolve</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {data.resolutionPatterns.slice(0, 5).map((pattern) => (
              <div 
                key={pattern.category}
                className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100"
              >
                <div>
                  <div className="font-semibold text-slate-900">{pattern.category}</div>
                  <div className="text-xs text-slate-500 mt-1">{pattern.count} resolved complaints</div>
                </div>
                <div className={`px-4 py-2 rounded-full font-bold ${
                  pattern.avgHours < 24 ? 'bg-green-100 text-green-700' :
                  pattern.avgHours < 72 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {pattern.avgHours.toFixed(1)}h
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ward Category Patterns */}
      <Card className="border-2 border-slate-200 shadow-lg lg:col-span-2">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Brain className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Top Complaint Categories by Ward</CardTitle>
              <p className="text-sm text-slate-500 mt-0.5">Ward-specific issue patterns</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(data.wardCategoryPatterns).map(([ward, categories]) => (
              <div 
                key={ward}
                className="p-4 rounded-xl border-2 border-slate-200 bg-white"
              >
                <h4 className="font-bold text-slate-900 mb-3">{ward}</h4>
                <div className="space-y-2">
                  {categories.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{cat.category}</span>
                      <span className="font-bold text-slate-900">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatternInsights;
