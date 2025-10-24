// backend/config/database.js
const mongoose = require('mongoose');

const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set. Please configure it in your environment.');
  }

  try {
    const conn = await mongoose.connect(mongoUri, { 
      serverSelectionTimeoutMS: 15000,
      dbName: 'fixitfast' // Explicitly set database name
    });
    console.log(`✅ Connected to MongoDB at host: ${conn.connection.host}`);
    console.log(`🗄️  Database: ${conn.connection.name}`);
    
    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });
    
    return conn;
  } catch (error) {
    const message = `Failed to connect to MongoDB. ${error.message}`;
    const err = new Error(message);
    err.cause = error;
    throw err;
  }
};

module.exports = { connectDatabase };