const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
    },
    changedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      role: {
        type: String,
        required: true,
      },
      name: String,
    },
    oldStatus: {
      type: String,
      required: true,
    },
    newStatus: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      default: "status_update",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
