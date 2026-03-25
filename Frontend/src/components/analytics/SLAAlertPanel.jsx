import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Clock, CheckCircle } from "lucide-react";

const SLAAlertPanel = () => {
  const [alerts, setAlerts] = useState([]);
  const [compliance, setCompliance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSLAData();
    const interval = setInterval(fetchSLAData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSLAData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const [alertsRes, compRes] = await Promise.all([
        fetch("http://localhost:3000/api/heatmap/sla-alerts", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("http://localhost:3000/api/heatmap/sla-compliance", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      const alertsData = await alertsRes.json();
      const compData = await compRes.json();
      if (alertsData.success) setAlerts(alertsData.alerts);
      if (compData.success) setCompliance(compData.data);
    } catch (err) {
      console.error("SLA Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        <p className="mt-2 text-muted-foreground">Loading SLA data...</p>
      </Card>
    );
  }

  const totalBreaches = alerts.reduce((s, a) => s + a.breachedCount, 0);

  return (
    <div className="space-y-6">
      {totalBreaches > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>SLA Breach Alert</AlertTitle>
          <AlertDescription>
            {totalBreaches} complaint(s) have exceeded their SLA target time!
          </AlertDescription>
        </Alert>
      )}

      {totalBreaches === 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>All SLA Compliant</AlertTitle>
          <AlertDescription>No SLA breaches at this time.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            SLA Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {compliance.map((item) => (
              <div key={item.priority} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{item.priority}</p>
                  <p className="text-sm text-muted-foreground">
                    Target: {item.targetHours}h | Avg: {item.avgResolutionHours}h
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={item.complianceRate >= 80 ? 'default' : item.complianceRate >= 50 ? 'secondary' : 'destructive'}>
                    {item.complianceRate}% Compliant
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{item.resolved} resolved</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SLAAlertPanel;