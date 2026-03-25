import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  Activity,
  Target,
  Users,
  MessageSquare,
  MapPin,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import WidgetEditor from "./WidgetEditor";

const WIDGET_TYPES = [
  { id: "kpi-card", name: "KPI Card", icon: Target, description: "Single metric card" },
  { id: "line-chart", name: "Line Chart", icon: LineChart, description: "Trend over time" },
  { id: "bar-chart", name: "Bar Chart", icon: BarChart3, description: "Compare categories" },
  { id: "pie-chart", name: "Pie Chart", icon: PieChart, description: "Distribution" },
  { id: "area-chart", name: "Area Chart", icon: Activity, description: "Cumulative trends" },
  { id: "gauge", name: "Gauge", icon: Gauge, description: "Progress meter" },
  { id: "heatmap", name: "Heat Map", icon: MapPin, description: "Geographic data" },
  { id: "table", name: "Data Table", icon: Users, description: "Tabular data" },
];

const LAYOUT_OPTIONS = [
  { id: "grid", name: "Grid Layout", description: "Responsive grid system" },
  { id: "freeform", name: "Freeform", description: "Drag and position freely" },
  { id: "tabs", name: "Tabbed", description: "Organize in tabs" },
];

const DashboardBuilder = ({ dashboard, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: dashboard?.name || "",
    description: dashboard?.description || "",
    layout: dashboard?.layout || "grid",
    category: dashboard?.category || "custom",
    isPublic: dashboard?.isPublic || false,
    tags: dashboard?.tags || [],
    widgets: dashboard?.widgets || [],
  });

  const [editingWidget, setEditingWidget] = useState(null);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleAddWidget = (widgetType) => {
    const newWidget = {
      id: `widget_${Date.now()}`,
      type: widgetType,
      title: `New ${widgetType}`,
      dataSource: "complaints",
      metrics: [],
      filters: {},
      layout: {
        x: 0,
        y: formData.widgets.length * 3,
        w: 4,
        h: 3,
      },
    };
    setEditingWidget(newWidget);
    setShowWidgetLibrary(false);
  };

  const handleSaveWidget = (widget) => {
    setFormData((prev) => {
      const existingIndex = prev.widgets.findIndex((w) => w.id === widget.id);
      if (existingIndex >= 0) {
        const updatedWidgets = [...prev.widgets];
        updatedWidgets[existingIndex] = widget;
        return { ...prev, widgets: updatedWidgets };
      } else {
        return { ...prev, widgets: [...prev.widgets, widget] };
      }
    });
    setEditingWidget(null);
  };

  const handleDeleteWidget = (widgetId) => {
    if (confirm("Are you sure you want to remove this widget?")) {
      setFormData((prev) => ({
        ...prev,
        widgets: prev.widgets.filter((w) => w.id !== widgetId),
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Dashboard name is required");
      return;
    }
    if (formData.widgets.length === 0) {
      alert("Add at least one widget to the dashboard");
      return;
    }
    onSave(formData);
  };

  if (editingWidget) {
    return (
      <WidgetEditor
        widget={editingWidget}
        onSave={handleSaveWidget}
        onCancel={() => setEditingWidget(null)}
      />
    );
  }

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
              {dashboard ? "Edit Dashboard" : "Create Dashboard"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Design your custom analytics dashboard
            </p>
          </div>
        </div>
        <Button onClick={handleSubmit} className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Save className="mr-2 h-4 w-4" />
          Save Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Dashboard Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Dashboard Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Executive Overview"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the purpose of this dashboard"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="layout">Layout Style</Label>
              <Select
                value={formData.layout}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, layout: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LAYOUT_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <div>
                        <div className="font-medium">{option.name}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="sentiment">Sentiment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isPublic">Make Public</Label>
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isPublic: checked }))}
              />
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                  placeholder="Add tag..."
                />
                <Button type="button" onClick={handleAddTag} size="sm">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widget Management Panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Widgets ({formData.widgets.length})</CardTitle>
                <Button onClick={() => setShowWidgetLibrary(!showWidgetLibrary)} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Widget
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showWidgetLibrary && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  {WIDGET_TYPES.map((widgetType) => {
                    const Icon = widgetType.icon;
                    return (
                      <motion.div
                        key={widgetType.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex flex-col items-center p-3 bg-white dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 cursor-pointer transition-colors"
                        onClick={() => handleAddWidget(widgetType.id)}
                      >
                        <Icon className="h-8 w-8 text-blue-600 mb-2" />
                        <span className="text-xs font-medium text-center">{widgetType.name}</span>
                        <span className="text-xs text-gray-500 text-center mt-1">
                          {widgetType.description}
                        </span>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}

              {formData.widgets.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>No widgets added yet</p>
                  <p className="text-sm">Click "Add Widget" to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.widgets.map((widget) => {
                    const widgetTypeInfo = WIDGET_TYPES.find((t) => t.id === widget.type);
                    const Icon = widgetTypeInfo?.icon || BarChart3;
                    return (
                      <motion.div
                        key={widget.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border hover:border-blue-500 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium">{widget.title}</p>
                            <p className="text-xs text-gray-500">
                              {widgetTypeInfo?.name} • {widget.dataSource}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingWidget(widget)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteWidget(widget.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardBuilder;
