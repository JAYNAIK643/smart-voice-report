const http = require('http');

async function test2FARoleFix() {
  try {
    console.log('🔍 Testing 2FA role fix...\n');
    
    // Test user credentials (assuming this user exists and has 2FA enabled)
    const userCredentials = {
      email: 'naikjay2228@gmail.com',
      password: 'testpass',
      role: 'user'
    };
    
    // First, login to get the 2FA requirement
    console.log('1️⃣ Attempting login...');
    const loginResponse = await makeRequest('/api/auth/login', 'POST', userCredentials);
    
    if (loginResponse.statusCode === 200 && loginResponse.data.requiresTwoFactor) {
      console.log('✅ Login requires 2FA verification');
      console.log('User ID:', loginResponse.data.data.userId);
      console.log('Email:', loginResponse.data.data.email);
      
      // Now test 2FA verification with a dummy code to see the response structure
      console.log('\n2️⃣ Testing 2FA verification response structure...');
      const verifyResponse = await makeRequest('/api/auth/2fa/verify', 'POST', {
        userId: loginResponse.data.data.userId,
        token: '123456' // Invalid code, but we just want to see the response structure
      });
      
      console.log('Response status:', verifyResponse.statusCode);
      console.log('Response data:', JSON.stringify(verifyResponse.data, null, 2));
      
      if (verifyResponse.data.success === false) {
        console.log('✅ Got expected 2FA verification failure (invalid code)');
        console.log('✅ This confirms the endpoint is working and we can see the response structure');
      }
      
      // Check if role is present in the error response
      if (verifyResponse.data.data && verifyResponse.data.data.user) {
        console.log('\n📋 User data in response:');
        console.log('  Role:', verifyResponse.data.data.user.role);
        console.log('  Email:', verifyResponse.data.data.user.email);
        console.log('  Name:', verifyResponse.data.data.user.name);
        
        if (verifyResponse.data.data.user.role) {
          console.log('✅ SUCCESS: Role is properly included in response!');
        } else {
          console.log('❌ ISSUE: Role is still undefined in response');
        }
      }
      
    } else {
      console.log('❌ Login did not require 2FA or failed');
      console.log('Response:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: jsonData });
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Run the test
test2FARoleFix();