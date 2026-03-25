const mongoose = require("mongoose");

const smsLogSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      index: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      index: true,
    },
    messageType: {
      type: String,
      enum: ["registration", "status_update", "resolution", "critical_alert", "announcement"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    deliveryStatus: {
      type: String,
      enum: ["queued", "sent", "delivered", "failed", "undelivered"],
      default: "queued",
      index: true,
    },
    error: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    grievanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grievance",
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model("SMSLog", smsLogSchema);
