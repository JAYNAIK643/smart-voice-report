const User = require("../models/User");
const twoFactorAuthService = require("../services/twoFactorAuthService");
const emailOTPService = require("../services/emailOTPService");

/**
 * Two-Factor Authentication Controller
 * Handles 2FA setup, verification, and management (TOTP + Email OTP)
 * Zero-Regression Strategy: New controller, extends authentication system
 */

/**
 * @desc Initialize 2FA setup for user
 * @route POST /api/auth/2fa/setup
 * @access Private
 */
exports.setup2FA = async (req, res) => {
  try {
    console.log("🔐 [setup2FA] incoming request", { authHeader: !!req.headers.authorization });
    console.log("🔐 [setup2FA] req.user present:", req.user ? { id: req.user._id, email: req.user.email } : null);

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if 2FA is already enabled
    if (user.twoFactorAuth && user.twoFactorAuth.enabled) {
      return res.status(400).json({
        success: false,
        message: "2FA is already enabled. Disable it first to set up again.",
      });
    }

    // Generate secret
    const secret = twoFactorAuthService.generateSecret(user.email);

    // Store temp secret (not enabled yet)
    user.twoFactorAuth = {
      ...user.twoFactorAuth,
      tempSecret: secret.base32,
      enabled: false,
    };
    await user.save();

    // Return the otpauth URL for frontend to generate QR code
    // Frontend QRCodeSVG component will generate the QR from this URL
    res.status(200).json({
      success: true,
      message: "2FA setup initiated. Scan QR code with authenticator app.",
      data: {
        secret: secret.base32,
        qrCode: secret.otpauth_url, // Frontend will generate QR from this URL
        otpauth_url: secret.otpauth_url,
      },
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to setup 2FA",
      error: error.message,
    });
  }
};

/**
 * @desc Verify and enable 2FA
 * @route POST /api/auth/2fa/verify-setup
 * @access Private
 */
exports.verifyAndEnable2FA = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || token.length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Invalid token format. Provide 6-digit code.",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user || !user.twoFactorAuth || !user.twoFactorAuth.tempSecret) {
      return res.status(400).json({
        success: false,
        message: "2FA setup not initiated. Call /setup first.",
      });
    }

    // Verify token
    const isValid = twoFactorAuthService.verifyToken(
      token,
      user.twoFactorAuth.tempSecret
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code. Please try again.",
      });
    }

    // Generate backup codes
    const backupCodes = twoFactorAuthService.generateBackupCodes(10);
    const hashedBackupCodes = backupCodes.map((code) => ({
      code: twoFactorAuthService.hashBackupCode(code),
      used: false,
    }));

    // Enable 2FA
    user.twoFactorAuth = {
      enabled: true,
      secret: user.twoFactorAuth.tempSecret,
      tempSecret: null,
      backupCodes: hashedBackupCodes,
      enabledAt: new Date(),
    };
    await user.save();

    res.status(200).json({
      success: true,
      message: "2FA enabled successfully. Save your backup codes safely!",
      data: {
        backupCodes, // Send plain text codes only once
      },
    });
  } catch (error) {
    console.error("2FA verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify 2FA",
      error: error.message,
    });
  }
};

/**
 * @desc Verify 2FA token during login
 * @route POST /api/auth/2fa/verify
 * @access Public (but requires valid user context)
 */
exports.verify2FAToken = async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        message: "User ID and token are required",
      });
    }

    // Try to resolve user from Authorization token if present, otherwise fall back to userId in body
    let user = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userIdFromToken = decoded.id || decoded._id || decoded.userId || decoded.user?.id;
        if (userIdFromToken) {
          user = await User.findById(userIdFromToken);
        }
      } catch (err) {
        // ignore token errors here - we'll fall back to userId in body
        console.log("Auth token ignored for email OTP verify:", err.message);
      }
    }

    if (!user) {
      user = await User.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!twoFactorAuthService.is2FAEnabled(user)) {
      return res.status(400).json({
        success: false,
        message: "2FA is not enabled for this user",
      });
    }

    let isValid = false;
    let warningMessage = null;

    // Try regular TOTP token first
    isValid = twoFactorAuthService.verifyToken(
      token,
      user.twoFactorAuth.secret
    );

    // If regular token fails, check backup codes
    if (!isValid) {
      const backupCodeValid = user.twoFactorAuth.backupCodes.find((bc) => {
        return (
          !bc.used && twoFactorAuthService.verifyBackupCode(token, bc.code)
        );
      });

      if (backupCodeValid) {
        // Mark backup code as used
        backupCodeValid.used = true;
        backupCodeValid.usedAt = new Date();
        await user.save();
        isValid = true;
        warningMessage = "Backup code has been used. Consider regenerating backup codes.";
      }
    }

    // If both regular token and backup codes failed
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid 2FA code",
      });
    }

    // 2FA verification successful - Complete authentication flow
    // Generate JWT token
    const jwt = require("jsonwebtoken");
    
    // User found in User collection - default role is "user"
    const userRole = "user";
    
    const tokenPayload = {
      id: user._id,
      role: userRole,
      ward: user.ward
    };
    const authToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("✅ 2FA verification successful and auth completed:", { 
      email: user.email, 
      role: userRole,
      usedBackupCode: !!warningMessage 
    });

    // Build response with token and user data
    const responseData = {
      token: authToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: userRole,
        createdAt: user.createdAt,
      },
    };

    // Add ward for user (if applicable)
    if (user.ward) {
      responseData.user.ward = user.ward;
    }

    const response = {
      success: true,
      message: "2FA verification successful",
      data: responseData,
    };

    if (warningMessage) {
      response.warning = warningMessage;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("2FA token verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify 2FA token",
      error: error.message,
    });
  }
};

