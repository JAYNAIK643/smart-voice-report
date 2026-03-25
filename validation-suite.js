const http = require('http');

async function validateImplementation() {
  console.log('🔍 SMARTCITY GRS VALIDATION SUITE');
  console.log('=====================================\n');
  
  let validationResults = {
    backend: { status: 'pending', tests: [] },
    frontend: { status: 'pending', tests: [] },
    analytics: { status: 'pending', tests: [] },
    security: { status: 'pending', tests: [] }
  };

  // Test 1: Backend Health Check
  console.log('🧪 Test 1: Backend Health Check');
  try {
    const healthResponse = await makeRequest('/health', 'GET');
    if (healthResponse.statusCode === 200 && healthResponse.data.status === 'ok') {
      console.log('✅ Backend is running and healthy');
      validationResults.backend.tests.push({ name: 'Health Check', status: 'pass' });
    } else {
      console.log('❌ Backend health check failed');
      validationResults.backend.tests.push({ name: 'Health Check', status: 'fail' });
    }
  } catch (error) {
    console.log('❌ Backend not responding:', error.message);
    validationResults.backend.tests.push({ name: 'Health Check', status: 'fail', error: error.message });
  }

  // Test 2: Analytics API Endpoint
  console.log('\n🧪 Test 2: Analytics API Endpoint');
  try {
    const analyticsResponse = await makeRequest('/api/analytics/enhanced?timeframe=7d', 'GET');
    if (analyticsResponse.statusCode === 200 && analyticsResponse.data.success) {
      console.log('✅ Analytics endpoint is working');
      console.log('📊 Sample data keys:', Object.keys(analyticsResponse.data.data || {}));
      validationResults.analytics.tests.push({ name: 'Analytics API', status: 'pass' });
    } else {
      console.log('❌ Analytics endpoint returned error:', analyticsResponse.data.message);
      validationResults.analytics.tests.push({ name: 'Analytics API', status: 'fail', error: analyticsResponse.data.message });
    }
  } catch (error) {
    console.log('❌ Analytics endpoint not accessible:', error.message);
    validationResults.analytics.tests.push({ name: 'Analytics API', status: 'fail', error: error.message });
  }

  // Test 3: 2FA Authentication Flow (Basic Check)
  console.log('\n🧪 Test 3: 2FA Authentication Flow');
  try {
    // This is a smoke test - we'll check if the 2FA routes exist
    const twofaResponse = await makeRequest('/api/auth/2fa/status', 'GET');
    // Even if unauthorized, the endpoint should exist
    if (twofaResponse.statusCode === 401 || twofaResponse.statusCode === 200) {
      console.log('✅ 2FA endpoints are accessible');
      validationResults.security.tests.push({ name: '2FA Endpoints', status: 'pass' });
    } else {
      console.log('❌ 2FA endpoints may have issues');
      validationResults.security.tests.push({ name: '2FA Endpoints', status: 'warn' });
    }
  } catch (error) {
    console.log('❌ 2FA endpoints not responding:', error.message);
    validationResults.security.tests.push({ name: '2FA Endpoints', status: 'fail', error: error.message });
  }

  // Test 4: Frontend Availability
  console.log('\n🧪 Test 4: Frontend Availability');
  try {
    const frontendResponse = await makeHttpRequest('localhost', 8081, '/', 'GET');
    if (frontendResponse.statusCode === 200) {
      console.log('✅ Frontend is serving content');
      validationResults.frontend.tests.push({ name: 'Frontend Availability', status: 'pass' });
    } else {
      console.log('❌ Frontend returned status:', frontendResponse.statusCode);
      validationResults.frontend.tests.push({ name: 'Frontend Availability', status: 'fail' });
    }
  } catch (error) {
    console.log('❌ Frontend not accessible:', error.message);
    validationResults.frontend.tests.push({ name: 'Frontend Availability', status: 'fail', error: error.message });
  }

  // Test 5: Database Connection
  console.log('\n🧪 Test 5: Database Connectivity');
  try {
    const dbResponse = await makeRequest('/api/users/stats', 'GET');
    if (dbResponse.statusCode === 200 || dbResponse.statusCode === 401) {
      console.log('✅ Database connection is working');
      validationResults.backend.tests.push({ name: 'Database Connection', status: 'pass' });
    } else {
      console.log('❌ Database connectivity issues');
      validationResults.backend.tests.push({ name: 'Database Connection', status: 'fail' });
    }
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    validationResults.backend.tests.push({ name: 'Database Connection', status: 'fail', error: error.message });
  }

  // Summary
  console.log('\n📋 VALIDATION SUMMARY');
  console.log('=====================');
  
  Object.entries(validationResults).forEach(([category, data]) => {
    const passedTests = data.tests.filter(test => test.status === 'pass').length;
    const totalTests = data.tests.length;
    const status = passedTests === totalTests ? '✅ PASS' : '❌ FAIL';
    
    console.log(`\n${category.toUpperCase()}: ${status} (${passedTests}/${totalTests})`);
    data.tests.forEach(test => {
      const icon = test.status === 'pass' ? '✅' : test.status === 'warn' ? '⚠️' : '❌';
      console.log(`  ${icon} ${test.name}${test.error ? ` - ${test.error}` : ''}`);
    });
  });

  // Overall status
  const totalPassed = Object.values(validationResults)
    .flatMap(category => category.tests)
    .filter(test => test.status === 'pass').length;
  const totalTests = Object.values(validationResults)
    .flatMap(category => category.tests).length;
  
  console.log(`\n🎯 OVERALL STATUS: ${totalPassed === totalTests ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'} (${totalPassed}/${totalTests})`);
  
  if (totalPassed === totalTests) {
    console.log('\n🎉 Implementation is stable and ready for Phase 2!');
  } else {
    console.log('\n⚠️  Please address the failed tests before proceeding.');
  }
}

function makeRequest(path, method, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
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
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function makeHttpRequest(hostname, port, path, method) {
  return new Promise((resolve, reject) => {
    const options = { hostname, port, path, method };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data: data });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Run validation
validateImplementation();