const mongoose = require("mongoose");

const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    ward: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "in-progress", "resolved"],
      default: "pending",
    },
    ticketId: {
      type: String,
      unique: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WardAdmin",
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Generate unique ticket ID before saving
contactMessageSchema.pre("save", async function (next) {
  if (!this.ticketId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.ticketId = `TICKET-${timestamp}-${random}`;
  }
  next();
});

// Index for querying by status
contactMessageSchema.index({ status: 1, createdAt: -1 });
contactMessageSchema.index({ ticketId: 1 });

module.exports = mongoose.model("ContactMessage", contactMessageSchema);
