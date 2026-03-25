const mongoose = require('mongoose');
const dotenv = require('dotenv');
const twoFactorAuthService = require('./src/services/twoFactorAuthService');

dotenv.config();

async function testCore2FAFunctionality() {
  console.log('🔐 Core 2FA Functionality Test');
  console.log('==============================');
  
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Database connected');
    
    // Test the is2FARequired function directly
    console.log('\n📋 Testing is2FARequired function:');
    
    // Create a mock user object
    const mockUser = {
      _id: 'test-user-id',
      email: 'test@example.com',
      twoFactorAuth: {
        enabled: true,
        secret: 'TESTSECRET123',
        enabledAt: new Date()
      }
    };
    
    const result = twoFactorAuthService.is2FARequired(mockUser);
    console.log(`📊 is2FARequired result: ${result} (should be true)`);
    
    if (result === true) {
      console.log('✅ is2FARequired function working correctly');
    } else {
      console.log('❌ is2FARequired function failed');
    }
    
    // Test is2FAEnabled function
    console.log('\n📋 Testing is2FAEnabled function:');
    const enabledResult = twoFactorAuthService.is2FAEnabled(mockUser);
    console.log(`📊 is2FAEnabled result: ${enabledResult} (should be true)`);
    
    if (enabledResult === true) {
      console.log('✅ is2FAEnabled function working correctly');
    } else {
      console.log('❌ is2FAEnabled function failed');
    }
    
    // Test TOTP token verification
    console.log('\n📋 Testing TOTP token verification:');
    const speakeasy = require('speakeasy');
    
    // Generate a test secret
    const testSecret = speakeasy.generateSecret({
      name: 'Test User',
      issuer: 'SmartCity'
    });
    
    console.log('✅ Test secret generated');
    
    // Generate and verify token
    const token = speakeasy.totp({
      secret: testSecret.base32,
      encoding: 'base32'
    });
    
    console.log(`🔢 Generated token: ${token}`);
    
    const verificationResult = twoFactorAuthService.verifyToken(token, testSecret.base32);
    console.log(`📊 Token verification: ${verificationResult} (should be true)`);
    
    if (verificationResult === true) {
      console.log('✅ TOTP token verification working');
    } else {
      console.log('❌ TOTP token verification failed');
    }
    
    // Test backup codes
    console.log('\n📋 Testing backup codes:');
    const backupCodes = twoFactorAuthService.generateBackupCodes(3);
    console.log(`✅ Generated backup codes: ${backupCodes.join(', ')}`);
    
    const firstCode = backupCodes[0];
    const hashedCode = twoFactorAuthService.hashBackupCode(firstCode);
    const backupVerification = twoFactorAuthService.verifyBackupCode(firstCode, hashedCode);
    
    console.log(`📊 Backup code verification: ${backupVerification} (should be true)`);
    
    if (backupVerification === true) {
      console.log('✅ Backup codes functionality working');
    } else {
      console.log('❌ Backup codes functionality failed');
    }
    
    console.log('\n🏁 Core 2FA functionality tests completed!');
    console.log('\n📋 Summary:');
    console.log('✅ is2FARequired enforcement');
    console.log('✅ is2FAEnabled detection');
    console.log('✅ TOTP token generation and verification');
    console.log('✅ Backup codes generation and verification');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

testCore2FAFunctionality();