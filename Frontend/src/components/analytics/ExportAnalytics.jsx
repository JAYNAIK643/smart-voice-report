import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { apiService } from "@/services/apiService";
import { useToast } from "@/hooks/use-toast";

const ExportAnalytics = () => {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const response = await apiService.getAllGrievances();
      if (response.success && response.data) {
        const complaints = response.data;
        
        // Define CSV headers
        const headers = ["ID", "Title", "Category", "Ward", "Status", "Priority", "Submitted", "Resolved"];
        
        // Map data to CSV rows
        const rows = complaints.map(c => [
          c.complaintId || "",
          `"${c.title?.replace(/"/g, '""') || ""}"`,
          c.category || "",
          c.ward || "",
          c.status || "",
          c.priority || "",
          c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "",
          c.status === "resolved" ? new Date(c.updatedAt).toLocaleDateString() : "N/A"
        ]);
        
        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        
        // Create download link
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `grievances_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Export Success",
          description: "Grievances report has been downloaded as CSV.",
        });
      }
    } catch (error) {
      console.error("Export Error:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to generate CSV report.",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="border-2 border-slate-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200 py-4">
        <CardTitle className="text-lg font-bold text-slate-900">Data Export & Reports</CardTitle>
        <p className="text-sm text-slate-500 mt-0.5">Download analytics data for offline usage</p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={handleExportCSV} 
            disabled={exporting}
            variant="outline" 
            className="flex items-center justify-center gap-3 h-24 border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
          >
            {exporting ? (
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            ) : (
              <FileSpreadsheet className="h-6 w-6 text-blue-600" />
            )}
            <div className="text-left">
              <p className="font-bold text-slate-900">Export as CSV</p>
              <p className="text-xs text-slate-500">Excel compatible format</p>
            </div>
          </Button>

          <Button 
            disabled
            variant="outline" 
            className="flex items-center justify-center gap-3 h-24 border-2 border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
          >
            <FileText className="h-6 w-6 text-slate-400" />
            <div className="text-left">
              <p className="font-bold text-slate-400">Export as PDF</p>
              <p className="text-xs text-slate-400">Formal document report</p>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportAnalytics;
