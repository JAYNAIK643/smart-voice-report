import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Users, Clock, CheckCircle, Zap } from "lucide-react";

const SmartRoutingPanel = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Other",
    ward: "Ward 1",
    priority: "medium"
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeRouting = async () => {
    if (!formData.title) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:3000/api/routing/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Routing error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Smart Routing Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Complaint Title</label>
            <Input
              placeholder="Enter complaint title..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Describe the issue..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                className="w-full mt-1 p-2 border rounded-md"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Water Supply">Water Supply</option>
                <option value="Road Maintenance">Road Maintenance</option>
                <option value="Garbage Collection">Garbage Collection</option>
                <option value="Street Lighting">Street Lighting</option>
                <option value="Electricity">Electricity</option>
                <option value="Sewage">Sewage</option>
                <option value="Public Safety">Public Safety</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Ward</label>
              <select
                className="w-full mt-1 p-2 border rounded-md"
                value={formData.ward}
                onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
              >
                <option value="Ward 1">Ward 1</option>
                <option value="Ward 2">Ward 2</option>
                <option value="Ward 3">Ward 3</option>
                <option value="Ward 4">Ward 4</option>
                <option value="Ward 5">Ward 5</option>
              </select>
            </div>
          </div>

          <Button onClick={analyzeRouting} disabled={loading || !formData.title} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
            Analyze Routing
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          {result.emergency?.isEmergency && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Emergency Detected!</AlertTitle>
              <AlertDescription>
                Keywords: {result.emergency.detectedKeywords.join(", ")}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Routing Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Priority</span>
                  </div>
                  <Badge variant={result.finalPriority === 'high' ? 'destructive' : 'default'}>
                    {result.finalPriority?.toUpperCase()}
                  </Badge>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Response Time</span>
                  </div>
                  <p>{result.routing?.targetResponseTime}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">Department</span>
                </div>
                <p>{result.routing?.department}</p>
              </div>

              {result.routing?.autoAssigned?.assigned && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Officer Assigned</AlertTitle>
                  <AlertDescription>
                    {result.routing.autoAssigned.officer.name} ({result.routing.autoAssigned.method})
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SmartRoutingPanel;