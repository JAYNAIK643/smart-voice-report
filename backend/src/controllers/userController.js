const User = require("../models/User");
const Grievance = require("../models/Grievance");
const { getBadgeProgress, getAllBadges, checkAndAwardBadges, calculateUserStatsFromGrievances } = require("../services/badgeService");

/**
 * Get current user's profile with stats and badges
 * GET /api/users/profile
 * ALWAYS calculates from Grievance collection dynamically
 */
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Dynamically calculate stats from grievances collection
    const totalGrievances = await Grievance.countDocuments({ userId: user._id });
    const resolvedGrievances = await Grievance.countDocuments({ 
      userId: user._id, 
      status: "resolved" 
    });

    // Get upvotes dynamically
    const userGrievances = await Grievance.find({ userId: user._id }).select("upvoteCount");
    const upvotesReceived = userGrievances.reduce((sum, g) => sum + (g.upvoteCount || 0), 0);
    
    const upvotesGiven = await Grievance.countDocuments({ upvotedBy: user._id });

    // Get badge progress (calculated dynamically)
    const badgeProgress = await getBadgeProgress(user._id);
    
    // Get earned badges (calculated dynamically)
    const earnedBadges = await checkAndAwardBadges(user._id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          emailEnabled: user.emailEnabled !== false,
          smsEnabled: user.smsEnabled === true,
          preferredLanguage: user.preferredLanguage || "en",
          createdAt: user.createdAt,
        },
        stats: {
          complaintsSubmitted: totalGrievances,
          complaintsResolved: resolvedGrievances,
          upvotesReceived: upvotesReceived,
          upvotesGiven: upvotesGiven,
          totalScore: totalGrievances * 10 + upvotesReceived * 5 + resolvedGrievances * 15,
        },
        badges: earnedBadges,
        badgeProgress,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get any user's public profile by ID
 * GET /api/users/profile/:id
 * ALWAYS calculates from Grievance collection dynamically
 */
exports.getUserProfileById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Dynamically calculate stats from grievances collection
    const totalGrievances = await Grievance.countDocuments({ userId: user._id });
    const resolvedGrievances = await Grievance.countDocuments({ 
      userId: user._id, 
      status: "resolved" 
    });

    // Get upvotes dynamically
    const userGrievances = await Grievance.find({ userId: user._id }).select("upvoteCount");
    const upvotesReceived = userGrievances.reduce((sum, g) => sum + (g.upvoteCount || 0), 0);
    
    const upvotesGiven = await Grievance.countDocuments({ upvotedBy: user._id });

    // Get badge progress (calculated dynamically)
    const badgeProgress = await getBadgeProgress(user._id);
    
    // Get earned badges (calculated dynamically)
    const earnedBadges = await checkAndAwardBadges(user._id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          emailEnabled: user.emailEnabled !== false,
          smsEnabled: user.smsEnabled === true,
          preferredLanguage: user.preferredLanguage || "en",
          createdAt: user.createdAt,
        },
        stats: {
          complaintsSubmitted: totalGrievances,
          complaintsResolved: resolvedGrievances,
          upvotesReceived: upvotesReceived,
          upvotesGiven: upvotesGiven,
          totalScore: totalGrievances * 10 + upvotesReceived * 5 + resolvedGrievances * 15,
        },
        badges: earnedBadges,
        badgeProgress,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's earned badges and progress
 * GET /api/users/badges
 * Calculates dynamically from Grievance collection
 */
