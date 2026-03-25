import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Building2, Users, Clock, TrendingUp, Globe } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const PublicTransparencyPanel = () => {
  const [publicData, setPublicData] = useState(null);
  const [wardData, setWardData] = useState([]);
  const [officerData, setOfficerData] = useState([]);
  const [resolutionData, setResolutionData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [publicRes, wardRes, officerRes, resolutionRes] = await Promise.all([
        fetch("http://localhost:3000/api/transparency/public", { headers }),
        fetch("http://localhost:3000/api/transparency/ward-performance", { headers }),
        fetch("http://localhost:3000/api/transparency/officer-performance", { headers }),
        fetch("http://localhost:3000/api/transparency/resolution-time", { headers })
      ]);

      const [publicJson, wardJson, officerJson, resolutionJson] = await Promise.all([
        publicRes.json(),
        wardRes.json(),
        officerRes.json(),
        resolutionRes.json()
      ]);

      if (publicJson.success) setPublicData(publicJson);
      if (wardJson.success) setWardData(wardJson.data);
      if (officerJson.success) setOfficerData(officerJson.data);
      if (resolutionJson.success) setResolutionData(resolutionJson.byCategory || []);
    } catch (err) {
      console.error("Transparency Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        <p className="mt-2 text-muted-foreground">Loading transparency data...</p>
      </Card>
    );
  }

  const wardChartData = wardData.map((w, i) => ({
    name: w.ward,
    resolution: w.resolutionRate,
    complaints: w.totalComplaints,
    fill: COLORS[i % COLORS.length]
  }));

  return (
    <div className="space-y-6">
      {/* Public Overview */}
      {publicData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Public Dashboard Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold">{publicData.overview?.totalComplaints || 0}</p>
                <p className="text-sm text-muted-foreground">Total Complaints</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold">{publicData.overview?.resolvedComplaints || 0}</p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg text-center">
                <p className="text-2xl font-bold">{publicData.overview?.pendingComplaints || 0}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <p className="text-2xl font-bold">{publicData.overview?.resolutionRate || 0}%</p>
                <p className="text-sm text-muted-foreground">Resolution Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="wards" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wards">Ward Performance</TabsTrigger>
          <TabsTrigger value="officers">Officer Scores</TabsTrigger>
          <TabsTrigger value="resolution">Resolution Time</TabsTrigger>
        </TabsList>

        {/* Ward Performance */}
        <TabsContent value="wards">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Ward Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={wardChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="resolution" name="Resolution %" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wardData.map((ward) => (
                  <div key={ward.ward} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{ward.ward}</h4>
                      <Badge variant={ward.resolutionRate >= 70 ? 'default' : 'secondary'}>
                        {ward.performanceScore} pts
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total:</span>
                        <span>{ward.totalComplaints}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Resolved:</span>
                        <span>{ward.resolved}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rate:</span>
                        <span>{ward.resolutionRate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Officer Performance */}
        <TabsContent value="officers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Officer Performance Scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {officerData.map((officer, index) => (
                  <div key={officer.officerId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{officer.name}</p>
                        <p className="text-sm text-muted-foreground">{officer.ward} - {officer.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={officer.performanceScore >= 80 ? 'default' : officer.performanceScore >= 50 ? 'secondary' : 'destructive'}>
                        {officer.performanceScore} pts
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {officer.resolved}/{officer.totalAssigned} resolved
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resolution Time */}
        <TabsContent value="resolution">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Resolution Time Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resolutionData.map((item) => (
                  <div key={item.category} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.category}</p>
                      <p className="text-sm text-muted-foreground">{item.count} resolved</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{item.avgHours}h</p>
                      <p className="text-xs text-muted-foreground">average</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PublicTransparencyPanel;