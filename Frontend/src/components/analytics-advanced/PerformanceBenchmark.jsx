import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts";
import { Award, TrendingUp, TrendingDown } from "lucide-react";

/**
 * Performance Benchmark Component
 * NEW component for ward performance comparison
 * Zero-Regression Strategy: Extension-only
 */

const PerformanceBenchmark = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch("http://localhost:3000/api/analytics-advanced/performance", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const result = await response.json();
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Performance data error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, []);

  if (loading) {
    return (
      <Card className="border-2 border-slate-200">
        <CardContent className="p-6">
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return null; // Fail silently
  }

  const chartData = data.wards.map(ward => ({
    ward: ward.ward,
    score: ward.performanceScore,
    resolutionRate: ward.resolutionRate
  }));

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Performance Scores Chart */}
      <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Award className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Ward Performance Benchmarking</CardTitle>
              <p className="text-sm text-slate-500 mt-0.5">Comprehensive performance scores (0-100 scale)</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="ward" 
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#cbd5e1' }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="score" name="Performance Score" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Ward Rankings */}
      <Card className="border-2 border-slate-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
          <CardTitle className="text-lg font-bold text-slate-900">Detailed Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {data.wards.map((ward, index) => {
              const isAboveAverage = ward.resolutionRate > data.cityAverages.resolutionRate;
              const isFasterThanAverage = ward.avgResolutionTimeHours < data.cityAverages.avgResolutionTimeHours;
              
              return (
                <div 
                  key={ward.ward}
                  className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-600' :
                      'bg-slate-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{ward.ward}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                        <span>Score: <strong className="text-slate-900">{ward.performanceScore}</strong></span>
                        <span>Resolution: <strong className="text-slate-900">{ward.resolutionRate}%</strong></span>
                        <span>Avg Time: <strong className="text-slate-900">{ward.avgResolutionTimeHours.toFixed(1)}h</strong></span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                      isAboveAverage ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {isAboveAverage ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(ward.benchmark.resolutionRateDiff).toFixed(1)}% vs avg
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                      isFasterThanAverage ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {isFasterThanAverage ? 'Faster' : 'Slower'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* City Averages */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
            <h5 className="font-bold text-blue-900 mb-2">City-Wide Benchmarks</h5>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-600">Avg Resolution Rate:</span>
                <strong className="ml-2 text-blue-900">{data.cityAverages.resolutionRate}%</strong>
              </div>
              <div>
                <span className="text-blue-600">Avg Resolution Time:</span>
                <strong className="ml-2 text-blue-900">{data.cityAverages.avgResolutionTimeHours.toFixed(1)}h</strong>
              </div>
              <div>
                <span className="text-blue-600">Total Complaints:</span>
                <strong className="ml-2 text-blue-900">{data.cityAverages.totalComplaints}</strong>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceBenchmark;
