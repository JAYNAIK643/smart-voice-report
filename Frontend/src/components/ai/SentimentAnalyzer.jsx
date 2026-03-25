import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Smile, 
  Frown, 
  Minus, 
  HeartHandshake,
  AlertTriangle,
  MessageCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Equal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Sentiment Analyzer Component
 * Displays real-time sentiment analysis for complaint text
 */

const SentimentAnalyzer = ({ 
  text, 
  includeInsights = true, 
  showBreakdown = true,
  autoAnalyze = true 
}) => {
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (autoAnalyze && text && text.trim().length > 10) {
      analyzeSentiment();
    } else if (text && text.trim().length <= 10) {
      setSentiment(null);
      setError(null);
    }
  }, [text, autoAnalyze]);

  const analyzeSentiment = async () => {
    if (!text || text.trim().length <= 10) return;
    
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:3000/api/sentiment/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          text, 
          includeInsights 
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSentiment(result.sentiment);
        if (includeInsights && result.insights) {
          setSentiment(prev => ({ ...prev, insights: result.insights }));
        }
      } else {
        setError(result.message || "Analysis failed");
      }
    } catch (err) {
      console.error("Sentiment analysis error:", err);
      setError("Failed to analyze sentiment");
    } finally {
      setLoading(false);
    }
  };

  const getSentimentConfig = (category) => {
    switch (category) {
      case 'positive':
        return { 
          icon: Smile, 
          color: "text-green-600", 
          bg: "bg-green-50", 
          border: "border-green-200",
          badge: "success",
          description: "Positive sentiment detected"
        };
      case 'negative':
        return { 
          icon: Frown, 
          color: "text-red-600", 
          bg: "bg-red-50", 
          border: "border-red-200",
          badge: "destructive",
          description: "Negative sentiment detected"
        };
      default:
        return { 
          icon: Minus, 
          color: "text-gray-600", 
          bg: "bg-gray-50", 
          border: "border-gray-200",
          badge: "secondary",
          description: "Neutral sentiment detected"
        };
    }
  };

  const getEmotionalIntensity = (magnitude) => {
    if (magnitude >= 0.7) return "High";
    if (magnitude >= 0.4) return "Medium";
    if (magnitude >= 0.1) return "Low";
    return "Minimal";
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 p-4 bg-primary/5 rounded-lg border border-primary/20"
      >
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
        <span className="text-sm font-medium text-primary">Analyzing sentiment...</span>
      </motion.div>
    );
  }

  if (!sentiment || error) {
    return null;
  }

  const config = getSentimentConfig(sentiment.category);
  const Icon = config.icon;
  const emotionalIntensity = getEmotionalIntensity(sentiment.magnitude);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <Card className={`border-2 ${config.border} bg-gradient-to-br from-primary/5 to-transparent`}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${config.color}`} />
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Sentiment Analysis
                  <Badge variant={config.badge} className="capitalize">
                    {sentiment.category}
                  </Badge>
                </CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Sentiment Score */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Sentiment Score</p>
                <p className={`text-2xl font-bold ${config.color}`}>
                  {sentiment.score > 0 ? '+' : ''}{sentiment.score.toFixed(3)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Intensity</p>
                <p className="text-2xl font-bold text-foreground">
                  {emotionalIntensity}
                </p>
              </div>
            </div>

            {/* Magnitude */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Emotional Magnitude</span>
                <span className="text-sm font-medium">{sentiment.magnitude.toFixed(3)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className={`h-2 rounded-full ${config.color.replace('text-', 'bg-')}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.abs(sentiment.score) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Breakdown */}
            {showBreakdown && sentiment.breakdown && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Sentiment Breakdown</h4>
                
                <div className="flex gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-green-600 font-medium">Positive Words</p>
                    <p className="text-sm">
                      {sentiment.breakdown.positiveWords.length}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-red-600 font-medium">Negative Words</p>
                    <p className="text-sm">
                      {sentiment.breakdown.negativeWords.length}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-medium">Total Words</p>
                    <p className="text-sm">
                      {sentiment.breakdown.wordCount}
                    </p>
                  </div>
                </div>

                {(sentiment.breakdown.positiveWords.length > 0 || sentiment.breakdown.negativeWords.length > 0) && (
                  <div className="space-y-2">
                    {sentiment.breakdown.positiveWords.length > 0 && (
                      <div>
                        <p className="text-xs text-green-600 font-medium mb-1">Positive indicators:</p>
                        <div className="flex flex-wrap gap-1">
                          {sentiment.breakdown.positiveWords.slice(0, 5).map((word, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              {word.word} ({word.score > 0 ? '+' : ''}{word.score.toFixed(2)})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {sentiment.breakdown.negativeWords.length > 0 && (
                      <div>
                        <p className="text-xs text-red-600 font-medium mb-1">Negative indicators:</p>
                        <div className="flex flex-wrap gap-1">
                          {sentiment.breakdown.negativeWords.slice(0, 5).map((word, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                              {word.word} ({word.score > 0 ? '+' : ''}{word.score.toFixed(2)})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Insights */}
            {sentiment.insights && sentiment.insights.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4" />
                  AI Insights
                </h4>
                <div className="space-y-2">
                  {sentiment.insights.map((insight, idx) => (
                    <Alert key={idx} className="p-3">
                      <AlertDescription className="text-sm">
                        {insight}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default SentimentAnalyzer;
