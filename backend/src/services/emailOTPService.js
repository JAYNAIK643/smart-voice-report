const { Resend } = require("resend");
const crypto = require("crypto");

/**
 * Email OTP Service
 * Handles email-based one-time password generation, verification, and sending.
 * Uses Resend API for email delivery (HTTP-based, no SMTP ports required).
 * This avoids SMTP port blocks on cloud platforms like Render/Heroku.
 */

/**
 * Get a Resend client instance.
 * Validates RESEND_API_KEY is configured and returns a reusable client.
 * @returns {Object|null} Resend client or null if not configured
 */
const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    console.error("❌ Resend API key not configured. RESEND_API_KEY missing from environment variables.");
    console.error("   Get your API key at: https://resend.com/api-keys");
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
};

// Log Resend configuration status at module load
if (!process.env.RESEND_API_KEY) {
  console.warn("⚠️  Email OTP: RESEND_API_KEY not set. OTP emails will NOT be delivered.");
} else {
  console.log("✅ Email OTP: Resend API configured and ready.");
}

/**
 * Generate a 6-digit OTP code
 * @returns {string} 6-digit numeric code
 */
exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash OTP code for secure storage
 * @param {string} otp - Plain text OTP code
 * @returns {string} SHA256 hash of the OTP
 */
exports.hashOTP = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

/**
 * Verify OTP against stored hash with expiry check
 * @param {string} plainOTP - Plain text OTP entered by user
 * @param {string} hashedOTP - Stored hash of the OTP
 * @param {Date} expiresAt - OTP expiration timestamp
 * @returns {Object} { valid: boolean, expired: boolean }
 */
exports.verifyOTP = (plainOTP, hashedOTP, expiresAt) => {
  const hashedInput = exports.hashOTP(plainOTP);
  const isValid = hashedInput === hashedOTP;
  const isExpired = new Date() > expiresAt;

  return {
    valid: isValid && !isExpired,
    expired: isExpired,
    mismatch: !isValid && !isExpired,
  };
};

/**
 * Send OTP via Resend API (HTTP-based, no SMTP ports)
 * @param {string} userEmail - Recipient email address
 * @param {string} userName - Recipient name
 * @param {string} otp - Plain text OTP code to send
 * @returns {Promise<Object>} { success: boolean, message: string }
 */
