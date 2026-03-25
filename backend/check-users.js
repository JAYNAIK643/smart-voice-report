require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function checkUserData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Database connected\n');
    
    const testUser = await User.findOne({ email: 'test2fa@example.com' });
    const realUser = await User.findOne({ email: 'naikjay2228@gmail.com' });
    
    console.log('=== User Data Check ===\n');
    
    if (testUser) {
      console.log('📋 test2fa@example.com:');
      console.log(`  Has password: ${!!testUser.password}`);
      console.log(`  2FA enabled: ${testUser.twoFactorAuth?.enabled}`);
      console.log(`  Password hash: ${testUser.password?.substring(0, 20)}...`);
    } else {
      console.log('❌ test2fa@example.com not found');
    }
    
    console.log('');
    
    if (realUser) {
      console.log('📋 naikjay2228@gmail.com:');
      console.log(`  Has password: ${!!realUser.password}`);
      console.log(`  2FA enabled: ${realUser.twoFactorAuth?.enabled}`);
      console.log(`  Password hash: ${realUser.password?.substring(0, 20)}...`);
    } else {
      console.log('❌ naikjay2228@gmail.com not found');
    }
    
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUserData();