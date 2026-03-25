import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  FileWarning,
  Target,
  Route,
  Sparkles,
  X,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * AIComplaintAnalyzer Component
 * Displays AI-powered analysis results for complaints
 * Includes categorization, priority prediction, duplicate detection, and routing
 */

const AIComplaintAnalyzer = ({ 
  title, 
  description, 
  ward, 
  onAccept, 
  onDismiss,
  autoAnalyze = true 
}) => {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (autoAnalyze && title && description && ward && description.length >= 20) {
      analyzeComplaint();
    }
  }, [title, description, ward, autoAnalyze]);

  const analyzeComplaint = async () => {
    setIsAnalyzing(true);
    setError(null);
    setDismissed(false);

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:3000/api/ai/analyze-complaint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, ward }),
      });

      const result = await response.json();

      if (result.success) {
        setAnalysis(result);
      } else {
        setError(result.message || "Analysis failed");
      }
    } catch (err) {
      console.error("AI Analysis Error:", err);
      setError("Failed to analyze complaint");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAccept = () => {
    if (analysis && onAccept) {
      onAccept({
        category: analysis.categorization.suggestedCategory,
        priority: analysis.priority.suggestedPriority,
        aiAnalysis: analysis
      });
    }
    setDismissed(true);
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
    setDismissed(true);
  };

  if (isAnalyzing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 p-4 bg-primary/5 rounded-lg border border-primary/20"
      >
        <Brain className="w-5 h-5 text-primary animate-pulse" />
        <span className="text-sm font-medium text-primary">AI is analyzing your complaint...</span>
      </motion.div>
    );
  }

  if (error || !analysis || dismissed) {
    return null;
  }

  const { categorization, priority, duplicates, routing } = analysis;
  const hasDuplicates = duplicates.isDuplicate && duplicates.matches.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">AI Analysis Results</CardTitle>
                  <CardDescription>Smart insights for your complaint</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Categorization */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold">Suggested Category</span>
                <Badge variant="secondary" className="ml-auto">
                  {categorization.confidence}% confidence
                </Badge>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {categorization.suggestedCategory}
                </p>
                {categorization.alternativeCategories && categorization.alternativeCategories.length > 0 && (
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Alternatives: {categorization.alternativeCategories.map(alt => alt.category).join(", ")}
                  </p>
                )}
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-semibold">Priority Level</span>
                <Badge 
                  variant={priority.suggestedPriority === "high" ? "destructive" : "secondary"}
                  className="ml-auto"
                >
                  {priority.suggestedPriority.toUpperCase()}
                </Badge>
              </div>
              <div className={`p-3 rounded-lg border ${
                priority.suggestedPriority === "high" 
                  ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                  : priority.suggestedPriority === "medium"
                  ? "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800"
                  : "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
              }`}>
                <p className="text-sm font-medium">
                  {priority.reasoning}
                </p>
                {priority.detectedKeywords && priority.detectedKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {priority.detectedKeywords.map((keyword, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Duplicates Warning */}
            {hasDuplicates && (
              <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30">
                <FileWarning className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-sm">
                  <span className="font-semibold">Potential duplicates found:</span>
                  <span className="ml-1">{duplicates.duplicateCount} similar complaint{duplicates.duplicateCount > 1 ? 's' : ''}</span>
                  <div className="mt-2 space-y-1">
                    {duplicates.matches.slice(0, 2).map((match, idx) => (
                      <div key={idx} className="text-xs bg-white dark:bg-gray-900 p-2 rounded border">
                        <div className="flex items-center justify-between">
                          <span className="font-mono">{match.complaintId}</span>
                          <Badge variant="outline" className="text-xs">
                            {match.similarity}% similar
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1 truncate">{match.title}</p>
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Routing */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold">Smart Routing</span>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  {routing.department}
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Estimated response: {routing.estimatedResponseTime}
                </p>
                {routing.recommendations && routing.recommendations.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {routing.recommendations.slice(0, 2).map((rec, idx) => (
                      <li key={idx} className="text-xs text-green-700 dark:text-green-300 flex items-start gap-1">
                        <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={handleAccept} 
                className="flex-1 gap-2"
                variant="default"
              >
                <Check className="w-4 h-4" />
                Accept AI Suggestions
              </Button>
              <Button 
                onClick={handleDismiss} 
                variant="outline"
                className="flex-1 gap-2"
              >
                <X className="w-4 h-4" />
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIComplaintAnalyzer;
