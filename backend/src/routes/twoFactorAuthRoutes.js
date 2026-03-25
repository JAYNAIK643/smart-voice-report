const express = require("express");
const {
  setup2FA,
  verifyAndEnable2FA,
  verify2FAToken,
  disable2FA,
  get2FAStatus,
  regenerateBackupCodes,
} = require("../controllers/twoFactorAuthController");
const { authenticateUser } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Two-Factor Authentication Routes
 * Provides 2FA setup, verification, and management
 * Zero-Regression Strategy: New routes, extends authentication system
 */

/**
 * GET /api/auth/2fa/status
 * Get 2FA status for current user
 * @access Private
 */
router.get("/status", authenticateUser, get2FAStatus);

/**
 * POST /api/auth/2fa/setup
 * Initialize 2FA setup (generates secret and QR code)
 * @access Private
 */
router.post("/setup", authenticateUser, setup2FA);

/**
 * POST /api/auth/2fa/verify-setup
 * Verify token and enable 2FA
 * @access Private
 */
router.post("/verify-setup", authenticateUser, verifyAndEnable2FA);

/**
 * POST /api/auth/2fa/verify
 * Verify 2FA token during login
 * @access Public (but requires userId)
 */
router.post("/verify", verify2FAToken);

/**
 * POST /api/auth/2fa/disable
 * Disable 2FA (requires password and token)
 * @access Private
 */
router.post("/disable", authenticateUser, disable2FA);

/**
 * POST /api/auth/2fa/regenerate-backup-codes
 * Regenerate backup codes
 * @access Private
 */
router.post("/regenerate-backup-codes", authenticateUser, regenerateBackupCodes);

module.exports = router;