/**
 * @desc Disable 2FA for user
 * @route POST /api/auth/2fa/disable
 * @access Private
 */
exports.disable2FA = async (req, res) => {
  try {
    const { password, token } = req.body;

    if (!password || !token) {
      return res.status(400).json({
        success: false,
        message: "Password and 2FA token are required to disable 2FA",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify password
    const passwordMatch = await user.matchPassword(password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    // Verify 2FA token
    if (!twoFactorAuthService.is2FARequired(user)) {
      return res.status(400).json({
        success: false,
        message: "2FA is not enabled",
      });
    }

    const isValid = twoFactorAuthService.verifyToken(
      token,
      user.twoFactorAuth.secret
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid 2FA token",
      });
    }

    // Disable 2FA
    user.twoFactorAuth = {
      enabled: false,
      secret: null,
      tempSecret: null,
      backupCodes: [],
      enabledAt: null,
    };
    await user.save();

    res.status(200).json({
      success: true,
      message: "2FA disabled successfully",
    });
  } catch (error) {
    console.error("2FA disable error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to disable 2FA",
      error: error.message,
    });
  }
};

/**
 * @desc Get 2FA status for current user
 * @route GET /api/auth/2fa/status
 * @access Private
 */
exports.get2FAStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const status = {
      enabled: user.twoFactorAuth?.enabled || false,
      enabledAt: user.twoFactorAuth?.enabledAt || null,
      backupCodesCount: user.twoFactorAuth?.backupCodes?.length || 0,
      unusedBackupCodes: user.twoFactorAuth?.backupCodes?.filter((bc) => !bc.used).length || 0,
    };

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("2FA status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch 2FA status",
      error: error.message,
    });
  }
};

/**
 * @desc Regenerate backup codes
 * @route POST /api/auth/2fa/regenerate-backup-codes
 * @access Private
 */
exports.regenerateBackupCodes = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!twoFactorAuthService.is2FARequired(user)) {
      return res.status(400).json({
        success: false,
        message: "2FA is not enabled",
      });
    }

    // Verify password
    const bcrypt = require("bcryptjs");
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Generate new backup codes
    const backupCodes = twoFactorAuthService.generateBackupCodes(10);
    const hashedBackupCodes = backupCodes.map((code) => ({
      code: twoFactorAuthService.hashBackupCode(code),
      used: false,
    }));

    user.twoFactorAuth.backupCodes = hashedBackupCodes;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Backup codes regenerated successfully",
      data: {
        backupCodes,
      },
    });
  } catch (error) {
    console.error("Backup codes regeneration error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to regenerate backup codes",
      error: error.message,
    });
  }
};

/**
 * @desc Setup email OTP for user
 * @route POST /api/auth/2fa/email-otp/setup
 * @access Private
 */
