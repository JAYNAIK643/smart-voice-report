const mongoose = require("mongoose");
const User = require("./src/models/User");
const Grievance = require("./src/models/Grievance");
const dotenv = require("dotenv");

dotenv.config();

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/grievance_db")
  .then(async () => {
    console.log("Connected to MongoDB");
    
    const grievances = await Grievance.find({ ward: { $exists: false } });
    console.log(`Found ${grievances.length} grievances without ward field.`);
    
    for (const g of grievances) {
      const user = await User.findById(g.userId);
      if (user) {
        g.ward = user.ward || "Ward 1";
        await g.save();
        console.log(`Updated grievance ${g.complaintId} with ward ${g.ward}`);
      } else {
        g.ward = "Ward 1"; // Fallback
        await g.save();
        console.log(`Updated grievance ${g.complaintId} with fallback Ward 1 (user not found)`);
      }
    }
    
    // Also randomly distribute some grievances to other wards for testing charts
    const allGrievances = await Grievance.find({});
    const wards = ["Ward 1", "Ward 2", "Ward 3", "Ward 4", "Ward 5"];
    
    console.log("Randomly distributing grievances to wards for better visualization...");
    for (let i = 0; i < allGrievances.length; i++) {
        const g = allGrievances[i];
        g.ward = wards[i % wards.length];
        await g.save();
        console.log(`Assigned ${g.complaintId} to ${g.ward}`);
    }
    
    console.log("Migration complete!");
    process.exit(0);
  })
  .catch(err => {
    console.error("Connection error:", err);
    process.exit(1);
  });
