import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { apiService } from "@/services/apiService";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";

const ResolutionTime = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const response = await apiService.getResolutionTimeAnalytics();
      if (response.success) {
        setData(response.data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200 py-4">
        <CardTitle className="text-lg font-bold text-slate-900">Resolution Time by Category</CardTitle>
        <p className="text-sm text-slate-500 mt-0.5">Average hours taken to resolve</p>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} unit="h" />
              <YAxis dataKey="category" type="category" tick={{ fill: '#64748b', fontSize: 12 }} width={80} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px'
                }}
                formatter={(value) => [`${value.toFixed(1)} hours`, 'Avg. Time']}
              />
              <Bar dataKey="avgHours" radius={[0, 4, 4, 0]} barSize={20}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ResolutionTime;