exports.getUserBadges = async (req, res, next) => {
  try {
    const badgeProgress = await getBadgeProgress(req.user._id);
    const allBadges = getAllBadges();
    
    // Get earned badges dynamically
    const earnedBadges = await checkAndAwardBadges(req.user._id);
    const earnedBadgesCount = earnedBadges.length;

    res.status(200).json({
      success: true,
      data: {
        earnedBadges: earnedBadges,
        availableBadges: allBadges,
        badgeProgress,
        collectionProgress: {
          earned: earnedBadgesCount,
          total: allBadges.length,
          percentage: allBadges.length > 0 ? Math.round((earnedBadgesCount / allBadges.length) * 100) : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user statistics
 * GET /api/users/stats
 * Calculates ALL stats dynamically from Grievance collection
 */
exports.getUserStats = async (req, res, next) => {
  try {
    // Dynamically calculate stats from grievances collection
    const totalGrievances = await Grievance.countDocuments({ userId: req.user._id });
    const pendingCount = await Grievance.countDocuments({ userId: req.user._id, status: "pending" });
    const inProgressCount = await Grievance.countDocuments({ userId: req.user._id, status: "in-progress" });
    const resolvedCount = await Grievance.countDocuments({ userId: req.user._id, status: "resolved" });
    
    // Get upvotes dynamically
    const userGrievances = await Grievance.find({ userId: req.user._id }).select("upvoteCount");
    const upvotesReceived = userGrievances.reduce((sum, g) => sum + (g.upvoteCount || 0), 0);
    
    const upvotesGiven = await Grievance.countDocuments({ upvotedBy: req.user._id });
    
    const totalScore = totalGrievances * 10 + upvotesReceived * 5 + resolvedCount * 15;

    res.status(200).json({
      success: true,
      data: {
        complaintsSubmitted: totalGrievances,
        complaintsResolved: resolvedCount,
        upvotesReceived: upvotesReceived,
        upvotesGiven: upvotesGiven,
        totalScore: totalScore,
        complaintBreakdown: {
          pending: pendingCount,
          inProgress: inProgressCount,
          resolved: resolvedCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's recent activity (recent grievances)
 * GET /api/users/recent-activity
 */
exports.getRecentActivity = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Get user's most recent grievances with current status
    const recentGrievances = await Grievance.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("complaintId title description category status priority upvoteCount createdAt updatedAt");

    res.status(200).json({
      success: true,
      data: recentGrievances.map(g => ({
        id: g._id,
        complaintId: g.complaintId,
        title: g.title,
        description: g.description,
        category: g.category,
        status: g.status,
        priority: g.priority,
        upvoteCount: g.upvoteCount || 0,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all ward admins with complaint counts (for admin users page)
 * GET /api/users/admin/all
 * Admin only - returns only ward_admin users with ward-specific complaint counts
 */
exports.getAllUsersWithComplaints = async (req, res, next) => {
  try {
    // Get all users with role 'ward_admin' only
    const users = await User.find({ role: "ward_admin" }).select("-password").sort({ createdAt: -1 });

    // Get complaint count for each user's ward
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        // Count complaints for this user's specific ward directly from Grievance collection
        const count = await Grievance.countDocuments({ ward: user.ward });

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || "—",
          ward: user.ward,
          complaints: count,
          avatar: user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase(),
          role: user.role,
          createdAt: user.createdAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: usersWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users in the system
 * GET /api/admin/users
 * Super Admin only - Returns only SUPER_ADMIN and WARD_ADMIN users
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const Admin = require("../models/Admin");
    const WardAdmin = require("../models/WardAdmin");
    const Grievance = require("../models/Grievance");
    
    let adminUsers = [];
    let wardAdminUsers = [];

    // Filter based on role query parameter
    if (!role || role === "admin") {
      adminUsers = await Admin.find().select("-password").sort({ createdAt: -1 });
    }
    
    if (!role || role === "ward_admin") {
      wardAdminUsers = await WardAdmin.find().select("-password").sort({ createdAt: -1 });
    }

    // For ward admins, calculate ward-wise grievance counts
    const wardAdminUsersWithCounts = await Promise.all(
      wardAdminUsers.map(async (wardAdmin) => {
        // Count total grievances for this ward admin's ward
        const complaintCount = await Grievance.countDocuments({ ward: wardAdmin.ward });
        
        return {
          _id: wardAdmin._id,
          id: wardAdmin._id,
          name: wardAdmin.name,
          email: wardAdmin.email,
          role: wardAdmin.role || "ward_admin",
          ward: wardAdmin.ward,
          isActive: wardAdmin.isActive,
          createdAt: wardAdmin.createdAt,
          invitedBy: wardAdmin.invitedBy,
          complaints: complaintCount,
          avatar: wardAdmin.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase(),
        };
      })
    );

    // Combine and format the results
    const allUsers = [
      ...adminUsers.map(admin => ({
        _id: admin._id,
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role || "admin",
        isActive: admin.isActive,
        createdAt: admin.createdAt,
        permissions: admin.permissions,
      })),
      ...wardAdminUsersWithCounts
    ];

    res.status(200).json({
      success: true,
      count: allUsers.length,
      data: allUsers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign role and ward to a user
 * PUT /api/admin/users/:id/assign-role
 * Super Admin only
 */
exports.assignRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, ward } = req.body;

    // Validate role
    if (!["user", "ward_admin", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role specified" });
    }

    // Validate ward for ward_admin
    if (role === "ward_admin" && !ward) {
      return res.status(400).json({ success: false, message: "Ward assignment is required for ward_admin" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Prevent removing last super admin if applicable
    if (user.role === "admin" && role !== "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: "Cannot demote the only Super Admin" });
      }
    }

    user.role = role;
    if (ward) user.ward = ward;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User role updated to ${role} successfully`,
      data: {
        id: user._id,
        name: user.name,
        role: user.role,
        ward: user.ward,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle user account status (enable/disable)
 * PATCH /api/users/admin/toggle-status/:id
 * Super Admin only - Works with Admin and WardAdmin collections
 */
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const Admin = require("../models/Admin");
    const WardAdmin = require("../models/WardAdmin");
    
    // Try to find in Admin collection first
    let user = await Admin.findById(id);
    let userType = "admin";
    
    // If not found in Admin, try WardAdmin collection
    if (!user) {
      user = await WardAdmin.findById(id);
      userType = "ward_admin";
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Prevent disabling self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot disable your own account" });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User account ${user.isActive ? "enabled" : "disabled"} successfully`,
      data: {
        id: user._id,
        name: user.name,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user notification preferences
 * PATCH /api/users/preferences
 */
exports.updateNotificationPreferences = async (req, res, next) => {
  try {
    const { emailEnabled, smsEnabled, phone, preferredLanguage } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (emailEnabled !== undefined) user.emailEnabled = emailEnabled;
    if (smsEnabled !== undefined) user.smsEnabled = smsEnabled;
    if (phone !== undefined) user.phone = phone;
    if (preferredLanguage !== undefined) user.preferredLanguage = preferredLanguage;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Preferences updated successfully",
      data: {
        emailEnabled: user.emailEnabled,
        smsEnabled: user.smsEnabled,
        phone: user.phone,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send system-wide announcement (Super Admin only)
 * POST /api/admin/announcement
 */
exports.sendSystemAnnouncement = async (req, res, next) => {
  try {
    const { title, message, targetWard } = req.body;
    const notificationManager = require("../services/notificationManager");

    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Title and message are required" });
    }

    // Find target users
    let query = { role: "user" }; // Default to all regular users
    if (targetWard) {
      query.ward = targetWard;
    }

    const users = await User.find(query);
    console.log(`📣 Sending system announcement to ${users.length} users...`);

    // Use notificationManager to send alerts
    // For announcements, we use sendCriticalAlert which sends to both email and SMS (if phone exists)
    const results = await Promise.allSettled(
      users.map(user => notificationManager.sendCriticalAlert(user, { title, message }))
    );

    res.status(200).json({
      success: true,
      message: `Announcement sent to ${users.length} users`,
      recipientCount: users.length
    });
  } catch (error) {
    next(error);
  }
};
