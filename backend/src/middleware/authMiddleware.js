const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");
const WardAdmin = require("../models/WardAdmin");

const extractTokenIdentity = (decoded = {}) => {
  // Support current and legacy token payload formats
  const nestedUser = decoded.user || {};
  const candidateId =
    decoded.id ||
    decoded._id ||
    decoded.userId ||
    decoded.adminId ||
    decoded.wardAdminId ||
    nestedUser.id ||
    nestedUser._id ||
    null;

  const candidateEmail = decoded.email || nestedUser.email || null;

  return { id: candidateId, email: candidateEmail };
};

/**
 * Middleware to authenticate user via JWT
 * Checks all three collections: Admin, WardAdmin, and User
 */
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authorization token missing" });
  }

  const token = authHeader.split(" ")[1];
  console.log("🔐 Auth header received, token extracted:", !!token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const normalizedRole = String(decoded.role || "").toLowerCase();
    const { id: decodedId, email: decodedEmail } = extractTokenIdentity(decoded);
    console.log("✅ Token verified successfully");
    console.log("🔐 Decoded token role:", decoded.role);
    console.log("🔐 Decoded token id:", decodedId);
    console.log("🔐 Decoded token email:", decodedEmail);
    
    let user = null;
    const idLookup = decodedId ? { _id: decodedId } : null;
    const emailLookup = decodedEmail ? { email: decodedEmail.toLowerCase() } : null;
    const lookup = idLookup || emailLookup;

    if (!lookup) {
      return res.status(401).json({ success: false, message: "Invalid token payload" });
    }

    // Check appropriate collection based on role in token
    if (normalizedRole === "admin") {
      if (idLookup) {
        user = await Admin.findOne(idLookup).select("-password");
        console.log("🔎 Admin lookup by id:", user ? "found" : "not found");
      }
      if (!user && emailLookup) {
        user = await Admin.findOne(emailLookup).select("-password");
        console.log("🔎 Admin lookup by email:", user ? "found" : "not found");
      }
      console.log("🔎 Admin fetched from DB:", user ? { id: user._id, email: user.email, role: user.role } : null);
      if (!user) {
        console.log("❌ Admin not found reason:", {
          decodedId,
          decodedEmail,
          triedIdLookup: !!idLookup,
          triedEmailLookup: !!emailLookup,
        });
        return res.status(401).json({ success: false, message: "Admin not found" });
      }
      if (!user.role) {
        user.role = "admin";
      }
    } else if (normalizedRole === "ward_admin") {
      user = await WardAdmin.findOne(lookup).select("-password");
      if (!user) {
        return res.status(401).json({ success: false, message: "Ward Admin not found" });
      }
      if (!user.role) {
        user.role = "ward_admin";
      }
    } else {
      // Default to User collection for citizens
      user = await User.findOne(lookup).select("-password");
      if (!user) {
        return res.status(401).json({ success: false, message: "User not found" });
      }
      // Explicitly set role for users since User model doesn't have role field
      user.role = "user";
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is disabled. Please contact administrator." });
    }

    req.user = user;
    req.user.decoded = {
      id: decodedId,
      email: decodedEmail,
      role: normalizedRole,
    };
    req.authRole = normalizedRole;
    console.log("👤 req.user:", req.user ? { id: req.user._id, email: req.user.email, role: req.user.role } : null);
    console.log("👤 req.user.id:", req.user?.id || req.user?._id);
    next();
  } catch (error) {
    console.log("❌ Token verification failed:", error.message);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

/**
 * Middleware to authorize specific roles
 * @param {Array} allowedRoles - Array of roles allowed to access the route
 */
const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    const normalizedAllowedRoles = allowedRoles.map((role) => String(role).toLowerCase());
    const effectiveRole = String(req.user?.role || req.authRole || "").toLowerCase();

    if (!req.user || !normalizedAllowedRoles.includes(effectiveRole)) {
      return res.status(403).json({ 
        success: false, 
        message: `Role (${req.user?.role || req.authRole}) is not authorized to access this resource` 
      });
    }
    next();
  };
};

/**
 * Middleware to authorize ward access for ward_admin
 * Ensures ward_admin can only access data belonging to their assigned ward
 */
const authorizeWardAccess = (req, res, next) => {
  if (req.user.role === "admin") {
    // Super Admin has access to all wards
    return next();
  }

  if (req.user.role === "ward_admin") {
    // Check various sources for ward identification (ward or wardId)
    const targetWard = req.params.ward || req.query.ward || req.body.ward || 
                       req.params.wardId || req.query.wardId || req.body.wardId;
    
    // If a ward is specified in request, it must match user's ward
    if (targetWard && targetWard !== req.user.ward) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: You do not have access to data for ${targetWard}` 
      });
    }
    
    // For single grievance updates, the check happens in the controller
    // but we can inject the ward into the request for filtering
    req.wardFilter = req.user.ward;
    return next();
  }

  // Citizens don't have ward-based access (they have owner-based access)
  next();
};

// Keep old names for backward compatibility if needed, but exports the new ones
module.exports = { 
  authenticateUser, 
  authorizeRoles, 
  authorizeWardAccess,
  authMiddleware: authenticateUser, // backward compatibility
  requireAdmin: authorizeRoles(["admin"]) // backward compatibility
};
