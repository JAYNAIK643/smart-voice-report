const aiCategorizationService = require("../services/aiCategorizationService");
const Grievance = require("../models/Grievance");

/**
 * AI Intelligence Controller
 * Handles AI-powered complaint analysis, categorization, and smart routing
 * Zero-Regression Strategy: New controller, extends existing functionality
 */

/**
 * @desc Analyze complaint with AI (categorization, priority, duplicates)
 * @route POST /api/ai/analyze-complaint
 * @access Private
 */
exports.analyzeComplaint = async (req, res) => {
  try {
    const { title, description, ward } = req.body;
    
    // Validate input
    if (!title || !description || !ward) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and ward are required"
      });
    }
    
    // Run AI analysis
    const analysis = await aiCategorizationService.analyzeComplaint({
      title,
      description,
      ward
    });
    
    res.status(200).json(analysis);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    res.status(500).json({
      success: false,
      message: "AI analysis failed",
      error: error.message
    });
  }
};

/**
 * @desc Get category suggestions for complaint text
 * @route POST /api/ai/suggest-category
 * @access Private
 */
exports.suggestCategory = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Text is required"
      });
    }
    
    const result = aiCategorizationService.classifyCategory(text);
    
    res.status(200).json({
      success: true,
      data: {
        suggestedCategory: result.category,
        confidence: parseFloat((result.confidence * 100).toFixed(2)),
        allScores: result.scores
      }
    });
  } catch (error) {
    console.error("Category Suggestion Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to suggest category",
      error: error.message
    });
  }
};

/**
 * @desc Predict priority level for complaint
 * @route POST /api/ai/predict-priority
 * @access Private
 */
exports.predictPriority = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Text is required"
      });
    }
    
    const result = aiCategorizationService.predictPriority(text);
    
    res.status(200).json({
      success: true,
      data: {
        suggestedPriority: result.priority,
        confidence: parseFloat((result.confidence * 100).toFixed(2)),
        detectedKeywords: result.detectedKeywords,
        scores: result.scores
      }
    });
  } catch (error) {
    console.error("Priority Prediction Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to predict priority",
      error: error.message
    });
  }
};

/**
 * @desc Check for duplicate complaints
 * @route POST /api/ai/check-duplicates
 * @access Private
 */
exports.checkDuplicates = async (req, res) => {
  try {
    const { title, description, ward, similarityThreshold } = req.body;
    
    if (!title || !description || !ward) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and ward are required"
      });
    }
    
    const result = await aiCategorizationService.detectDuplicates(
      title,
      description,
      ward,
      { similarityThreshold: similarityThreshold || 0.7 }
    );
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Duplicate Check Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check duplicates",
      error: error.message
    });
  }
};

/**
 * @desc Get smart routing recommendation
 * @route POST /api/ai/suggest-routing
 * @access Private/Admin
 */
exports.suggestRouting = async (req, res) => {
  try {
    const { category, ward, priority } = req.body;
    
    if (!category || !ward) {
      return res.status(400).json({
        success: false,
        message: "Category and ward are required"
      });
    }
    
    const routing = aiCategorizationService.determineRouting(
      category,
      ward,
      priority || "medium"
    );
    
    res.status(200).json({
      success: true,
      data: routing
    });
  } catch (error) {
    console.error("Routing Suggestion Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to suggest routing",
      error: error.message
    });
  }
};

/**
 * @desc Get AI categorization statistics
 * @route GET /api/ai/stats
 * @access Private/Admin
 */
exports.getAIStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const timeLimit = new Date();
    timeLimit.setDate(timeLimit.getDate() - parseInt(days));
    
    // Get category distribution
    const categoryStats = await Grievance.aggregate([
      { $match: { createdAt: { $gte: timeLimit } } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgPriority: {
            $avg: {
              $switch: {
                branches: [
                  { case: { $eq: ["$priority", "low"] }, then: 1 },
                  { case: { $eq: ["$priority", "medium"] }, then: 2 },
                  { case: { $eq: ["$priority", "high"] }, then: 3 }
                ],
                default: 2
              }
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get priority distribution
    const priorityStats = await Grievance.aggregate([
      { $match: { createdAt: { $gte: timeLimit } } },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get ward distribution
    const wardStats = await Grievance.aggregate([
      { $match: { createdAt: { $gte: timeLimit } } },
      {
        $group: {
          _id: "$ward",
          count: { $sum: 1 },
          categories: { $addToSet: "$category" }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Calculate total complaints
    const totalComplaints = categoryStats.reduce((sum, cat) => sum + cat.count, 0);
    
    res.status(200).json({
      success: true,
      data: {
        totalComplaints,
        timeWindowDays: parseInt(days),
        categoryDistribution: categoryStats.map(cat => ({
          category: cat._id,
          count: cat.count,
          percentage: parseFloat(((cat.count / totalComplaints) * 100).toFixed(2)),
          avgPriorityLevel: parseFloat(cat.avgPriority.toFixed(2))
        })),
        priorityDistribution: priorityStats.map(pri => ({
          priority: pri._id,
          count: pri.count,
          percentage: parseFloat(((pri.count / totalComplaints) * 100).toFixed(2))
        })),
        wardDistribution: wardStats.map(ward => ({
          ward: ward._id,
          count: ward.count,
          percentage: parseFloat(((ward.count / totalComplaints) * 100).toFixed(2)),
          uniqueCategories: ward.categories.length
        })),
        insights: {
          mostCommonCategory: categoryStats[0]?._id || "N/A",
          busiestWard: wardStats[0]?._id || "N/A",
          highPriorityPercentage: parseFloat((
            (priorityStats.find(p => p._id === "high")?.count || 0) / totalComplaints * 100
          ).toFixed(2))
        }
      }
    });
  } catch (error) {
    console.error("AI Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch AI statistics",
      error: error.message
    });
  }
};

/**
 * @desc Batch analyze multiple complaints
 * @route POST /api/ai/batch-analyze
 * @access Private/Admin
 */
exports.batchAnalyze = async (req, res) => {
  try {
    const { complaints } = req.body;
    
    if (!Array.isArray(complaints) || complaints.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Array of complaints is required"
      });
    }
    
    if (complaints.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Maximum 50 complaints per batch"
      });
    }
    
    // Analyze all complaints in parallel
    const analyses = await Promise.all(
      complaints.map(complaint => 
        aiCategorizationService.analyzeComplaint(complaint)
      )
    );
    
    res.status(200).json({
      success: true,
      data: {
        totalAnalyzed: analyses.length,
        results: analyses
      }
    });
  } catch (error) {
    console.error("Batch Analysis Error:", error);
    res.status(500).json({
      success: false,
      message: "Batch analysis failed",
      error: error.message
    });
  }
};

module.exports = exports;
