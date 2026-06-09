#!/usr/bin/env node

// Quick syntax check for modified files
const fs = require('fs');
const path = require('path');

const filesToCheck = [
  './src/services/emailOTPService.js',
  './src/controllers/twoFactorAuthController.js',
  './src/routes/twoFactorAuthRoutes.js',
  './src/models/User.js',
  './src/controllers/authController.js',
  './test-email-otp.js'
];

console.log('🔍 Syntax Validation\n');

let allValid = true;

filesToCheck.forEach(file => {
  try {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️ File not found: ${file}`);
      return;
    }
    
    require(fullPath);
    console.log(`✅ ${file}`);
  } catch (error) {
    console.log(`❌ ${file}`);
    console.log(`   Error: ${error.message}`);
    allValid = false;
  }
});

console.log('\n' + (allValid ? '✅ All files valid' : '❌ Some files have errors'));
process.exit(allValid ? 0 : 1);
