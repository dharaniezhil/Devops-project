require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
  try {
    console.log('🔄 Testing MongoDB Atlas connection...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log(`📦 Connected to: ${mongoose.connection.host}`);
    console.log(`🗄️  Database: ${mongoose.connection.name}`);
    
    // Test a simple operation
    console.log('🔄 Testing database operations...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections`);
    
    await mongoose.connection.close();
    console.log('✅ Connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('💡 Solution: Check your username and password');
    } else if (error.message.includes('IP address')) {
      console.error('💡 Solution: Whitelist your IP address in Atlas Network Access');
    }
  }
};

testConnection();
