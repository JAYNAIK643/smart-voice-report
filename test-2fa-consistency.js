const http = require('http');

console.log('🔐 Testing 2FA Verification Every Login');
console.log('=====================================');

async function test2FALogin() {
  try {
    // Test user credentials
    const userCredentials = {
      email: 'naikjay2228@gmail.com',
      password: 'testpass',
      role: 'user'
    };

    console.log('📋 Testing first login attempt...');
    
    // First login attempt
    const firstResponse = await makeLoginRequest(userCredentials);
    console.log('First login response:', firstResponse.data);
    console.log('Requires 2FA:', firstResponse.data.requiresTwoFactor);
    
    if (firstResponse.data.requiresTwoFactor) {
      console.log('✅ First login correctly requires 2FA verification');
    } else {
      console.log('❌ First login should require 2FA but does not');
    }
    
    // Simulate logout (clear local storage equivalent)
    console.log('\n📋 Simulating logout...');
    console.log('✅ Local storage cleared');
    
    // Second login attempt
    console.log('\n📋 Testing second login attempt...');
    const secondResponse = await makeLoginRequest(userCredentials);
    console.log('Second login response:', secondResponse.data);
    console.log('Requires 2FA:', secondResponse.data.requiresTwoFactor);
    
    if (secondResponse.data.requiresTwoFactor) {
      console.log('✅ Second login correctly requires 2FA verification');
      console.log('✅ 2FA is working properly - verification required every time');
    } else {
      console.log('❌ Second login should require 2FA but does not');
      console.log('❌ Issue: 2FA not enforced on subsequent logins');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

function makeLoginRequest(credentials) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(credentials);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
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

test2FALogin();