/**
 * Migration Script: Separate Users, Admins, and Ward Admins
 * 
 * This script:
 * 1. Creates 'admins' and 'ward_admins' collections
 * 2. Migrates admin accounts from 'users' → 'admins'
 * 3. Migrates ward_admin accounts from 'users' → 'ward_admins'
 * 4. Removes migrated accounts from 'users' collection
 * 
 * IMPORTANT: Run this ONCE after deploying new models
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

// Import OLD User model (before role removal)
const OldUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  ward: String,
  complaintsSubmitted: Number,
  complaintsResolved: Number,
  upvotesReceived: Number,
  upvotesGiven: Number,
  badges: Array,
  totalScore: Number,
  isActive: Boolean,
  createdAt: Date,
});

const OldUser = mongoose.model("OldUser", OldUserSchema, "users");

// Import NEW models
const Admin = require("./src/models/Admin");
const WardAdmin = require("./src/models/WardAdmin");
const User = require("./src/models/User");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/grievance_db")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

async function migrateCollections() {
  try {
    console.log("\n🚀 Starting migration...\n");

    // Step 1: Find all admins in users collection
    const adminUsers = await OldUser.find({ role: "admin" });
    console.log(`📊 Found ${adminUsers.length} admin(s) to migrate`);

    let adminsMigrated = 0;
    for (const adminUser of adminUsers) {
      // Check if already exists in admins collection
      const existingAdmin = await Admin.findOne({ email: adminUser.email });
      if (existingAdmin) {
        console.log(`⚠️  Admin already exists: ${adminUser.email}`);
        continue;
      }

      // Create new admin (password already hashed, skip pre-save hook)
      const admin = new Admin({
        name: adminUser.name,
        email: adminUser.email,
        password: adminUser.password,
        isActive: adminUser.isActive !== undefined ? adminUser.isActive : true,
        createdAt: adminUser.createdAt,
      });

      // Save without running pre-save hook (password already hashed)
      await admin.save({ validateBeforeSave: false });
      adminsMigrated++;
      console.log(`✓ Migrated admin: ${adminUser.email}`);
    }

    // Step 2: Find all ward_admins in users collection
    const wardAdminUsers = await OldUser.find({ role: "ward_admin" });
    console.log(`\n📊 Found ${wardAdminUsers.length} ward admin(s) to migrate`);

    let wardAdminsMigrated = 0;
    for (const wardAdminUser of wardAdminUsers) {
      // Check if already exists in ward_admins collection
      const existingWardAdmin = await WardAdmin.findOne({
        email: wardAdminUser.email,
      });
      if (existingWardAdmin) {
        console.log(`⚠️  Ward Admin already exists: ${wardAdminUser.email}`);
        continue;
      }

      // Create new ward admin (password already hashed)
      const wardAdmin = new WardAdmin({
        name: wardAdminUser.name,
        email: wardAdminUser.email,
        password: wardAdminUser.password,
        ward: wardAdminUser.ward,
        isActive: wardAdminUser.isActive !== undefined ? wardAdminUser.isActive : true,
        createdAt: wardAdminUser.createdAt,
      });

      // Save without running pre-save hook
      await wardAdmin.save({ validateBeforeSave: false });
      wardAdminsMigrated++;
      console.log(`✓ Migrated ward admin: ${wardAdminUser.email} (${wardAdminUser.ward})`);
    }

    // Step 3: Remove migrated accounts from users collection
    console.log("\n🗑️  Removing migrated accounts from users collection...");
    
    const adminEmails = adminUsers.map(u => u.email);
    const wardAdminEmails = wardAdminUsers.map(u => u.email);
    const allMigratedEmails = [...adminEmails, ...wardAdminEmails];

    if (allMigratedEmails.length > 0) {
      const deleteResult = await OldUser.deleteMany({
        email: { $in: allMigratedEmails },
      });
      console.log(`✓ Removed ${deleteResult.deletedCount} account(s) from users collection`);
    }

    // Step 4: Summary
    console.log("\n" + "=".repeat(50));
    console.log("📋 MIGRATION SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Admins migrated: ${adminsMigrated}`);
    console.log(`✅ Ward Admins migrated: ${wardAdminsMigrated}`);
    console.log(`✅ Accounts removed from users: ${allMigratedEmails.length}`);
    console.log("=".repeat(50));

    // Verify collections
    const totalAdmins = await Admin.countDocuments();
    const totalWardAdmins = await WardAdmin.countDocuments();
    const totalUsers = await User.countDocuments();

    console.log("\n📊 CURRENT COLLECTION COUNTS:");
    console.log(`   Admins: ${totalAdmins}`);
    console.log(`   Ward Admins: ${totalWardAdmins}`);
    console.log(`   Citizens: ${totalUsers}`);

    console.log("\n✅ Migration completed successfully!\n");
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    mongoose.connection.close();
    process.exit(1);
  }
}

// Run migration
migrateCollections();
