import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, AlertTriangle, CheckCircle } from "lucide-react";

const COLORS = {
  critical: "#ef4444",
  warning: "#f59e0b",
  normal: "#10b981"
};

const GeographicHeatmap = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeatmapData();
  }, []);

  const fetchHeatmapData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:3000/api/heatmap/heatmap", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) setData(result.data);
    } catch (err) {
      console.error("Heatmap Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        <p className="mt-2 text-muted-foreground">Loading heatmap...</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Geographic Heatmap - Complaint Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((ward) => (
            <div
              key={ward.ward}
              className="p-4 rounded-lg border-2"
              style={{ 
                borderColor: COLORS[ward.status],
                backgroundColor: `${COLORS[ward.status]}15`
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold">{ward.ward}</h4>
                <Badge 
                  variant={ward.status === 'critical' ? 'destructive' : ward.status === 'warning' ? 'secondary' : 'default'}
                >
                  {ward.status}
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-medium">{ward.totalComplaints}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pending:</span>
                  <span className="font-medium">{ward.pending}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Density:</span>
                  <div className="w-20 h-2 bg-gray-200 rounded overflow-hidden">
                    <div 
                      className="h-full rounded"
                      style={{ 
                        width: `${ward.densityScore}%`,
                        backgroundColor: COLORS[ward.status]
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default GeographicHeatmap;