const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://<username>:<password>@cluster0.mongodb.net/fixitfast?retryWrites=true&w=majority';
const DB_NAME = 'fixitfast';
const COLLECTION_NAME = 'profiles';

let db;
let client;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname)));

// MongoDB connection
async function connectToMongoDB() {
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DB_NAME);
        console.log('✅ Connected to MongoDB Atlas successfully');
        console.log(`📊 Database: ${DB_NAME}`);
        console.log(`📁 Collection: ${COLLECTION_NAME}`);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        console.log('⚠️  Server will continue with fallback functionality');
    }
}

// Middleware to check database connection
function requireDB(req, res, next) {
    if (!db) {
        return res.status(503).json({
            success: false,
            message: 'Database not available',
            error: 'DB_CONNECTION_ERROR'
        });
    }
    next();
}

// Routes

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Get current user profile (for now, we'll use a single profile)
app.get('/api/profiles/current', requireDB, async (req, res) => {
    try {
        const collection = db.collection(COLLECTION_NAME);
        
        // For simplicity, we'll get the most recent profile
        // In a real app, you'd use user authentication to get the specific user's profile
        const profile = await collection.findOne(
            {},
            { sort: { lastUpdated: -1 } }
        );
        
        res.json({
            success: true,
            profile: profile
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
});

// Get all profiles (admin endpoint)
app.get('/api/profiles', requireDB, async (req, res) => {
    try {
        const collection = db.collection(COLLECTION_NAME);
        const { page = 1, limit = 10, status, role } = req.query;
        
        // Build filter
        const filter = {};
        if (status) filter.accountStatus = status;
        if (role) filter.role = role;
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Get profiles with pagination
        const profiles = await collection
            .find(filter)
            .sort({ lastUpdated: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .toArray();
        
        // Get total count for pagination
        const total = await collection.countDocuments(filter);
        
        res.json({
            success: true,
            profiles,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalProfiles: total,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching profiles:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profiles',
            error: error.message
        });
    }
});

// Get specific profile by ID
app.get('/api/profiles/:id', requireDB, async (req, res) => {
    try {
        const { id } = req.params;
        const collection = db.collection(COLLECTION_NAME);
        
        // Validate ObjectId format
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid profile ID format'
            });
        }
        
        const profile = await collection.findOne({ _id: new ObjectId(id) });
        
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }
        
        res.json({
            success: true,
            profile
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
});

// Create new profile
app.post('/api/profiles', requireDB, async (req, res) => {
    try {
        const profileData = req.body;
        const collection = db.collection(COLLECTION_NAME);
        
        // Validate required fields
        const requiredFields = ['fullName', 'email', 'role', 'accountStatus', 'phoneNumber'];
        const missingFields = requiredFields.filter(field => !profileData[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                missingFields
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(profileData.email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }
        
        // Check if email already exists
        const existingProfile = await collection.findOne({ email: profileData.email });
        if (existingProfile) {
            return res.status(409).json({
                success: false,
                message: 'Profile with this email already exists'
            });
        }
        
        // Prepare profile data
        const newProfile = {
            ...profileData,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            profileVersion: 1,
            // Generate some sample activity data
            activityStats: {
                complaintsLodged: 0,
                complaintsResolved: 0,
                complaintsPending: 0,
                joinedDate: new Date().toISOString()
            }
        };
        
        // Insert into database
        const result = await collection.insertOne(newProfile);
        
        res.status(201).json({
            success: true,
            message: 'Profile created successfully',
            profileId: result.insertedId.toString(),
            profile: { ...newProfile, _id: result.insertedId }
        });
        
        console.log(`✅ New profile created: ${profileData.fullName} (${profileData.email})`);
        
    } catch (error) {
        console.error('Error creating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating profile',
            error: error.message
        });
    }
});

// Update existing profile
app.put('/api/profiles', requireDB, async (req, res) => {
    try {
        const profileData = req.body;
        const { _id, ...updateData } = profileData;
        const collection = db.collection(COLLECTION_NAME);
        
        if (!_id) {
            return res.status(400).json({
                success: false,
                message: 'Profile ID is required for update'
            });
        }
        
        // Validate ObjectId format
        if (!ObjectId.isValid(_id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid profile ID format'
            });
        }
        
        // Check if profile exists
        const existingProfile = await collection.findOne({ _id: new ObjectId(_id) });
        if (!existingProfile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }
        
        // Prepare update data
        const updatedProfile = {
            ...updateData,
            lastUpdated: new Date().toISOString(),
            profileVersion: (existingProfile.profileVersion || 1) + 1
        };
        
        // Update profile
        const result = await collection.updateOne(
            { _id: new ObjectId(_id) },
            { $set: updatedProfile }
        );
        
        if (result.modifiedCount === 0) {
            return res.status(400).json({
                success: false,
                message: 'No changes made to profile'
            });
        }
        
        // Get updated profile
        const updated = await collection.findOne({ _id: new ObjectId(_id) });
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            profileId: _id,
            profile: updated
        });
        
        console.log(`✅ Profile updated: ${updated.fullName} (${updated.email})`);
        
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
});

// Delete profile
app.delete('/api/profiles/:id', requireDB, async (req, res) => {
    try {
        const { id } = req.params;
        const collection = db.collection(COLLECTION_NAME);
        
        // Validate ObjectId format
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid profile ID format'
            });
        }
        
        // Delete profile
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Profile deleted successfully'
        });
        
        console.log(`❌ Profile deleted: ${id}`);
        
    } catch (error) {
        console.error('Error deleting profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting profile',
            error: error.message
        });
    }
});