exports.setupEmailOTP = async (req, res) => {
  try {
    console.log("📧 [setupEmailOTP] incoming request", { authHeader: !!req.headers.authorization });
    console.log("📧 [setupEmailOTP] req.user present:", req.user ? { id: req.user._id, email: req.user.email } : null);

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if email OTP is already enabled
    if (emailOTPService.isEmailOTPEnabled(user)) {
      return res.status(400).json({
        success: false,
        message: "Email OTP is already enabled. Disable it first to set up again.",
      });
    }

    // Generate OTP code
    const otp = emailOTPService.generateOTP();
    const hashedOTP = emailOTPService.hashOTP(otp);
    const expiresAt = emailOTPService.calculateOTPExpiration();

    // Store OTP temporarily (not enabled yet)
    user.emailOTP = {
      ...user.emailOTP,
      code: hashedOTP,
      expiresAt: expiresAt,
      attempts: 0,
      enabled: false,
      lastSentAt: new Date(),
    };
    await user.save();

    // Send OTP via email
    const emailResult = await emailOTPService.sendOTPEmail(
      user.email,
      user.name,
      otp
    );

    if (!emailResult.success) {
      console.error("Failed to send OTP email:", emailResult.error);
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email. Please try again.",
        error: emailResult.error,
      });
    }

    res.status(200).json({
      success: true,
      message: "Email OTP setup initiated. Check your email for the code.",
      data: {
        email: user.email,
        validityMinutes: emailOTPService.getOTPValidityMinutes(),
        maxAttempts: emailOTPService.getMaxOTPAttempts(),
      },
    });
  } catch (error) {
    console.error("Email OTP setup error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to setup email OTP",
      error: error.message,
    });
  }
};

/**
 * @desc Verify and enable email OTP
 * @route POST /api/auth/2fa/email-otp/verify-setup
 * @access Private
 */
exports.verifyAndEnableEmailOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp || !emailOTPService.isValidOTPFormat(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP format. Provide 6-digit code.",
      });
    }

    console.log("📧 [verifyAndEnableEmailOTP] incoming request", { authHeader: !!req.headers.authorization });
    console.log("📧 [verifyAndEnableEmailOTP] req.user present:", req.user ? { id: req.user._id, email: req.user.email } : null);

    const user = await User.findById(req.user._id);

    if (!user || !user.emailOTP || !user.emailOTP.code) {
      return res.status(400).json({
        success: false,
        message: "Email OTP setup not initiated. Call /setup first.",
      });
    }

    // Check if OTP has expired
    if (emailOTPService.isOTPExpired(user.emailOTP.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Request a new one.",
      });
    }

    // Verify OTP
    const verification = emailOTPService.verifyOTP(
      otp,
      user.emailOTP.code,
      user.emailOTP.expiresAt
    );

    if (!verification.valid) {
      // Increment attempts
      user.emailOTP.attempts = (user.emailOTP.attempts || 0) + 1;
      await user.save();

      if (user.emailOTP.attempts >= emailOTPService.getMaxOTPAttempts()) {
        return res.status(400).json({
          success: false,
          message: "Max OTP attempts exceeded. Request a new OTP.",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
        data: {
          attemptsRemaining: emailOTPService.getMaxOTPAttempts() - user.emailOTP.attempts,
        },
      });
    }

    // Enable email OTP
    user.emailOTP = {
      enabled: true,
      code: null,
      expiresAt: null,
      attempts: 0,
      maxAttempts: emailOTPService.getMaxOTPAttempts(),
      lastSentAt: user.emailOTP.lastSentAt,
      enabledAt: new Date(),
    };
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email OTP enabled successfully",
      data: {
        email: user.email,
        enabled: true,
        enabledAt: user.emailOTP.enabledAt,
      },
    });
  } catch (error) {
    console.error("Email OTP verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify email OTP",
      error: error.message,
    });
  }
};

/**
 * @desc Verify email OTP during login
 * @route POST /api/auth/2fa/email-otp/verify
 * @access Public (but requires userId)
 */
