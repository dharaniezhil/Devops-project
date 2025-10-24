// verify_admins.js - Quick verification script
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function verifyAdmins() {
    try {
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db('fixitfast');
        const adminsCollection = db.collection('admins');
        
        // Count total admins
        const totalCount = await adminsCollection.countDocuments({role: 'admin'});
        console.log(`📊 Total admins in database: ${totalCount}`);
        
        // Count Tamil Nadu admins
        const tnCount = await adminsCollection.countDocuments({role: 'admin', state: 'Tamil Nadu'});
        console.log(`🏛️  Tamil Nadu admins: ${tnCount}`);
        
        // Get a sample admin
        const sampleAdmin = await adminsCollection.findOne({role: 'admin', state: 'Tamil Nadu'});
        if (sampleAdmin) {
            console.log('\n📋 Sample admin record:');
            console.log(`   Name: ${sampleAdmin.name}`);
            console.log(`   Email: ${sampleAdmin.email}`);
            console.log(`   City: ${sampleAdmin.city}`);
            console.log(`   District: ${sampleAdmin.district}`);
            console.log(`   Status: ${sampleAdmin.status}`);
            console.log(`   Created: ${sampleAdmin.createdAt}`);
        }
        
        await client.close();
        console.log('\n✅ Verification complete');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

verifyAdmins();