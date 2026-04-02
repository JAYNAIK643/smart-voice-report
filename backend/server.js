const dotenv = require("dotenv");
dotenv.config();

const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 3000;
// Listen on all network interfaces (0.0.0.0) to allow mobile device connections
const HOST = process.env.HOST || "0.0.0.0";

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, HOST, () => {
      console.log(`✅ Server running on http://${HOST}:${PORT}`);
      console.log(`📱 Mobile devices can connect using your local IP: http://<YOUR_IP>:${PORT}`);
      console.log(`💻 Local access: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
