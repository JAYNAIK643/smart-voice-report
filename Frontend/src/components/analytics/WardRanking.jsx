import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { apiService } from "@/services/apiService";
import { Badge } from "@/components/ui/badge";
import { MapPin, CheckCircle2, Clock } from "lucide-react";

const WardRanking = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const response = await apiService.getWardPerformance();
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
        <CardTitle className="text-lg font-bold text-slate-900">Ward Performance Ranking</CardTitle>
        <p className="text-sm text-slate-500 mt-0.5">Ranked by resolution rate</p>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((ward, index) => (
              <div key={ward.ward} className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 bg-white hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200 group">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900">{ward.ward}</h4>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                        {ward.resolutionRate?.toFixed(1)}% Resolved
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        {ward.resolvedComplaints} Resolved
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-amber-500" />
                        {ward.pendingComplaints} Pending
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Avg. Time</p>
                  <p className="text-sm font-bold text-slate-700">{ward.avgResolutionTime?.toFixed(1)}h</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WardRanking;
