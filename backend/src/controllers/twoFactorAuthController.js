const User = require("../models/User");
const twoFactorAuthService = require("../services/twoFactorAuthService");

/**
 * Two-Factor Authentication Controller
 * Handles 2FA setup, verification, and management
 * Zero-Regression Strategy: New controller, extends authentication system
 */

/**
 * @desc Initialize 2FA setup for user
 * @route POST /api/auth/2fa/setup
 * @access Private
 */
exports.setup2FA = async (req, res) => {
  try {
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

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
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

module.exports = exports;
