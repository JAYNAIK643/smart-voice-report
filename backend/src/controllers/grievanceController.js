const Grievance = require("../models/Grievance");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const notificationManager = require("../services/notificationManager");

/**
 * Get a single grievance by complaint ID (for public tracking)
 * GET /api/grievances/id/:complaintId
 */
exports.getGrievanceById = async (req, res, next) => {
  try {
    const { complaintId } = req.params;

    const grievance = await Grievance.findOne({ complaintId })
      .populate("userId", "name email")
      .select("complaintId title description category status priority ward createdAt updatedAt");

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        complaintId: grievance.complaintId,
        title: grievance.title,
        description: grievance.description,
        category: grievance.category,
        status: grievance.status,
        priority: grievance.priority,
        ward: grievance.ward,
        createdAt: grievance.createdAt,
        updatedAt: grievance.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to log grievance status changes
 */
const logStatusChange = async (grievance, oldStatus, newStatus, user) => {
  try {
    await AuditLog.create({
      complaintId: grievance.complaintId,
      changedBy: {
        userId: user._id,
        role: user.role,
        name: user.name,
      },
      oldStatus,
      newStatus,
      action: "status_update",
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
};

/**
 * Submit a new grievance
 * POST /api/grievances
 * STRICT: Ward field is MANDATORY and must be provided by frontend
 */
exports.createGrievance = async (req, res, next) => {
  try {
    const { title, description, category, location, address, priority, anonymous, ward, imageUrl, latitude, longitude } =
      req.body;

    console.log("\n" + "=".repeat(70));
    console.log("📝 NEW COMPLAINT SUBMISSION");
    console.log("=".repeat(70));
    console.log("📦 Request Body Fields:");
    console.log(`   ward: ${ward}`);
    console.log(`   location: ${location}`);
    console.log(`   address: ${address}`);
    console.log(`   title: ${title}`);
    console.log(`   category: ${category}`);

    // STRICT VALIDATION: Ward is MANDATORY
    if (!ward || typeof ward !== 'string' || ward.trim() === '') {
      console.log("❌ VALIDATION ERROR: Ward field is missing or empty");
      return res.status(400).json({ 
        success: false, 
        message: "Ward field is required for complaint submission" 
      });
    }

    // Validate ward format (e.g., "Ward 1", "Ward 2", etc.)
    const validWards = ["Ward 1", "Ward 2", "Ward 3", "Ward 4", "Ward 5"];
    if (!validWards.includes(ward)) {
      console.log(`❌ VALIDATION ERROR: Invalid ward value: ${ward}`);
      return res.status(400).json({ 
        success: false, 
        message: `Invalid ward. Must be one of: ${validWards.join(", ")}` 
      });
    }

    // Use location or address (frontend may send either)
    const locationValue = location || address || "";

    // Generate complaint ID
    const lastGrievance = await Grievance.findOne().sort({ createdAt: -1 });
    let complaintNumber = 1;
    if (lastGrievance && lastGrievance.complaintId) {
      // Handle the complex ID format
      const match = lastGrievance.complaintId.match(/CMP-(\d+)/);
      if (match) {
        complaintNumber = parseInt(match[1]) + 1;
      }
    }
    const complaintId = `CMP-${String(complaintNumber).padStart(3, "0")}`;

    console.log(`\n📋 COMPLAINT DETAILS:`);
    console.log(`   Complaint ID: ${complaintId}`);
    console.log(`   Title: ${title}`);
    console.log(`   Category: ${category}`);
    console.log(`   Location/Address: ${locationValue}`);
    console.log(`   🎯 WARD (from req.body): ${ward}`);
    console.log(`   📍 Geolocation: ${latitude}, ${longitude}`);
    console.log(`   🖼️ Image: ${imageUrl ? 'Provided' : 'None'}`);
    console.log(`   User ID: ${req.user.id}`);
    console.log("=".repeat(70) + "\n");

    const grievanceData = {
      complaintId,
      title,
      description,
      category,
      address: locationValue, // Save as 'address' (schema field name)
      priority,
      userId: req.user.id,
      ward: ward, // STRICT: Use ward directly from request body (NO FALLBACK)
      anonymous: anonymous === true,
      // Image and Geolocation (optional - backward compatible)
      imageUrl: imageUrl || null,
      latitude: latitude || null,
      longitude: longitude || null,
    };

    const grievance = new Grievance(grievanceData);
    await grievance.save();

    // Populate user info for response
    await grievance.populate("userId", "name email");

    console.log(`✅ SUCCESS: Complaint ${complaintId} saved to database in ${ward}\n`);

    // Trigger Notification (Safe & Non-blocking)
    const user = await User.findById(req.user.id);
    if (user) {
      // Prepare data for email notification with all required fields
      const notificationData = {
        complaintId: grievance.complaintId,
        title: grievance.title,
        category: grievance.category,
        status: grievance.status,
        description: grievance.description
      };
      
      if (priority === "high") {
        // High priority/Emergency alert
        notificationManager.sendCriticalAlert(user, {
          complaintId: complaintId,
          title: `Emergency: ${title}`,
          message: `Your high-priority grievance (ID: ${complaintId}) has been registered. Our team will look into it immediately.`
        }).catch(err => {
          console.error("Failed to trigger critical alert:", err);
        });
      } else {
        notificationManager.notify(user, "registration", notificationData).catch(err => {
          console.error("Failed to trigger registration notification:", err);
        });
      }

      // Advanced Engagement System - Event Trigger (Non-blocking, fail-safe)
      try {
        const streakService = require("../services/gamification/streakService");
        const challengeService = require("../services/gamification/challengeService");
        
        // Update user streak (async, doesn't block response)
        streakService.updateUserStreak(req.user.id).catch(err => {
          console.error("📊 Engagement: Streak update failed (non-critical):", err.message);
        });

        // Update challenge progress if user is participating (async)
        challengeService.getUserChallenges(req.user.id)
          .then(({ activeChallenges }) => {
            activeChallenges.forEach(challenge => {
              if (challenge.goal === "complaints" || challenge.type === "city") {
                challengeService.updateChallengeProgress(req.user.id, challenge.challengeId, 1)
                  .catch(err => console.error("📊 Engagement: Challenge update failed (non-critical):", err.message));
              }
            });
          })
          .catch(err => console.error("📊 Engagement: Challenge check failed (non-critical):", err.message));
      } catch (engagementError) {
        // Silently fail - engagement logic should never block core functionality
        console.error("📊 Engagement: Event trigger failed (non-critical):", engagementError.message);
      }
    }

    res.status(201).json({
      success: true,
      message: "Grievance submitted successfully",
      data: grievance,
    });
  } catch (error) {
    console.error("❌ ERROR: Failed to create grievance:", error);
    next(error);
  }
};

/**
 * Get grievances for a user
 * GET /api/grievances/my
 */
exports.getMyGrievances = async (req, res, next) => {
  try {
    const grievances = await Grievance.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: grievances,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all grievances (admin/ward_admin)
 * GET /api/grievances/
 * Supports filtering by ward for Super Admin
 */
exports.getAllGrievances = async (req, res, next) => {
  try {
    let filter = {};
    const wardParam = req.query.ward || req.query.wardId;
    
    console.log(`\n📊 FETCHING GRIEVANCES`);
    console.log(`   User Role: ${req.user.role}`);
    console.log(`   User Ward: ${req.user.ward || 'N/A'}`);
    console.log(`   Ward Param: ${wardParam || 'None'}`);
    
    // ROLE-BASED VISIBILITY & ENFORCEMENT
    if (req.user.role === "ward_admin") {
      // Ward Admin is strictly restricted to their own ward
      filter.ward = req.user.ward;
      console.log(`   🔒 WARD ADMIN: Filtering by ward = "${req.user.ward}"`);
      console.log(`   Filter applied: { ward: "${req.user.ward}" }`);
    } else if (req.user.role === "admin" && wardParam) {
      // Super Admin can filter by any ward (e.g., when clicking a ward admin)
      filter.ward = wardParam;
      console.log(`   👑 SUPER ADMIN: Filtering by ward = "${wardParam}"`);
    } else if (req.user.role === "admin") {
      console.log(`   👑 SUPER ADMIN: No filter - viewing ALL wards`);
    }
    // If Super Admin and no ward filter, all complaints are returned

    const grievances = await Grievance.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    console.log(`   ✅ Found ${grievances.length} complaints`);
    
    // Log ward distribution for debugging
    if (grievances.length > 0) {
      const wardCounts = {};
      grievances.forEach(g => {
        wardCounts[g.ward] = (wardCounts[g.ward] || 0) + 1;
      });
      console.log(`   📍 Ward Distribution:`, wardCounts);
    }
    console.log("");

    res.status(200).json({
      success: true,
      count: grievances.length,
      data: grievances,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all grievances (public)
 * GET /api/grievances/public
 */
exports.getPublicGrievances = async (req, res, next) => {
  try {
    const { sortBy = "newest", category = "", status = "" } = req.query;

    let sortCriteria = {};
    if (sortBy === "most-upvoted") {
      sortCriteria = { upvoteCount: -1 };
    } else {
      sortCriteria = { createdAt: -1 };
    }

    let filter = {};
    if (category && category !== "all") {
      filter.category = category;
    }
    if (status && status !== "all") {
      filter.status = status;
    }

    const grievances = await Grievance.find(filter)
      .populate("userId", "name")
      .sort(sortCriteria);

    // Transform data to match frontend expectations
    const transformedGrievances = grievances.map((g) => ({
      ...g.toObject(),
      userName: g.userId?.name || "Anonymous Citizen",
      upvoteCount: g.upvoteCount || 0,
      complaintId: g.complaintId,
      _id: g._id.toString(),
    }));

    res.status(200).json({
      success: true,
      data: transformedGrievances,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update grievance status or priority
 * PUT /api/grievances/:id
 * Enforces ward-based access control for ward_admins
 */
exports.updateGrievanceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;
    
    const grievance = await Grievance.findOne({ complaintId: id });
    if (!grievance) {
      return res.status(404).json({ success: false, message: "Grievance not found" });
    }

    // WARD-BASED ACCESS ENFORCEMENT
    if (req.user.role === "ward_admin" && grievance.ward !== req.user.ward) {
      return res.status(403).json({ 
        success: false, 
        message: "Access Denied: You cannot manage complaints from other wards" 
      });
    }
    
    let updated = false;
    let statusChanged = false;
    let priorityChangedToHigh = false;

    // Handle Status Update & Audit Logging
    if (status) {
      const oldStatus = grievance.status;
      if (oldStatus !== status) {
        grievance.status = status;
        updated = true;
        statusChanged = true;
        
        // Audit log mandatory for status changes
        await logStatusChange(grievance, oldStatus, status, req.user);
      }
    }

    // Handle Priority Update
    if (priority) {
      if (grievance.priority !== priority) {
        if (priority === "high") {
          priorityChangedToHigh = true;
        }
        grievance.priority = priority;
        updated = true;
      }
    }

    if (updated) {
      await grievance.save();
      
      const user = await User.findById(grievance.userId);
      if (user) {
        // 1. Critical Alert if priority changed to High
        if (priorityChangedToHigh) {
          notificationManager.sendCriticalAlert(user, {
            complaintId: grievance.complaintId,
            title: `Priority Escalated: ${grievance.title}`,
            message: `The priority of your grievance (ID: ${grievance.complaintId}) has been escalated to HIGH. We are prioritizing its resolution.`
          }).catch(err => {
            console.error("Failed to trigger priority escalation critical alert:", err);
          });
        }
        
        // 2. Status Update Notification (if status changed)
        if (statusChanged) {
          notificationManager.notify(user, "status_update", {
            complaintId: grievance.complaintId,
            title: grievance.title,
            status: grievance.status,
          }).catch(err => {
            console.error("Failed to trigger status update notification:", err);
          });
          console.log(`✉️/📱 Notification triggered for ${user.email} for status update to ${grievance.status}`);
        }
      }
    }
    
    res.status(200).json({
      success: true,
      message: updated ? "Grievance updated successfully" : "No changes made",
      data: grievance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upvote a grievance
 * POST /api/grievances/:id/upvote
 */
exports.upvoteGrievance = async (req, res, next) => {
  try {
    const { id } = req.params; // This is the complaintId from the route

    // Find grievance by complaintId
    const grievance = await Grievance.findOne({ complaintId: id });
    if (!grievance) {
      return res
        .status(404)
        .json({ success: false, message: "Grievance not found" });
    }

    // Prevent self-upvoting - Convert both to strings for comparison
    if (grievance.userId.toString() === req.user.id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Cannot upvote your own grievance" });
    }

    // Check if user already upvoted - Ensure proper ObjectId comparison
    const hasAlreadyUpvoted = grievance.upvotedBy.some(
      userId => userId.toString() === req.user.id.toString()
    );
    
    if (hasAlreadyUpvoted) {
      return res
        .status(400)
        .json({ success: false, message: "Already upvoted this grievance" });
    }

    // Perform atomic update using findOneAndUpdate for transaction safety
    const updatedGrievance = await Grievance.findOneAndUpdate(
      { complaintId: id },
      {
        $inc: { upvoteCount: 1 },
        $push: { upvotedBy: req.user.id }
      },
      { new: true, runValidators: true }
    );

    if (!updatedGrievance) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to update grievance" });
    }

    // Award points to complaint owner (+5 points) with atomic operation
    const updatedOwner = await User.findByIdAndUpdate(
      grievance.userId,
      {
        $inc: { 
          points: 5,            // Using points field
          totalScore: 5,        // Also update totalScore for backward compatibility
          upvotesReceived: 1    // Track received upvotes for leaderboard
        }
      },
      { new: true, runValidators: true }
    );

    // Also increment upvotesGiven for the voting user
    await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { upvotesGiven: 1 } },
      { runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Grievance upvoted successfully",
      data: {
        upvoteCount: updatedGrievance.upvoteCount,
        upvotedBy: updatedGrievance.upvotedBy,
        pointsAwarded: 5,
        ownerId: grievance.userId
      },
    });
  } catch (error) {
    console.error("Upvote error:", error);
    next(error);
  }
};

/**
 * Resolve a grievance
 * POST /api/grievances/:id/resolve
 */
exports.resolveGrievance = async (req, res, next) => {
  try {
    const { id } = req.params; // This is the complaintId string

    const grievance = await Grievance.findOne({ complaintId: id });
    if (!grievance) {
      return res
        .status(404)
        .json({ success: false, message: "Grievance not found" });
    }

    // Role-based authorization check
    if (req.user.role === "ward_admin" && grievance.ward !== req.user.ward) {
      return res.status(403).json({ success: false, message: "Unauthorized to resolve this ward's grievance" });
    }

    const oldStatus = grievance.status;
    if (oldStatus === "resolved") {
      return res
        .status(400)
        .json({ success: false, message: "Grievance is already resolved" });
    }

    grievance.status = "resolved";
    await grievance.save();

    // Log the change
    await logStatusChange(grievance, oldStatus, "resolved", req.user);

    // Send status update notification
    const user = await User.findById(grievance.userId);
    if (user) {
      notificationManager.notify(user, "status_update", {
        complaintId: grievance.complaintId,
        title: grievance.title,
        status: grievance.status,
      }).catch(err => {
        console.error("Failed to trigger status update notification:", err);
      });
    }

    res.status(200).json({
      success: true,
      message: "Grievance marked as resolved",
      data: grievance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get admin dashboard statistics
 * GET /api/grievances/admin/stats
 * Admin only - returns counts based on user's role/ward
 */
exports.getAdminDashboardStats = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role === "ward_admin") {
      filter.ward = req.user.ward;
    }

    const totalComplaints = await Grievance.countDocuments(filter);
    const pendingComplaints = await Grievance.countDocuments({
      ...filter,
      status: "pending",
    });
    const resolvedComplaints = await Grievance.countDocuments({
      ...filter,
      status: "resolved",
    });
    const inProgressComplaints = await Grievance.countDocuments({
      ...filter,
      status: "in-progress",
    });

    res.status(200).json({
      success: true,
      data: {
        totalComplaints,
        pendingComplaints,
        resolvedComplaints,
        inProgressComplaints,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get ward-wise complaint statistics
 * GET /api/grievances/admin/ward-stats
 * Admin only - returns complaint counts grouped by ward
 */
exports.getWardStats = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role === "ward_admin") {
      filter.ward = req.user.ward;
    }

    // Aggregate complaints by ward
    const wardStats = await Grievance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$ward",
          complaints: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          ward: "$_id",
          complaints: 1,
        },
      },
      { $sort: { ward: 1 } },
    ]);

    // Ensure all wards are present or only the specific ward if ward_admin
    const allWards = req.user.role === "ward_admin" 
      ? [req.user.ward] 
      : ["Ward 1", "Ward 2", "Ward 3", "Ward 4", "Ward 5"];
      
    const completeWardData = allWards.map((ward) => {
      const found = wardStats.find((w) => w.ward === ward);
      return {
        ward,
        complaints: found ? found.complaints : 0,
      };
    });

    // Also get issue type distribution
    const issueTypeStats = await Grievance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get resolution trend data (group by month and status)
    const resolutionTrend = await Grievance.aggregate([
      { $match: filter },
      {
        $project: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
          status: 1,
        },
      },
      {
        $match: {
          status: { $in: ["resolved", "pending"] },
        },
      },
      {
        $group: {
          _id: {
            month: "$month",
            year: "$year",
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          year: "$_id.year",
          status: "$_id.status",
          count: 1,
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        wardData: completeWardData,
        issueTypeData: issueTypeStats,
        resolutionTrend: resolutionTrend,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get audit logs for a grievance
 * GET /api/grievances/:id/audit-logs
 */
exports.getGrievanceAuditLogs = async (req, res, next) => {
  try {
    const { id } = req.params;

    const grievance = await Grievance.findOne({ complaintId: id });
    if (!grievance) {
      return res.status(404).json({ success: false, message: "Grievance not found" });
    }

    // Role-based authorization check
    if (req.user.role === "ward_admin" && grievance.ward !== req.user.ward) {
      return res.status(403).json({ success: false, message: "Unauthorized to view this ward's audit logs" });
    }

    const logs = await AuditLog.find({ complaintId: id }).sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};