exports.verifyEmailOTPToken = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: "User ID and OTP are required",
      });
    }

    if (!emailOTPService.isValidOTPFormat(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP format. Provide 6-digit code.",
      });
    }

    console.log("📧 [verifyEmailOTPToken] incoming request", { authHeader: !!req.headers.authorization, bodyUserId: userId });
    // Try to resolve user from Authorization token if present, otherwise fall back to userId in body
    let user = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userIdFromToken = decoded.id || decoded._id || decoded.userId || decoded.user?.id;
        if (userIdFromToken) {
          user = await User.findById(userIdFromToken);
        }
      } catch (err) {
        // ignore token errors here - we'll fall back to userId in body
        console.log("Auth token ignored for email OTP verify (login flow):", err.message);
      }
    }

    if (!user) {
      user = await User.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Ensure an OTP was issued and is present in DB
    if (!user.emailOTP || !user.emailOTP.code || !user.emailOTP.expiresAt) {
      return res.status(400).json({
        success: false,
        message: "No active OTP for this user. Request a new code.",
      });
    }

    // Verify OTP using service
    const verification = emailOTPService.verifyOTP(
      otp,
      user.emailOTP.code,
      user.emailOTP.expiresAt
    );

    if (!verification.valid) {
      // Increment attempts and save
      user.emailOTP.attempts = (user.emailOTP.attempts || 0) + 1;
      await user.save();

      if (user.emailOTP.attempts >= emailOTPService.getMaxOTPAttempts()) {
        return res.status(400).json({
          success: false,
          message: "Max OTP attempts exceeded. Request a new OTP.",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
        data: {
          attemptsRemaining: emailOTPService.getMaxOTPAttempts() - user.emailOTP.attempts,
        },
      });
    }

    // OTP valid - clear temporary OTP fields (keep emailOTP.enabled as-is)
    user.emailOTP.code = null;
    user.emailOTP.expiresAt = null;
    user.emailOTP.attempts = 0;
    await user.save();

    const jwt = require("jsonwebtoken");

    // Generate auth token
    const userRole = "user"; // Email OTP is only for citizens
    const tokenPayload = {
      id: user._id,
      role: userRole,
      ward: user.ward,
    };
    const authToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "7d" });

    console.log("✅ Email OTP verification successful:", { email: user.email, role: userRole });

    // Build response
    const responseData = {
      token: authToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: userRole,
        createdAt: user.createdAt,
      },
    };

    if (user.ward) responseData.user.ward = user.ward;

    return res.status(200).json({ success: true, message: "Email OTP verified", data: responseData });
  } catch (error) {
    console.error("Email OTP verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify email OTP",
      error: error.message,
    });
  }
};

/**
 * @desc Resend email OTP
 * @route POST /api/auth/2fa/email-otp/resend (authenticated)
 * @route POST /api/auth/2fa/email-otp/resend-login (during login with userId)
 * @access Private/Public
 */
exports.resendEmailOTP = async (req, res) => {
  try {
    let user;
    
    // Check if authenticated (has req.user from middleware)
    if (req.user?._id) {
      user = await User.findById(req.user._id);
    } else {
      // For login flow, userId should be in body
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }
      user = await User.findById(userId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate new OTP
    const otp = emailOTPService.generateOTP();
    const hashedOTP = emailOTPService.hashOTP(otp);
    const expiresAt = emailOTPService.calculateOTPExpiration();

    // Update OTP in database
    user.emailOTP = {
      ...user.emailOTP,
      code: hashedOTP,
      expiresAt: expiresAt,
      attempts: 0,
      lastSentAt: new Date(),
    };
    await user.save();

    // Send OTP via email
    const emailResult = await emailOTPService.sendOTPEmail(
      user.email,
      user.name,
      otp
    );

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email",
        error: emailResult.error,
      });
    }

    // If this resend was part of a login flow (no authenticated req.user), return a short-lived setup token
    const jwt = require('jsonwebtoken');
    const responseData = {
      email: user.email,
      validityMinutes: emailOTPService.getOTPValidityMinutes(),
    };

    if (!req.user) {
      // Issue a temporary setup token so the frontend can use it to verify the OTP
      const setupToken = jwt.sign({ id: user._id, email: user.email, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '15m' });
      responseData.setupToken = setupToken;
    }

    res.status(200).json({
      success: true,
      message: "OTP resent successfully. Check your email.",
      data: responseData,
    });
  } catch (error) {
    console.error("Email OTP resend error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend email OTP",
      error: error.message,
    });
  }
};

/**
 * @desc Get email OTP status
 * @route GET /api/auth/2fa/email-otp/status
 * @access Private
 */
exports.getEmailOTPStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const status = {
      enabled: emailOTPService.isEmailOTPEnabled(user),
      enabledAt: user.emailOTP?.enabledAt || null,
      lastSentAt: user.emailOTP?.lastSentAt || null,
    };

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Email OTP status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch email OTP status",
      error: error.message,
    });
  }
};

/**
 * @desc Disable email OTP
 * @route POST /api/auth/2fa/email-otp/disable
 * @access Private
 */
exports.disableEmailOTP = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required to disable email OTP",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify password
    const passwordMatch = await user.matchPassword(password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    if (!emailOTPService.isEmailOTPEnabled(user)) {
      return res.status(400).json({
        success: false,
        message: "Email OTP is not enabled",
      });
    }

    // Disable email OTP
    user.emailOTP = {
      enabled: false,
      code: null,
      expiresAt: null,
      attempts: 0,
      maxAttempts: emailOTPService.getMaxOTPAttempts(),
      lastSentAt: null,
      enabledAt: null,
    };
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email OTP disabled successfully",
    });
  } catch (error) {
    console.error("Email OTP disable error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to disable email OTP",
      error: error.message,
    });
  }
};

module.exports = exports;
