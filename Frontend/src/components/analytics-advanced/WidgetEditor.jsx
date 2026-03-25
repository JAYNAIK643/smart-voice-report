import { useState } from "react";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DATA_SOURCES = [
  { id: "complaints", name: "Complaints", fields: ["status", "category", "priority", "ward", "createdAt", "resolvedAt"] },
  { id: "users", name: "Users", fields: ["role", "ward", "createdAt", "activeStatus"] },
  { id: "feedback", name: "Feedback", fields: ["rating", "category", "sentiment", "createdAt"] },
  { id: "sentiment", name: "Sentiment Analysis", fields: ["score", "category", "magnitude", "createdAt"] },
  { id: "sla", name: "SLA Metrics", fields: ["compliance", "responseTime", "resolutionTime", "breached"] },
  { id: "predictive", name: "Predictive Analytics", fields: ["forecastedVolume", "trendDirection", "confidence"] },
];

const AGGREGATION_TYPES = [
  { id: "count", name: "Count" },
  { id: "sum", name: "Sum" },
  { id: "avg", name: "Average" },
  { id: "min", name: "Minimum" },
  { id: "max", name: "Maximum" },
  { id: "distinct", name: "Distinct Count" },
];

const WidgetEditor = ({ widget, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    ...widget,
    title: widget.title || "",
    dataSource: widget.dataSource || "complaints",
    metrics: widget.metrics || [{ field: "", aggregation: "count", label: "" }],
    filters: widget.filters || {},
    refreshInterval: widget.refreshInterval || 300,
    layout: widget.layout || { x: 0, y: 0, w: 4, h: 3 },
  });

  const selectedDataSource = DATA_SOURCES.find((ds) => ds.id === formData.dataSource);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMetricChange = (index, field, value) => {
    const updatedMetrics = [...formData.metrics];
    updatedMetrics[index] = { ...updatedMetrics[index], [field]: value };
    setFormData((prev) => ({
      ...prev,
      metrics: updatedMetrics,
    }));
  };

  const handleAddMetric = () => {
    setFormData((prev) => ({
      ...prev,
      metrics: [...prev.metrics, { field: "", aggregation: "count", label: "" }],
    }));
  };

  const handleRemoveMetric = (index) => {
    setFormData((prev) => ({
      ...prev,
      metrics: prev.metrics.filter((_, i) => i !== index),
    }));
  };

  const handleLayoutChange = (dimension, value) => {
    setFormData((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        [dimension]: parseInt(value) || 0,
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Widget title is required");
      return;
    }
    if (formData.metrics.length === 0 || !formData.metrics[0].field) {
      alert("Add at least one metric");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Configure Widget
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Set up data sources and visualization options
            </p>
          </div>
        </div>
        <Button onClick={handleSubmit} className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Save className="mr-2 h-4 w-4" />
          Save Widget
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Widget Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Complaint Volume"
                required
              />
            </div>

            <div>
              <Label htmlFor="dataSource">Data Source *</Label>
              <Select
                value={formData.dataSource}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, dataSource: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATA_SOURCES.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="refreshInterval">Refresh Interval (seconds)</Label>
              <Input
                id="refreshInterval"
                name="refreshInterval"
                type="number"
                value={formData.refreshInterval}
                onChange={handleInputChange}
                min="30"
                step="30"
              />
            </div>
          </CardContent>
        </Card>

        {/* Layout Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Layout & Size</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="layoutX">X Position</Label>
                <Input
                  id="layoutX"
                  type="number"
                  value={formData.layout.x}
                  onChange={(e) => handleLayoutChange("x", e.target.value)}
                  min="0"
                  max="12"
                />
              </div>
              <div>
                <Label htmlFor="layoutY">Y Position</Label>
                <Input
                  id="layoutY"
                  type="number"
                  value={formData.layout.y}
                  onChange={(e) => handleLayoutChange("y", e.target.value)}
                  min="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="layoutW">Width (1-12)</Label>
                <Input
                  id="layoutW"
                  type="number"
                  value={formData.layout.w}
                  onChange={(e) => handleLayoutChange("w", e.target.value)}
                  min="1"
                  max="12"
                />
              </div>
              <div>
                <Label htmlFor="layoutH">Height</Label>
                <Input
                  id="layoutH"
                  type="number"
                  value={formData.layout.h}
                  onChange={(e) => handleLayoutChange("h", e.target.value)}
                  min="1"
                  max="20"
                />
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded">
              <strong>Grid System:</strong> Widgets are placed on a 12-column grid. Width determines how many columns
              the widget spans, height is in grid units.
            </div>
          </CardContent>
        </Card>

        {/* Metrics Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Metrics *</CardTitle>
              <Button type="button" onClick={handleAddMetric} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Metric
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {formData.metrics.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No metrics configured</p>
                <p className="text-sm">Click "Add Metric" to add data to this widget</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.metrics.map((metric, index) => (
                  <div key={index} className="flex gap-4 items-end p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <Label>Field</Label>
                      <Select
                        value={metric.field}
                        onValueChange={(value) => handleMetricChange(index, "field", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedDataSource?.fields.map((field) => (
                            <SelectItem key={field} value={field}>
                              {field}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label>Aggregation</Label>
                      <Select
                        value={metric.aggregation}
                        onValueChange={(value) => handleMetricChange(index, "aggregation", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AGGREGATION_TYPES.map((agg) => (
                            <SelectItem key={agg.id} value={agg.id}>
                              {agg.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label>Label</Label>
                      <Input
                        value={metric.label}
                        onChange={(e) => handleMetricChange(index, "label", e.target.value)}
                        placeholder="e.g., Total Complaints"
                      />
                    </div>
                    {formData.metrics.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMetric(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Filters (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Advanced filtering options will be available in future updates. For now, widgets will display all data
              from the selected data source.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WidgetEditor;
