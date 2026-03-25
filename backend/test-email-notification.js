const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Models
const User = require('./src/models/User');
const Grievance = require('./src/models/Grievance');

// Connect to database
mongoose.connect(process.env.MONGO_URI);

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

async function testEmailNotification() {
  try {
    console.log('🔍 Testing Email Notification System...\n');
    
    // Find a test user
    const user = await User.findOne({ email: 'test2fa@example.com' });
    if (!user) {
      console.log('❌ Test user not found');
      return;
    }
    
    console.log(`✅ Found user: ${user.email}`);
    console.log(`   2FA Enabled: ${user.is2FAEnabled}`);
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role,
        is2FAVerified: true 
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    console.log(`🔐 Generated JWT Token: ${token.substring(0, 20)}...\n`);
    
    // Mock request object
    const req = {
      user: { id: user._id.toString() },
      body: {
        title: 'Test Complaint - Email Notification Test',
        description: 'This is a test complaint to verify email notifications are working properly.',
        category: 'Roads and Infrastructure',
        location: 'Test Location, Mumbai',
        priority: 'medium',
        ward: 'Ward 1',
        anonymous: false
      },
      headers: {
        authorization: `Bearer ${token}`
      }
    };
    
    // Mock response object
    const res = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.data = data;
        console.log(`\n📡 Response Status: ${this.statusCode}`);
        console.log(`📊 Response Data:`, JSON.stringify(data, null, 2));
        return this;
      }
    };
    
    // Mock next function
    const next = function(err) {
      console.log('❌ Error in middleware:', err);
    };
    
    console.log('📝 Submitting test complaint...');
    console.log('📦 Request Data:');
    console.log(`   Title: ${req.body.title}`);
    console.log(`   Category: ${req.body.category}`);
    console.log(`   Ward: ${req.body.ward}`);
    console.log(`   Priority: ${req.body.priority}`);
    
    // Import and call the grievance controller
    const grievanceController = require('./src/controllers/grievanceController');
    
    // Call the createGrievance function
    await grievanceController.createGrievance(req, res, next);
    
    console.log('\n✅ Test completed!');
    console.log('📧 Check email inbox for notification');
    console.log('📝 Check server logs for email sending confirmation');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the test
testEmailNotification();