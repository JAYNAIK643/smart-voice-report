const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("❌ MONGO_URI is not set in environment variables.");
    console.error("   Set MONGO_URI in your .env file (local) or Render Dashboard → Environment (production).");
    console.error("   Format: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>");
    throw new Error("MONGO_URI is not set in environment variables");
  }

  // Warn if using localhost on a likely production environment
  const isLocalhost = uri.includes("localhost") || uri.includes("127.0.0.1");
  if (isLocalhost && (process.env.NODE_ENV === "production" || process.env.RENDER === "true" || process.env.RENDER_SERVICE_ID)) {
    console.error("❌ MONGO_URI is set to localhost but this appears to be a production deployment.");
    console.error("   Production servers cannot connect to localhost MongoDB.");
    console.error("   Set MONGO_URI to your MongoDB Atlas connection string in Render Dashboard → Environment.");
    console.error("   Atlas format: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>");
    throw new Error("MONGO_URI points to localhost in production. Set it to MongoDB Atlas URI.");
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(uri);
    const host = mongoose.connection.host;
    const dbName = mongoose.connection.name;
    console.log(`✅ MongoDB connected to: ${host}/${dbName}`);
    if (isLocalhost) {
      console.log("   ⚠️  Using LOCAL MongoDB. Data will NOT persist to production (Atlas).");
    } else {
      console.log("   ✅ Using remote MongoDB (Atlas). Data will persist in production.");
    }
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    if (error.message.includes("ECONNREFUSED")) {
      console.error("   → MongoDB is not running at the configured URI.");
      if (isLocalhost) {
        console.error("   → Start MongoDB locally, or set MONGO_URI to a MongoDB Atlas connection string.");
      } else {
        console.error("   → Check that your Atlas cluster is running and IP whitelist includes 0.0.0.0/0 (or Render's IP).");
      }
    }
    if (error.message.includes("bad auth") || error.message.includes("Authentication failed")) {
      console.error("   → MongoDB Atlas credentials in MONGO_URI are incorrect.");
      console.error("   → Verify username and password in the connection string.");
    }
    throw error;
  }
};

module.exports = connectDB;
