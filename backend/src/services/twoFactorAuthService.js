const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

/**
 * Two-Factor Authentication Service
 * Handles TOTP generation, verification, and QR code creation
 * Zero-Regression Strategy: New service, extends authentication system
 */

/**
 * Generate a new 2FA secret for a user
 * @param {string} userEmail - User's email address
 * @returns {Object} Secret object with ascii, hex, base32, and otpauth_url
 */
exports.generateSecret = (userEmail) => {
  const secret = speakeasy.generateSecret({
    name: `SmartCity GRS (${userEmail})`,
    issuer: "SmartCity",
    length: 32,
  });

  return {
    ascii: secret.ascii,
    hex: secret.hex,
    base32: secret.base32,
    otpauth_url: secret.otpauth_url,
  };
};

/**
 * Generate QR code image data URL from secret
 * @param {string} otpauthUrl - The otpauth:// URL from secret generation
 * @returns {Promise<string>} Data URL of QR code image
 */
exports.generateQRCode = async (otpauthUrl) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);
    return qrCodeDataURL;
  } catch (error) {
    console.error("QR Code generation error:", error);
    throw new Error("Failed to generate QR code");
  }
};

/**
 * Verify a TOTP token against a secret
 * @param {string} token - 6-digit token from authenticator app
 * @param {string} secret - User's base32 encoded secret
 * @param {number} window - Time window for token validation (default: 2)
 * @returns {boolean} True if token is valid
 */
exports.verifyToken = (token, secret, window = 2) => {
  try {
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: window, // Allow 2 time steps before and after
    });

    return verified;
  } catch (error) {
    console.error("Token verification error:", error);
    return false;
  }
};

/**
 * Generate backup codes for account recovery
 * @param {number} count - Number of backup codes to generate (default: 10)
 * @returns {Array<string>} Array of backup codes
 */
exports.generateBackupCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes
    const code = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();
    codes.push(code);
  }
  return codes;
};

/**
 * Hash a backup code for secure storage
 * @param {string} code - Plain text backup code
 * @returns {string} Hashed backup code
 */
exports.hashBackupCode = (code) => {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(code).digest("hex");
};

/**
 * Verify a backup code against stored hash
 * @param {string} code - Plain text backup code from user
 * @param {string} hash - Stored hash to verify against
 * @returns {boolean} True if code matches hash
 */
exports.verifyBackupCode = (code, hash) => {
  const hashedInput = exports.hashBackupCode(code);
  return hashedInput === hash;
};

/**
 * Check if user has 2FA enabled
 * @param {Object} user - User object from database
 * @returns {boolean} True if 2FA is already enabled
 */
exports.is2FAEnabled = (user) => {
  return user.twoFactorAuth && user.twoFactorAuth.enabled === true;
};

/**
 * Check if 2FA token is required for login
 * @param {Object} user - User object from database
 * @returns {boolean} True if 2FA is enabled and required
 * 
 * MANDATORY 2FA ENFORCEMENT:
 * Returns true to enforce 2FA for ALL users during login
 * This ensures 2FA is required every time, regardless of previous sessions
 */
exports.is2FARequired = (user) => {
  // ALWAYS require 2FA for all users on every login attempt
  // This enforces mandatory 2FA as per security requirements
  console.log("🔐 2FA Required check:", { 
    userId: user._id, 
    email: user.email,
    twoFactorAuth: user.twoFactorAuth,
    enabled: user.twoFactorAuth?.enabled 
  });
  return true;
};

/**
 * Validate 2FA setup completion
 * @param {Object} user - User object
 * @param {string} token - Verification token from user
 * @returns {boolean} True if setup is valid
 */
exports.validateSetup = (user, token) => {
  if (!user.twoFactorAuth || !user.twoFactorAuth.tempSecret) {
    return false;
  }

  return exports.verifyToken(token, user.twoFactorAuth.tempSecret);
};

module.exports = exports;
