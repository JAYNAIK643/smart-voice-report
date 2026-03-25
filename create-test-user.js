const fs = require('fs');

// Create test user data
const userData = {
  name: "Test User",
  email: "test@example.com", 
  password: "password123",
  role: "user"
};

fs.writeFileSync('test-user.json', JSON.stringify(userData, null, 2));
console.log('Created test-user.json');