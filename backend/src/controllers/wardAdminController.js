const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");
const WardAdmin = require("../models/WardAdmin");
const WardAdminInvitation = require("../models/WardAdminInvitation");
const Grievance = require("../models/Grievance");
const { sendWardAdminInvitationEmail } = require("../services/emailService");

/**
 * Create a new ward admin invitation
 * POST /api/admin/ward-admins/invite
 * Super Admin only
 */
exports.createWardAdminInvitation = async (req, res, next) => {
  try {
    const { name, email, ward } = req.body;
    console.log("📨 INVITE REQUEST received:", {
      requestedBy: req.user?._id,
      requesterEmail: req.user?.email,
      requesterRole: req.user?.role,
      inviteEmail: email,
      ward,
    });

    // Validate required fields
    if (!name || !email || !ward) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and ward are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Validate ward
    const validWards = ["Ward 1", "Ward 2", "Ward 3", "Ward 4", "Ward 5"];
    if (!validWards.includes(ward)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ward specified",
      });
    }

    // Check ONLY if an active invitation already exists
    const existingInvitation = await WardAdminInvitation.findOne({ email });
    if (existingInvitation && !existingInvitation.isUsed && existingInvitation.expiresAt > new Date()) {
      return res.status(409).json({
        success: false,
        message: "An invitation for this email already exists and is pending",
      });
    }

    // Create invitation token (valid for 7 days)
    const token = jwt.sign(
      { email, name, ward, invitedBy: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Create invitation record
    const invitation = await WardAdminInvitation.create({
      email,
      name,
      ward,
      invitedBy: req.user._id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    console.log("✅ Invitation record created:", {
      invitationId: invitation._id,
      email: invitation.email,
      ward: invitation.ward,
      expiresAt: invitation.expiresAt,
    });

    // Send invitation email
    console.log("📧 Triggering ward admin invitation email send...");
    const emailResult = await sendWardAdminInvitationEmail(
      email,
      name,
      ward,
      `${process.env.FRONTEND_URL || "http://localhost:8080"}/verify-ward-admin/${token}`
    );
    console.log("📧 Invitation email result:", emailResult);

    if (!emailResult.success) {
      // If email fails, delete the invitation
      await WardAdminInvitation.findByIdAndDelete(invitation._id);
      console.log("🗑️ Invitation deleted due to email failure:", invitation._id);
      return res.status(500).json({
        success: false,
        message: `Failed to send invitation email. ${emailResult.error || "Please verify email service configuration and try again."}`,
      });
    }

    res.status(201).json({
      success: true,
      message: "Ward Admin invitation sent successfully",
      data: {
        id: invitation._id,
        email: invitation.email,
        name: invitation.name,
        ward: invitation.ward,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify invitation token (without creating account)
 * GET /api/ward-admin/verify/:token
 * Public endpoint for invited users to verify their invitation
 */
exports.verifyInvitationToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Invitation token is required",
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired invitation token",
      });
    }

    const { email, name, ward } = decoded;

    // Check if invitation exists and is valid
    const invitation = await WardAdminInvitation.findOne({ 
      email, 
      token, 
      isUsed: false 
    });

    if (!invitation) {
      return res.status(400).json({
        success: false,
        message: "Invitation not found or already used",
      });
    }

    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Invitation has expired",
      });
    }

    // Check if user already exists in ANY collection
    const existingUser = await User.findOne({ email });
    const existingAdmin = await Admin.findOne({ email });
    const existingWardAdmin = await WardAdmin.findOne({ email });
    
    if (existingUser || existingAdmin || existingWardAdmin) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    // Return invitation details
    res.status(200).json({
      success: true,
      message: "Invitation is valid",
      data: {
        email,
        name,
        ward,
        role: "ward_admin",
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify invitation token and create user account
 * POST /api/auth/ward-admin/verify-and-signup
 * Public endpoint for invited users
 */
exports.verifyInvitationAndSignup = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Invitation token and password are required",
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired invitation token",
      });
    }

    const { email, name, ward, invitedBy } = decoded;

    // Check if invitation exists and is valid
    const invitation = await WardAdminInvitation.findOne({ 
      email, 
      token, 
      isUsed: false 
    });

    if (!invitation) {
      return res.status(400).json({
        success: false,
        message: "Invitation not found or already used",
      });
    }

    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Invitation has expired",
      });
    }

    // Check if user already exists in ANY collection (shouldn't happen, but double-check)
    const existingUser = await User.findOne({ email });
    const existingAdmin = await Admin.findOne({ email });
    const existingWardAdmin = await WardAdmin.findOne({ email });
    
    if (existingUser || existingAdmin || existingWardAdmin) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    // Password validation: 10-12 characters, must contain alphabets and numbers
    if (password.length < 10 || password.length > 12) {
      return res.status(400).json({
        success: false,
        message: "Password must be between 10 to 12 characters",
      });
    }

    const hasAlphabet = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasAlphabet || !hasNumber) {
      return res.status(400).json({
        success: false,
        message: "Password must contain both alphabets and numbers",
      });
    }

    // Prevent using email as password
    const emailUsername = email.split('@')[0].toLowerCase();
    if (password.toLowerCase().includes(emailUsername) || password.toLowerCase().includes(email.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Password cannot contain your email address",
      });
    }

    // Create the ward admin in ward_admins collection
    const wardAdmin = await WardAdmin.create({
      name,
      email,
      password,
      ward,
      invitedBy: decoded.invitedBy,
    });

    // Mark invitation as used
    invitation.isUsed = true;
    invitation.usedAt = new Date();
    await invitation.save();

    // Success response - NO auto-login token
    // User must login via /ward-admin-login page
    res.status(201).json({
      success: true,
      message: "Ward Admin account created successfully. Please login with your credentials.",
      data: {
        email: wardAdmin.email,
        role: "ward_admin",
        ward: wardAdmin.ward,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all pending ward admin invitations
 * GET /api/admin/ward-admins/invitations
 * Super Admin only
 */
exports.getPendingInvitations = async (req, res, next) => {
  try {
    const invitations = await WardAdminInvitation.find({ isUsed: false })
      .populate("invitedBy", "name email")
      .select("-token")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invitations.length,
      data: invitations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend invitation email
 * POST /api/admin/ward-admins/invitations/:id/resend
 * Super Admin only
 */
exports.resendInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const invitation = await WardAdminInvitation.findById(id);
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found",
      });
    }

    if (invitation.isUsed) {
      return res.status(400).json({
        success: false,
        message: "Cannot resend used invitation",
      });
    }

    if (invitation.expiresAt < new Date()) {
      // If expired, extend expiration
      invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await invitation.save();
    }

    // Send invitation email
    const emailResult = await sendWardAdminInvitationEmail(
      invitation.email,
      invitation.name,
      invitation.ward,
      `${process.env.FRONTEND_URL || "http://localhost:8080"}/verify-ward-admin/${invitation.token}`
    );

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: `Failed to send invitation email. ${emailResult.error || "Please verify email service configuration and try again."}`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Invitation email resent successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete invitation
 * DELETE /api/admin/ward-admins/invitations/:id
 * Super Admin only
 */
exports.deleteInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const invitation = await WardAdminInvitation.findById(id);
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found",
      });
    }

    if (invitation.isUsed) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete used invitation",
      });
    }

    await WardAdminInvitation.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Invitation deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get complaints for ward admin's assigned ward
 * GET /api/ward-admin/complaints
 * Ward Admin only
 */
exports.getWardComplaints = async (req, res, next) => {
  try {
    console.log("\n📋 WARD ADMIN: Fetching ward complaints");
    console.log(`   User ID: ${req.user._id}`);
    console.log(`   User Role: ${req.user.role}`);
    console.log(`   User Ward: ${req.user.ward}`);
    console.log(`   Filter: { ward: "${req.user.ward}" }`);
    
    // Get complaints for the ward admin's assigned ward
    const complaints = await Grievance.find({ ward: req.user.ward })
      .sort({ createdAt: -1 })
      .select("complaintId title description category status priority ward createdAt updatedAt imageUrl videoUrl latitude longitude");

    console.log(`   ✅ Found ${complaints.length} complaints for ${req.user.ward}`);
    
    // Log ward distribution for debugging
    if (complaints.length > 0) {
      const wardCounts = {};
      complaints.forEach(c => {
        wardCounts[c.ward] = (wardCounts[c.ward] || 0) + 1;
      });
      console.log(`   📍 Ward Distribution:`, wardCounts);
    }
    console.log("");

    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (error) {
    console.error("❌ ERROR in getWardComplaints:", error);
    next(error);
  }
};