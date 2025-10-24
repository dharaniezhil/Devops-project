# Cloudinary Setup Guide for Profile Picture Uploads

## Issue
Profile picture uploads are failing with a 500 Internal Server Error because Cloudinary is not configured.

## Quick Fix Steps

### 1. Create a Free Cloudinary Account

1. Go to [https://cloudinary.com/users/register_free](https://cloudinary.com/users/register_free)
2. Sign up for a free account
3. After registration, go to your Dashboard

### 2. Get Your Credentials

From your Cloudinary Dashboard, copy:
- **Cloud Name** (e.g., `dkx7yvkqz`)
- **API Key** (e.g., `123456789012345`)
- **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz`)

### 3. Update Your .env File

Replace the placeholder values in your `.env` file:

```env
# Replace these with your actual Cloudinary credentials
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

**Example:**
```env
CLOUDINARY_CLOUD_NAME=dkx7yvkqz
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
```

### 4. Restart Your Server

After updating the .env file:
```bash
# Stop your server (Ctrl+C)
# Then restart it
npm run dev
```

### 5. Test Profile Picture Upload

1. Go to `/admin/profile` in your browser
2. Click "Upload Picture" or "Change Picture"
3. Select an image file
4. The upload should now work successfully

## Alternative Solution (Without Cloudinary)

If you prefer not to use Cloudinary, you can store images locally. Here's how:

### 1. Create uploads directory
```bash
mkdir public/uploads/profiles
```

### 2. Update the upload controller

Replace the Cloudinary upload logic with local file storage:

```javascript
// In src/controllers/adminProfileController.js
const path = require('path');
const fs = require('fs').promises;

const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    const adminId = req.user.id;
    let profile = await AdminProfile.findOne({ adminId });
    
    // Create unique filename
    const fileName = `admin-${adminId}-${Date.now()}${path.extname(req.file.originalname)}`;
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'profiles', fileName);
    
    // Save file locally
    await fs.writeFile(uploadPath, req.file.buffer);
    
    // Delete old image if exists
    if (profile.profilePicture && !profile.profilePicture.includes('cloudinary')) {
      try {
        const oldPath = path.join(process.cwd(), 'public', profile.profilePicture);
        await fs.unlink(oldPath);
      } catch (err) {
        console.log('Could not delete old image:', err.message);
      }
    }
    
    // Update profile with new image URL
    const imageUrl = `/uploads/profiles/${fileName}`;
    profile.profilePicture = imageUrl;
    await profile.save();
    
    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        profilePicture: imageUrl
      }
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture'
    });
  }
};
```

### 3. Serve static files

Make sure your server serves static files from the public directory:

```javascript
// In src/server.js
app.use(express.static('public'));
```

## Testing the Fix

Run this test to check if everything works:

```bash
node test-admin-profile.js
```

The test will show you exactly which configuration is missing:

```
Upload picture request received
File: Present
Cloudinary config: {
  cloud_name: 'Missing',  // Should say 'Set'
  api_key: 'Missing',     // Should say 'Set'  
  api_secret: 'Missing'   // Should say 'Set'
}
```

## Free Cloudinary Limits

The free Cloudinary plan includes:
- 25 monthly credits (1 credit = 1,000 transformations or 1GB storage)
- 25GB storage
- 25GB monthly bandwidth
- This is more than sufficient for admin profile pictures

## Troubleshooting

### Common Issues:

1. **Still getting 500 error after adding credentials:**
   - Make sure you restarted the server after updating .env
   - Check that the credentials are correct (no extra spaces)
   - Verify the values are not wrapped in quotes

2. **"Invalid API key" error:**
   - Double-check your API key from Cloudinary dashboard
   - Make sure API secret is correct

3. **"Must supply cloud_name" error:**
   - Verify CLOUDINARY_CLOUD_NAME is set in .env
   - Check for typos in the variable name

### Test Cloudinary Configuration:

Create a test file to verify your setup:

```javascript
// test-cloudinary.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('Cloudinary config:', {
  cloud_name: cloudinary.config().cloud_name,
  api_key: cloudinary.config().api_key ? 'Set' : 'Missing',
  api_secret: cloudinary.config().api_secret ? 'Set' : 'Missing'
});

// Test API connection
cloudinary.api.ping((error, result) => {
  if (error) {
    console.error('Cloudinary connection failed:', error);
  } else {
    console.log('Cloudinary connection successful:', result);
  }
});
```

Run it with:
```bash
node test-cloudinary.js
```

## Summary

The main issue is missing Cloudinary credentials. Once you:
1. Create a Cloudinary account
2. Get your credentials
3. Update your .env file
4. Restart the server

Profile picture uploads will work perfectly!

Your current setup is already complete - it just needs the API credentials to connect to Cloudinary's service.