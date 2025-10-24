// backend/src/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const session = require("express-session");
const passport = require("passport");

let morgan;
try {
  morgan = require('morgan');
} catch (_) {
  morgan = null;
}

// Load environment variables
dotenv.config();

// Configure Cloudinary
const cloudinary = require('cloudinary').v2;
const cloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                            process.env.CLOUDINARY_API_KEY && 
                            process.env.CLOUDINARY_API_SECRET;

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('☁️  Cloudinary configured: yes');
} else {
  console.log('☁️  Cloudinary configured: no - using local storage');
}

const app = express();

// Make cloudinary status available globally
global.cloudinaryConfigured = cloudinaryConfigured;

// ---------------- CORS ----------------
const parsedEnvOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = parsedEnvOrigins.length
  ? parsedEnvOrigins
  : [ 
      'http://localhost:5173',
      'http://localhost:5174',
      ' http://localhost:3000'
    ];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with', 'Accept'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight for all routes

// ---------------- Middleware ----------------
if (morgan && (process.env.NODE_ENV || 'development') === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));
app.use(
  session({
    secret: process.env.JWT_SECRET || "fixitfast_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // secure:true in production with HTTPS
  })
);

app.use(passport.initialize());
app.use(passport.session());



// ---------------- MongoDB Connection ----------------
const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  const maxRetries = 5;
  const baseDelayMs = 3000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Connecting to MongoDB Atlas... (attempt ${attempt}/${maxRetries})`);
      const conn = await mongoose.connect(mongoUri, {
        family: 4,
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        dbName: 'fixitfast' // Explicitly set database name
      });

      console.log('✅ Connected to MongoDB Atlas!');
      console.log(`📦 Host: ${conn.connection.host}`);
      console.log(`🗄️  Database: ${conn.connection.name}`);

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
      console.error('❌ MongoDB connection failed:', error.message);
      if (error.message.includes('authentication failed')) {
        console.error('💡 Check your MongoDB username and password');
      } else if (error.message.includes('IP address')) {
        console.error('💡 Whitelist your IP address in Atlas Network Access');
      } else if (error.message.toLowerCase().includes('querysrv') || error.message.toLowerCase().includes('etimeout')) {
        console.error('💡 SRV DNS lookup timed out. Consider using a non-SRV connection string.');
      }

      if (attempt === maxRetries) {
        throw error;
      }
      const delay = baseDelayMs * attempt;
      console.log(`⏳ Retrying MongoDB connection in ${Math.ceil(delay / 1000)}s...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
};

// ---------------- Routes ----------------
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const profileRoutes = require('./routes/profile');
const dashboardRoutes = require('./routes/dashboard');
const healthRoute = require('./routes/health');
const contactRoutes = require('./routes/contact'); // Add contact routes
const feedbackRoutes = require('./routes/feedback'); // Add feedback routes
const adminsRoutes = require('./routes/admin');
const superadminRoutes = require('./routes/superadmin');
const labourRoutes = require('./routes/labour');
const superadminLabourRoutes = require('./routes/labourRoutes');
const userRecentRoutes = require('./routes/userRecent');
const adminProfileRoutes = require('./routes/adminProfile');

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/health', healthRoute);
app.use('/api/contact', contactRoutes); // Mount contact routes
app.use('/api/feedback', feedbackRoutes); // Mount feedback routes
// New route groups
app.use('/api/users', authRoutes); // user register/login/me
app.use('/api/admins', adminsRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/labour', labourRoutes);
app.use('/api/superadmin/labours', superadminLabourRoutes);
app.use('/api/user', userRecentRoutes);
app.use('/api/admin/profile', adminProfileRoutes);
// Backward-compat aliases (optional)
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ success: true, message: 'FixItFast Backend API', version: '1.0.0' });
});

// Health endpoint (simple)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});



// ---------------- Start Server ----------------
const PORT = Number(process.env.PORT) || 5001;
const startServer = async () => {
  try {
    console.log('🔧 CORS allowed origins:', allowedOrigins.join(', '));
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔐 JWT Secret configured: ${process.env.JWT_SECRET ? 'yes' : 'no'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
});

startServer();

module.exports = app;
module.exports = cloudinary;