// Update activity stats (for complaint system integration)
app.patch('/api/profiles/:id/activity', requireDB, async (req, res) => {
    try {
        const { id } = req.params;
        const { complaintsLodged, complaintsResolved, complaintsPending } = req.body;
        const collection = db.collection(COLLECTION_NAME);
        
        // Validate ObjectId format
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid profile ID format'
            });
        }
        
        const updateFields = {};
        if (complaintsLodged !== undefined) updateFields['activityStats.complaintsLodged'] = complaintsLodged;
        if (complaintsResolved !== undefined) updateFields['activityStats.complaintsResolved'] = complaintsResolved;
        if (complaintsPending !== undefined) updateFields['activityStats.complaintsPending'] = complaintsPending;
        
        updateFields.lastUpdated = new Date().toISOString();
        
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateFields }
        );
        
        if (result.modifiedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found or no changes made'
            });
        }
        
        res.json({
            success: true,
            message: 'Activity stats updated successfully'
        });
        
    } catch (error) {
        console.error('Error updating activity stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating activity stats',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        database: db ? 'connected' : 'disconnected'
    });
});

// Statistics endpoint
app.get('/api/stats', requireDB, async (req, res) => {
    try {
        const collection = db.collection(COLLECTION_NAME);
        
        // Get various statistics
        const stats = await Promise.all([
            collection.countDocuments(),
            collection.countDocuments({ accountStatus: 'active' }),
            collection.countDocuments({ accountStatus: 'inactive' }),
            collection.countDocuments({ accountStatus: 'pending' }),
            collection.countDocuments({ role: 'admin' }),
            collection.countDocuments({ role: 'labour' }),
            collection.countDocuments({ role: 'general' })
        ]);
        
        res.json({
            success: true,
            stats: {
                totalProfiles: stats[0],
                activeProfiles: stats[1],
                inactiveProfiles: stats[2],
                pendingProfiles: stats[3],
                adminProfiles: stats[4],
                labourProfiles: stats[5],
                generalProfiles: stats[6]
            }
        });
        
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
});

// Search profiles endpoint
app.get('/api/profiles/search/:query', requireDB, async (req, res) => {
    try {
        const { query } = req.params;
        const collection = db.collection(COLLECTION_NAME);
        
        // Create text search
        const searchFilter = {
            $or: [
                { fullName: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
                { phoneNumber: { $regex: query, $options: 'i' } },
                { city: { $regex: query, $options: 'i' } },
                { state: { $regex: query, $options: 'i' } }
            ]
        };
        
        const profiles = await collection
            .find(searchFilter)
            .limit(20)
            .toArray();
        
        res.json({
            success: true,
            query,
            results: profiles.length,
            profiles
        });
        
    } catch (error) {
        console.error('Error searching profiles:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching profiles',
            error: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.originalUrl
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🔄 Shutting down server gracefully...');
    
    if (client) {
        await client.close();
        console.log('📊 MongoDB connection closed');
    }
    
    process.exit(0);
});

// Start server
async function startServer() {
    try {
        // Connect to MongoDB first
        await connectToMongoDB();
        
        // Start the server
        app.listen(PORT, () => {
            console.log('\n🚀 FixItFast Profile Server Started');
            console.log(`📍 Server running at: http://localhost:${PORT}`);
            console.log(`🌐 API endpoints available at: http://localhost:${PORT}/api`);
            console.log('\n📋 Available API Endpoints:');
            console.log('   GET    /                           - Main profile page');
            console.log('   GET    /api/health                 - Health check');
            console.log('   GET    /api/stats                  - Profile statistics');
            console.log('   GET    /api/profiles               - Get all profiles');
            console.log('   GET    /api/profiles/current       - Get current profile');
            console.log('   GET    /api/profiles/:id           - Get profile by ID');
            console.log('   POST   /api/profiles               - Create new profile');
            console.log('   PUT    /api/profiles               - Update profile');
            console.log('   DELETE /api/profiles/:id           - Delete profile');
            console.log('   PATCH  /api/profiles/:id/activity  - Update activity stats');
            console.log('   GET    /api/profiles/search/:query - Search profiles');
            console.log('\n✨ Ready to handle user profiles!\n');
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the application
startServer();

module.exports = app;