const express = require("express");
const {
  setup2FA,
  verifyAndEnable2FA,
  verify2FAToken,
  disable2FA,
  get2FAStatus,
  regenerateBackupCodes,
  setupEmailOTP,
  verifyAndEnableEmailOTP,
  verifyEmailOTPToken,
  resendEmailOTP,
  getEmailOTPStatus,
  disableEmailOTP,
} = require("../controllers/twoFactorAuthController");
const { authenticateUser } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Two-Factor Authentication Routes
 * Provides TOTP and Email OTP setup, verification, and management
 * Zero-Regression Strategy: New routes, extends authentication system
 */

/**
 * GET /api/auth/2fa/status
 * Get TOTP 2FA status for current user
 * @access Private
 */
router.get("/status", authenticateUser, get2FAStatus);

/**
 * POST /api/auth/2fa/setup
 * Initialize TOTP 2FA setup (generates secret and QR code)
 * @access Private
 */
router.post("/setup", authenticateUser, setup2FA);

/**
 * POST /api/auth/2fa/verify-setup
 * Verify TOTP token and enable 2FA
 * @access Private
 */
router.post("/verify-setup", authenticateUser, verifyAndEnable2FA);

/**
 * POST /api/auth/2fa/verify
 * Verify TOTP token during login
 * @access Public (but requires userId)
 */
router.post("/verify", verify2FAToken);

/**
 * POST /api/auth/2fa/disable
 * Disable TOTP 2FA (requires password and token)
 * @access Private
 */
router.post("/disable", authenticateUser, disable2FA);

/**
 * POST /api/auth/2fa/regenerate-backup-codes
 * Regenerate TOTP backup codes
 * @access Private
 */
router.post("/regenerate-backup-codes", authenticateUser, regenerateBackupCodes);

// ============================================================
// EMAIL OTP ROUTES (Alternative 2FA Method)
// ============================================================

/**
 * POST /api/auth/2fa/email-otp/setup
 * Initialize email OTP setup (generates and sends OTP)
 * @access Private
 */
router.post("/email-otp/setup", authenticateUser, setupEmailOTP);

/**
 * POST /api/auth/2fa/email-otp/verify-setup
 * Verify email OTP and enable email OTP method
 * @access Private
 */
router.post("/email-otp/verify-setup", authenticateUser, verifyAndEnableEmailOTP);

/**
 * POST /api/auth/2fa/email-otp/verify
 * Verify email OTP during login
 * @access Public (but requires userId)
 */
router.post("/email-otp/verify", verifyEmailOTPToken);

/**
 * POST /api/auth/2fa/email-otp/resend
 * Resend email OTP code
 * @access Private (authenticated)
 */
router.post("/email-otp/resend", authenticateUser, resendEmailOTP);

/**
 * POST /api/auth/2fa/email-otp/resend-login
 * Resend email OTP during login (public, requires userId)
 * @access Public (but requires userId)
 */
router.post("/email-otp/resend-login", resendEmailOTP);

/**
 * GET /api/auth/2fa/email-otp/status
 * Get email OTP status for current user
 * @access Private
 */
router.get("/email-otp/status", authenticateUser, getEmailOTPStatus);

/**
 * POST /api/auth/2fa/email-otp/disable
 * Disable email OTP (requires password)
 * @access Private
 */
router.post("/email-otp/disable", authenticateUser, disableEmailOTP);

module.exports = router;