exports.sendOTPEmail = async (userEmail, userName, otp) => {
  const resend = getResendClient();

  if (!resend) {
    console.error("📧 Email OTP skipped (Resend not configured):", userEmail);
    return { success: false, message: "Email service not configured" };
  }

  // Use Resend's default onboarding sender — no domain verification required
  const fromAddress = "SmartCity Portal <onboarding@resend.dev>";

  const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; padding: 0; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .header p { margin: 10px 0 0; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .otp-section { background: #f9f9f9; padding: 30px; border-radius: 8px; text-align: center; margin: 30px 0; border: 2px dashed #667eea; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; font-family: 'Courier New', monospace; letter-spacing: 5px; margin: 10px 0; }
          .otp-validity { color: #666; font-size: 14px; margin-top: 10px; }
          .security-note { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .security-note strong { color: #856404; }
          .security-note p { margin: 5px 0; color: #856404; font-size: 14px; }
          .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }
          .footer p { margin: 5px 0; }
          .warning { color: #d32f2f; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Login Verification</h1>
            <p>SmartCity Grievance Redressal System</p>
          </div>
          <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            <p>You have requested to log in to your SmartCity GRS account. Use the one-time password (OTP) below to complete your login:</p>
            
            <div class="otp-section">
              <div>Your One-Time Password (OTP):</div>
              <div class="otp-code">${otp}</div>
              <div class="otp-validity">⏱️ This code is valid for <strong>10 minutes</strong></div>
            </div>
            
            <p><strong>How to use this OTP:</strong></p>
            <ol>
              <li>Copy the 6-digit OTP code above</li>
              <li>Enter it in the login verification screen</li>
              <li>Do not share this code with anyone</li>
            </ol>
            
            <div class="security-note">
              <strong>🛡️ Security Notice:</strong>
              <p>✓ This OTP is unique to this login attempt</p>
              <p>✓ Never share this code with anyone, including SmartCity staff</p>
              <p>✓ SmartCity will never ask for your OTP via email</p>
              <p>✓ <span class="warning">If you didn't request this login, please ignore this email</span></p>
            </div>
            
            <p style="color: #999; font-size: 13px; margin-top: 30px;">If you have any questions or concerns, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>This is an automated security email. Please do not reply to this message.</p>
            <p>&copy; 2026 SmartCity Grievance Redressal System. All rights reserved.</p>
            <p>If you did not request this email, please contact support immediately.</p>
          </div>
        </div>
      </body>
      </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: userEmail,
      subject: "Your One-Time Password (OTP) - SmartCity GRS Login",
      html: htmlContent,
    });

    if (error) {
      console.error("❌ Resend API returned error for:", userEmail);
      console.error("   error.message:", error.message);
      console.error("   error.name:", error.name);
      console.error("   error.statusCode:", error.statusCode);
      return {
        success: false,
        message: error.message || "Failed to send OTP email via Resend",
        error: error.message,
      };
    }

    console.log("✅ OTP email sent via Resend to:", userEmail, "| id:", data.id);
    return { success: true, message: "OTP sent to email" };
  } catch (error) {
    console.error("❌ Exception sending OTP email to:", userEmail);
    console.error("   error.message:", error.message);
    console.error("   error.name:", error.name);
    console.error("   error.statusCode:", error.statusCode);
    if (error.message && error.message.includes("API key")) {
      console.error("   ⚠️  Invalid or missing RESEND_API_KEY. Get one at: https://resend.com/api-keys");
    }
    return {
      success: false,
      message: "Failed to send OTP email",
      error: error.message,
    };
  }
};

/**
 * Check if email OTP is enabled for user
 * @param {Object} user - User object from database
 * @returns {boolean} True if email OTP is enabled
 */
exports.isEmailOTPEnabled = (user) => {
  return user.emailOTP && user.emailOTP.enabled === true;
};

/**
 * Check if email OTP method is available (can be setup)
 * @param {Object} user - User object from database
 * @returns {boolean} True if email OTP can be enabled
 */
exports.canEnableEmailOTP = (user) => {
  return !exports.isEmailOTPEnabled(user);
};

/**
 * Check if OTP has expired
 * @param {Date} expiresAt - OTP expiration timestamp
 * @returns {boolean} True if OTP has expired
 */
exports.isOTPExpired = (expiresAt) => {
  return new Date() > expiresAt;
};

/**
 * Get OTP validity duration in minutes
 * @returns {number} Validity duration in minutes (default: 10)
 */
exports.getOTPValidityMinutes = () => {
  return parseInt(process.env.OTP_VALIDITY_MINUTES || "10");
};

/**
 * Calculate OTP expiration timestamp
 * @returns {Date} Future date when OTP expires
 */
exports.calculateOTPExpiration = () => {
  const expiresIn = exports.getOTPValidityMinutes() * 60 * 1000; // Convert to milliseconds
  return new Date(Date.now() + expiresIn);
};

/**
 * Get max OTP verification attempts
 * @returns {number} Maximum attempts allowed (default: 5)
 */
exports.getMaxOTPAttempts = () => {
  return parseInt(process.env.OTP_MAX_ATTEMPTS || "5");
};

/**
 * Check if user has exceeded max OTP attempts
 * @param {Object} user - User object
 * @returns {boolean} True if max attempts exceeded
 */
exports.hasExceededMaxAttempts = (user) => {
  const maxAttempts = exports.getMaxOTPAttempts();
  return user.emailOTP && user.emailOTP.attempts >= maxAttempts;
};

/**
 * Generate OTP setup response with detailed info
 * @param {string} userEmail - User email address
 * @param {Object} otpData - OTP data object
 * @returns {Object} Response object with setup info
 */
exports.generateSetupResponse = (userEmail, otpData) => {
  return {
    success: true,
    message: "Email OTP setup initiated",
    data: {
      email: userEmail,
      validityMinutes: exports.getOTPValidityMinutes(),
      maxAttempts: exports.getMaxOTPAttempts(),
      otpSent: true,
    },
  };
};

/**
 * Validate OTP length and format
 * @param {string} otp - OTP to validate
 * @returns {boolean} True if valid format
 */
exports.isValidOTPFormat = (otp) => {
  return /^\d{6}$/.test(otp);
};

/**
 * Generate OTP, save to database, and send email
 * Used for auto-sending OTP on login when user has email 2FA enabled
 * @param {Object} user - User document from database
 * @returns {Promise<Object>} { success: boolean, message: string }
 */
exports.generateAndSendOTP = async (user) => {
  try {
    if (!user.emailOTP) {
      user.emailOTP = {};
    }

    const otp = exports.generateOTP();
    const hashedOTP = exports.hashOTP(otp);
    const expiresAt = exports.calculateOTPExpiration();

    user.emailOTP.code = hashedOTP;
    user.emailOTP.expiresAt = expiresAt;
    user.emailOTP.attempts = 0;
    user.emailOTP.lastSentAt = new Date();

    await user.save();

    const emailResult = await exports.sendOTPEmail(user.email, user.name, otp);

    if (emailResult.success === false) {
      console.error("❌ OTP email delivery failed for:", user.email, "-", emailResult.message);
      return {
        success: false,
        message: emailResult.message || "Failed to send OTP email"
      };
    }

    console.log("✅ OTP generated and email sent successfully to:", user.email);
    return {
      success: true,
      message: "OTP generated and sent to email"
    };
  } catch (error) {
    console.error("Error generating and sending OTP:", error);
    return { 
      success: false, 
      message: "Failed to generate and send OTP" 
    };
  }
};

module.exports = exports;
