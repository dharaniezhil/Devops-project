const fetch = require('node-fetch');

// Test data
const testUsers = [
  {
    name: "Albert",
    email: "albert@gmail.com",
    password: "1234123456",
    phone: "123456789",
    location: "Chennai"
  },
  {
    name: "Sarah Wilson", 
    email: "sarah.wilson@email.com",
    password: "password123",
    phone: "9876543210",
    location: "Mumbai"
  },
  {
    name: "John Doe",
    email: "john.doe@example.com", 
    password: "securepass",
    phone: "5551234567",
    location: "Delhi"
  }
];

async function testRegistration() {
  console.log('🧪 Testing Registration API...\n');
  
  for (let i = 0; i < testUsers.length; i++) {
    const user = testUsers[i];
    console.log(`Testing user ${i + 1}: ${user.name} (${user.email})`);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user)
      });
      
      const data = await response.json();
      
      console.log(`Status: ${response.status}`);
      console.log('Response:', JSON.stringify(data, null, 2));
      
      if (response.status === 201) {
        console.log('✅ Registration successful');
      } else if (response.status === 409) {
        console.log('⚠️  Email already exists');
      } else {
        console.log('❌ Registration failed');
      }
      
    } catch (error) {
      console.error('❌ Request failed:', error.message);
    }
    
    console.log('---\n');
  }
}

// Test login for the first user
async function testLogin() {
  console.log('🧪 Testing Login API...\n');
  
  const loginData = {
    email: testUsers[0].email,
    password: testUsers[0].password
  };
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });
    
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 200) {
      console.log('✅ Login successful');
      
      // Test /auth/me endpoint
      if (data.token) {
        console.log('\n🧪 Testing /auth/me endpoint...');
        const meResponse = await fetch('http://localhost:5000/api/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const meData = await meResponse.json();
        console.log(`/auth/me Status: ${meResponse.status}`);
        console.log('/auth/me Response:', JSON.stringify(meData, null, 2));
      }
      
    } else {
      console.log('❌ Login failed');
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

async function runTests() {
  await testRegistration();
  await testLogin();
}

runTests().catch(console.error);
