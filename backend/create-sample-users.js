const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");
const dotenv = require("dotenv");

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/grievance_db", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

// Sample ward admin users data
const wardAdmins = [
  {
    name: "Wagholi Ward Admin",
    email: "wagholi.admin@example.com",
    password: "Wagholi@123",
    role: "ward_admin",
    ward: "Ward 1",
    phone: "+91 98765 00001"
  },
  {
    name: "Kharadi Ward Admin",
    email: "kharadi.admin@example.com",
    password: "Kharadi@123",
    role: "ward_admin",
    ward: "Ward 2",
    phone: "+91 98765 00002"
  },
  {
    name: "Hadapsar Ward Admin",
    email: "hadapsar.admin@example.com",
    password: "Hadapsar@123",
    role: "ward_admin",
    ward: "Ward 3",
    phone: "+91 98765 00003"
  },
  {
    name: "Baner Ward Admin",
    email: "baner.admin@example.com",
    password: "Baner@123",
    role: "ward_admin",
    ward: "Ward 4",
    phone: "+91 98765 00004"
  },
  {
    name: "Hinjewadi Ward Admin",
    email: "hinjewadi.admin@example.com",
    password: "Hinjewadi@123",
    role: "ward_admin",
    ward: "Ward 5",
    phone: "+91 98765 00005"
  },
  // TEST ACCOUNT for frontend test buttons
  {
    name: "Test Ward Admin",
    email: "wardadmin@smartcity.gov",
    password: "wardtest123",
    role: "ward_admin",
    ward: "Ward 1",
    phone: "+91 98765 99999"
  }
];

async function createSampleWardAdmins() {
  try {
    console.log("Creating sample ward admin users...");
    
    // Clear existing ward_admin users to avoid duplicates
    await User.deleteMany({ role: "ward_admin" });
    console.log("Cleared existing ward admin users");
    
    // Create new ward admin users
    for (const adminData of wardAdmins) {
      const hashedPassword = await bcrypt.hash(adminData.password, 10);
      
      const user = new User({
        name: adminData.name,
        email: adminData.email,
        password: hashedPassword,
        role: adminData.role,
        ward: adminData.ward,
        phone: adminData.phone
      });
      
      await user.save();
      console.log(`✓ Created ${adminData.name} (${adminData.ward})`);
    }
    
    console.log("\n✅ All sample ward admin users created successfully!");
    console.log("\nLogin credentials:");
    wardAdmins.forEach(admin => {
      console.log(`${admin.ward}: ${admin.email} / ${admin.password}`);
    });
    
    // Also create a super admin user
    const superAdminExists = await User.findOne({ email: "admin@example.com" });
    if (!superAdminExists) {
      const adminPassword = await bcrypt.hash("Admin@123", 10);
      const superAdmin = new User({
        name: "City Administrator",
        email: "admin@example.com",
        password: adminPassword,
        role: "admin",
        ward: "Ward 1"
      });
      await superAdmin.save();
      console.log("\n✓ Created Super Admin: admin@example.com / Admin@123");
    }
    
    // Create TEST super admin for frontend test buttons
    const testAdminExists = await User.findOne({ email: "admin@smartcity.gov" });
    if (!testAdminExists) {
      const testAdminPassword = await bcrypt.hash("admintest123", 10);
      const testAdmin = new User({
        name: "Test Admin",
        email: "admin@smartcity.gov",
        password: testAdminPassword,
        role: "admin",
        ward: "Ward 1"
      });
      await testAdmin.save();
      console.log("\n✓ Created TEST Admin: admin@smartcity.gov / admintest123");
    }
    
    mongoose.connection.close();
    console.log("\nDatabase connection closed.");
    
  } catch (error) {
    console.error("Error creating sample users:", error);
    mongoose.connection.close();
  }
}

// Run the function
createSampleWardAdmins();
