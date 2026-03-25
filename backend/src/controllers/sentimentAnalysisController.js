const sentimentAnalysisService = require("../services/sentimentAnalysisService");

/**
 * Sentiment Analysis Controller
 * Handles real-time sentiment analysis for complaint text
 * Zero-Regression Strategy: New controller, extends existing AI features
 */

/**
 * @desc Analyze sentiment of text
 * @route POST /api/ai/sentiment/analyze
 * @access Private
 */
exports.analyzeSentiment = async (req, res) => {
  try {
    const { text, includeInsights = false } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Text is required"
      });
    }
    
    const sentiment = sentimentAnalysisService.analyzeSentiment(text);
    const result = { success: true, sentiment };
    
    if (includeInsights) {
      result.insights = sentimentAnalysisService.getSentimentInsights(sentiment);
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to analyze sentiment",
      error: error.message
    });
  }
};

/**
 * @desc Analyze sentiment of a specific complaint
 * @route GET /api/ai/sentiment/complaint/:id
 * @access Private
 */
exports.analyzeComplaintSentiment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await sentimentAnalysisService.analyzeComplaintSentiment(id);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Complaint sentiment analysis error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to analyze complaint sentiment",
      error: error.message
    });
  }
};

/**
 * @desc Batch analyze sentiment for multiple complaints
 * @route POST /api/ai/sentiment/batch-analyze
 * @access Private/Admin
 */
exports.batchAnalyzeSentiment = async (req, res) => {
  try {
    const { complaintIds } = req.body;
    
    if (!Array.isArray(complaintIds) || complaintIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Array of complaint IDs is required"
      });
    }
    
    if (complaintIds.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Maximum 100 complaints per batch"
      });
    }
    
    const result = await sentimentAnalysisService.batchAnalyzeSentiment(complaintIds);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Batch sentiment analysis error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to batch analyze sentiment",
      error: error.message
    });
  }
};

/**
 * @desc Get sentiment statistics
 * @route GET /api/ai/sentiment/statistics
 * @access Private/Admin
 */
exports.getSentimentStatistics = async (req, res) => {
  try {
    const { startDate, endDate, category, priority, ward } = req.query;
    
    const options = {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      category: category || undefined,
      priority: priority || undefined,
      ward: ward || undefined
    };
    
    const statistics = await sentimentAnalysisService.getSentimentStatistics(options);
    
    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error("Sentiment statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get sentiment statistics",
      error: error.message
    });
  }
};

/**
 * @desc Get sentiment trends over time
 * @route GET /api/ai/sentiment/trends
 * @access Private/Admin
 */
exports.getSentimentTrends = async (req, res) => {
  try {
    const { days = 30, interval = 'day' } = req.query;
    const daysNum = parseInt(days);
    
    if (daysNum > 365) {
      return res.status(400).json({
        success: false,
        message: "Maximum 365 days for trend analysis"
      });
    }
    
    // Calculate date ranges based on interval
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);
    
    // Get complaints in date range
    const complaints = await require("../models/Grievance").find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).select("title description createdAt priority category ward");
    
    // Group by time intervals and calculate sentiment
    const trends = [];
    const intervalMs = interval === 'week' ? 7 * 24 * 60 * 60 * 1000 : 
                     interval === 'month' ? 30 * 24 * 60 * 60 * 1000 : 
                     24 * 60 * 60 * 1000; // day
    
    // Group complaints by interval
    const grouped = {};
    for (const complaint of complaints) {
      const date = new Date(complaint.createdAt);
      let intervalKey;
      
      if (interval === 'day') {
        intervalKey = date.toISOString().split('T')[0];
      } else if (interval === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        intervalKey = weekStart.toISOString().split('T')[0];
      } else { // month
        intervalKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!grouped[intervalKey]) {
        grouped[intervalKey] = [];
      }
      grouped[intervalKey].push(complaint);
    }
    
    // Calculate sentiment for each interval
    for (const [intervalKey, intervalComplaints] of Object.entries(grouped)) {
      const sentiments = intervalComplaints.map(complaint => {
        const combinedText = `${complaint.title} ${complaint.description}`.trim();
        return sentimentAnalysisService.analyzeSentiment(combinedText);
      });
      
      if (sentiments.length > 0) {
        const avgScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
        const positive = sentiments.filter(s => s.category === 'positive').length;
        const negative = sentiments.filter(s => s.category === 'negative').length;
        const neutral = sentiments.filter(s => s.category === 'neutral').length;
        
        trends.push({
          period: intervalKey,
          averageScore: parseFloat(avgScore.toFixed(3)),
          positiveCount: positive,
          negativeCount: negative,
          neutralCount: neutral,
          totalCount: sentiments.length,
          positivePercentage: parseFloat(((positive / sentiments.length) * 100).toFixed(2)),
          negativePercentage: parseFloat(((negative / sentiments.length) * 100).toFixed(2))
        });
      }
    }
    
    // Sort by date
    trends.sort((a, b) => new Date(a.period) - new Date(b.period));
    
    res.status(200).json({
      success: true,
      data: {
        trends,
        summary: {
          totalPeriods: trends.length,
          overallAverageScore: parseFloat(
            trends.reduce((sum, t) => sum + t.averageScore, 0) / (trends.length || 1)
          ),
          totalComplaints: complaints.length
        }
      }
    });
  } catch (error) {
    console.error("Sentiment trends error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get sentiment trends",
      error: error.message
    });
  }
};

module.exports = exports;
