const ContactMessage = require("../models/ContactMessage");
const WardAdmin = require("../models/WardAdmin");
const mongoose = require("mongoose");

/**
 * @desc    Submit a new contact/support message
 * @route   POST /api/contact
 * @access  Public
 */
const submitContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message, ward } = req.body;

    // Validation
    if (!name || !email || !subject || !message || !ward) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields: name, email, subject, message, ward",
      });
    }

    // Email validation regex
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Length validations
    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name must not exceed 100 characters",
      });
    }

    if (subject.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Subject must not exceed 200 characters",
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message must not exceed 2000 characters",
      });
    }

    // Create contact message
    const contactMessage = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      ward: ward.trim(),
      status: "pending",
      assignedTo: null,
    });

    res.status(201).json({
      success: true,
      message: "Your message has been submitted successfully",
      data: {
        ticketId: contactMessage.ticketId,
        status: contactMessage.status,
        createdAt: contactMessage.createdAt,
      },
    });
  } catch (error) {
    console.error("Error submitting contact message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit message. Please try again later.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all contact messages (for admin)
 * @route   GET /api/contact
 * @access  Private/Admin
 */
const getAllContactMessages = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status && ["pending", "assigned", "in-progress", "resolved"].includes(status)) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await ContactMessage.find(query)
      .populate("assignedTo", "name email ward")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ContactMessage.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
};

/**
 * @desc    Get contact messages assigned to ward admin
 * @route   GET /api/contact/ward-admin
 * @access  Private/WardAdmin
 */
const getWardAdminMessages = async (req, res) => {
  try {
    const wardAdminId = req.user._id;
    const { status, page = 1, limit = 20 } = req.query;

    const query = { assignedTo: wardAdminId };
    if (status && ["assigned", "in-progress", "resolved"].includes(status)) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await ContactMessage.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ContactMessage.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching ward admin messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
};

/**
 * @desc    Assign message to ward admin
 * @route   PUT /api/contact/:ticketId/assign
 * @access  Private/Admin
 */
const assignMessage = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { wardAdminId } = req.body;

    if (!wardAdminId) {
      return res.status(400).json({
        success: false,
        message: "Please provide wardAdminId to assign",
      });
    }

    // Verify ward admin exists
    const wardAdmin = await WardAdmin.findById(wardAdminId);
    if (!wardAdmin) {
      return res.status(404).json({
        success: false,
        message: "Ward admin not found",
      });
    }

    const message = await ContactMessage.findOneAndUpdate(
      { ticketId },
      {
        assignedTo: new mongoose.Types.ObjectId(wardAdminId),
        status: "assigned",
        assignedAt: new Date(),
      },
      { new: true }
    ).populate("assignedTo", "name email ward");

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Message assigned successfully",
      data: message,
    });
  } catch (error) {
    console.error("Error assigning message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign message",
      error: error.message,
    });
  }
};

/**
 * @desc    Update message status (for admin/ward admin)
 * @route   PUT /api/contact/:ticketId/status
 * @access  Private/Admin or WardAdmin
 */
const updateMessageStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (!["pending", "assigned", "in-progress", "resolved"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be pending, assigned, in-progress, or resolved",
      });
    }

    // Build query based on user role
    let query = { ticketId };
    if (userRole === "ward_admin") {
      // Ward admin can only update messages assigned to them
      // Convert userId to ObjectId for proper comparison
      query.assignedTo = new mongoose.Types.ObjectId(userId);
    }

    const message = await ContactMessage.findOneAndUpdate(
      query,
      { status },
      { new: true }
    ).populate("assignedTo", "name email ward");

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found or you don't have permission to update it",
      });
    }

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: message,
    });
  } catch (error) {
    console.error("Error updating message status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update status",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all ward admins for assignment
 * @route   GET /api/contact/ward-admins
 * @access  Private/Admin
 */
const getWardAdminsForAssignment = async (req, res) => {
  try {
    const wardAdmins = await WardAdmin.find({ isActive: true })
      .select("_id name email ward")
      .sort({ ward: 1 });

    res.status(200).json({
      success: true,
      data: wardAdmins,
    });
  } catch (error) {
    console.error("Error fetching ward admins:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch ward admins",
      error: error.message,
    });
  }
};

module.exports = {
  submitContactMessage,
  getAllContactMessages,
  getWardAdminMessages,
  assignMessage,
  updateMessageStatus,
  getWardAdminsForAssignment,
};
