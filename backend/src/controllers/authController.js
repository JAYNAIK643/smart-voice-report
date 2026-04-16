const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");
const WardAdmin = require("../models/WardAdmin");
const twoFactorAuthService = require("../services/twoFactorAuthService");

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }

    // Password validation: 10-12 characters, must contain alphabets and numbers
    if (password.length < 10 || password.length > 12) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must be between 10 to 12 characters" 
      });
    }

    const hasAlphabet = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasAlphabet || !hasNumber) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must contain both alphabets and numbers" 
      });
    }

    // Prevent using email as password
    const emailUsername = email.split('@')[0].toLowerCase();
    if (password.toLowerCase().includes(emailUsername) || password.toLowerCase().includes(email.toLowerCase())) {
      return res.status(400).json({ 
        success: false, 
        message: "Password cannot contain your email address" 
      });
    }

    // Check if email already exists in ANY collection
    const existingUser = await User.findOne({ email });
    const existingAdmin = await Admin.findOne({ email });
    const existingWardAdmin = await WardAdmin.findOne({ email });

    if (existingUser || existingAdmin || existingWardAdmin) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    // Create new citizen user (role not needed - users collection is only for citizens)
    const user = await User.create({
      name,
      email,
      password,
    });

    // Create JWT token with the user role
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: "user",  // Since we're registering a citizen user
      ward: user.ward
    };
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: "user",
          ward: user.ward,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    let user = null;
    let userRole = null;
    let collectionSource = null;

    // Search order: admins → ward_admins → users
    const admin = await Admin.findOne({ email });
    if (admin) {
      user = admin;
      userRole = "admin";
      collectionSource = "admins";
    }

    if (!user) {
      const wardAdmin = await WardAdmin.findOne({ email });
      if (wardAdmin) {
        user = wardAdmin;
        userRole = "ward_admin";
        collectionSource = "ward_admins";
      }
    }

    if (!user) {
      const citizen = await User.findOne({ email });
      if (citizen) {
        user = citizen;
        userRole = "user";
        collectionSource = "users";
      }
    }

    // User not found in any collection
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is disabled. Please contact administrator." });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Role-based access control
    if (role === "admin" && userRole !== "admin" && userRole !== "ward_admin") {
      return res.status(403).json({ success: false, message: "Access denied. Management credentials required." });
    }

    if (role === "user" && (userRole === "admin" || userRole === "ward_admin")) {
      return res.status(403).json({ success: false, message: "Please use admin login portal." });
    }

    // Check if 2FA is required (only for citizens - User collection)
    if (userRole === "user" && twoFactorAuthService.is2FARequired(user)) {
      // Check if user has 2FA enabled
      const has2FAEnabled = twoFactorAuthService.is2FAEnabled(user);
      
      if (!has2FAEnabled) {
        // User needs to set up 2FA - issue a temporary setup token
        const setupToken = jwt.sign(
          { id: user._id, email: user.email, role: userRole, setup2FA: true },
          process.env.JWT_SECRET,
          { expiresIn: "15m" } // Short expiry for setup token
        );
        
        return res.status(200).json({
          success: true,
          requiresTwoFactor: true,
          needs2FASetup: true,
          message: "2FA setup required",
          data: {
            userId: user._id,
            email: user.email,
            setupToken: setupToken // Temporary token for 2FA setup only
          },
        });
      }
      
      // User has 2FA enabled - require verification
      return res.status(200).json({
        success: true,
        requiresTwoFactor: true,
        needs2FASetup: false,
        message: "2FA verification required",
        data: {
          userId: user._id,
          email: user.email,
        },
      });
    }

    // Create JWT token with the determined role
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: userRole,
      ward: user.ward
    };
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Build response based on user type
    const responseData = {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: userRole, // Always include role
        createdAt: user.createdAt,
      },
    };

    console.log('🔐 Login successful:', { 
      userId: user._id, 
      email: user.email, 
      role: userRole,
      hasToken: !!token 
    });

    // Add ward for ward_admin
    if (userRole === "ward_admin") {
      responseData.user.ward = user.ward;
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: responseData,
    });
  } catch (error) {
    console.error("Login error:", error);
    next(error);
  }
};