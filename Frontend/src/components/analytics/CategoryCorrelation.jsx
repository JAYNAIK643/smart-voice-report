import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { apiService } from "@/services/apiService";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const CategoryCorrelation = () => {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const response = await apiService.getCategoryCorrelation();
      if (response.success) {
        // Transform data for stacked bar chart
        const formattedData = response.data.map(ward => {
          const entry = { ward: ward.ward };
          ward.categories.forEach(cat => {
            entry[cat.category] = cat.count;
          });
          return entry;
        });

        // Extract all unique categories
        const allCats = new Set();
        response.data.forEach(ward => {
          ward.categories.forEach(cat => allCats.add(cat.category));
        });

        setData(formattedData);
        setCategories(Array.from(allCats));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200 py-4">
        <CardTitle className="text-lg font-bold text-slate-900">Category vs Ward Correlation</CardTitle>
        <p className="text-sm text-slate-500 mt-0.5">Issue distribution by ward</p>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="h-[350px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="ward" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              {categories.map((cat, index) => (
                <Bar 
                  key={cat} 
                  dataKey={cat} 
                  stackId="a" 
                  fill={COLORS[index % COLORS.length]} 
                  radius={index === categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryCorrelation;
