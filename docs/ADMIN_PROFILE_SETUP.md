# Admin Profile Page Setup Guide

This guide explains how to set up and use the Admin Profile functionality in the FixItFast application.

## Overview

The Admin Profile Page allows administrators to:
- View and update their personal information
- Upload and manage profile pictures
- Update contact details and bio
- View profile metadata and creation date

## Features

✅ **Profile Management**
- Full name editing (required, 2+ characters)
- Contact number with validation (optional, 7-15 digits)
- Department field
- Bio with character limit (500 chars max)
- Email display (non-editable, unique identifier)
- Role display (fixed as Admin/Super Admin)

✅ **Profile Picture Management**
- Upload images (JPEG, PNG, GIF, WebP)
- Automatic resizing and optimization via Cloudinary
- Image validation (5MB size limit)
- Delete existing profile pictures

✅ **Security & Authentication**
- JWT-based authentication required
- Admin-only access via middleware
- API protection on all endpoints
- Input validation and sanitization

✅ **Database Integration**
- MongoDB Atlas with dedicated `admin-profiles` collection
- Automatic profile creation from existing Admin data
- Data validation at model level

## Prerequisites

Before using the Admin Profile functionality, ensure you have:

1. **MongoDB Atlas** connection configured
2. **Cloudinary** account and API credentials
3. **Admin account** created in the system
4. **Environment variables** properly set

## Environment Variables

Add these variables to your `.env` file:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
DB_NAME=fixitfast

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
JWT_EXPIRES_IN=7d

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Admin Secret Key for registration
ADMIN_SECRET_KEY=your_admin_secret_key_for_registration
```

## Setup Instructions

### 1. Backend Setup

The backend is already configured with all necessary components:

**Models:**
- `src/models/AdminProfile.js` - Main profile model
- `src/models/Admin.js` - Admin authentication model (updated)

**Routes:**
- `src/routes/adminProfile.js` - Profile-specific routes
- Mounted at `/api/admin/profile`

**Controllers:**
- `src/controllers/adminProfileController.js` - Business logic

**Middleware:**
- `src/middleware/auth.js` - JWT authentication
- `src/config/cloudinary.js` - Image upload configuration

### 2. Frontend Setup

The frontend component is integrated into the existing React application:

**Component:**
- `src/pages/admin/AdminProfile/AdminProfile.jsx` - Main component
- `src/pages/admin/AdminProfile/AdminProfile.css` - Styling

**Services:**
- `src/services/adminProfileService.js` - API communication

**Route:**
- `/admin/profile` - Accessible to authenticated admins

### 3. Testing the Setup

Run the test script to verify everything works:

```bash
# In the backend directory
node test-admin-profile.js
```

The test will verify:
- Admin authentication
- Profile data retrieval
- Profile updates
- Input validation
- Database connectivity

## API Endpoints

### GET `/api/admin/profile`
Retrieve the current admin's profile information.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "profile_id",
    "adminId": "admin_id",
    "fullName": "John Admin",
    "email": "admin@fixitfast.com",
    "role": "admin",
    "contactNumber": "+1234567890",
    "profilePicture": "https://res.cloudinary.com/...",
    "department": "IT Management",
    "bio": "Experienced administrator...",
    "lastProfileUpdate": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### PUT `/api/admin/profile`
Update admin profile information.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Body:**
```json
{
  "fullName": "John Admin",
  "contactNumber": "+1234567890",
  "department": "IT Management",
  "bio": "Updated bio information"
}
```

### POST `/api/admin/profile/upload-picture`
Upload a profile picture.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data
```

**Body:**
Form data with `profilePicture` file field.

### DELETE `/api/admin/profile/picture`
Delete the current profile picture.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

## Usage Instructions

### For Administrators:

1. **Access the Profile Page:**
   - Log in to your admin account
   - Navigate to `/admin/profile` or use the navigation menu

2. **View Profile Information:**
   - See your current profile details
   - Check when your profile was last updated
   - View your member since date

3. **Edit Profile:**
   - Click the "Edit Profile" button
   - Update any editable fields
   - Click "Save Changes" to persist updates
   - Click "Cancel" to discard changes

4. **Manage Profile Picture:**
   - Click "Upload Picture" or "Change Picture"
   - Select an image file (JPEG, PNG, GIF, or WebP)
   - Image will be automatically resized and optimized
   - Click "Delete Picture" to remove current image

### Validation Rules:

- **Full Name:** Required, minimum 2 characters
- **Contact Number:** Optional, must be 7-15 digits with optional country code
- **Bio:** Optional, maximum 500 characters
- **Profile Picture:** Maximum 5MB, supported formats: JPEG, PNG, GIF, WebP

## Database Schema

### `admin-profiles` Collection:

```javascript
{
  _id: ObjectId,
  adminId: ObjectId, // Reference to Admin collection
  fullName: String, // Required, 2-50 characters
  email: String, // Required, unique, validated format
  role: String, // Enum: ['admin', 'superadmin']
  contactNumber: String, // Optional, phone validation
  profilePicture: String, // Cloudinary URL
  department: String, // Optional
  bio: String, // Optional, max 500 characters
  lastProfileUpdate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Troubleshooting

### Common Issues:

1. **Profile Not Loading:**
   - Check MongoDB Atlas connection
   - Verify admin is logged in with valid JWT token
   - Check browser console for API errors

2. **Image Upload Failing:**
   - Verify Cloudinary credentials in environment variables
   - Check image file size (must be < 5MB)
   - Ensure file format is supported

3. **Validation Errors:**
   - Full name must be at least 2 characters
   - Phone number format: +[country][number] (7-15 digits total)
   - Bio cannot exceed 500 characters

4. **Authentication Issues:**
   - Ensure JWT_SECRET is set in environment
   - Check token expiration (default 7 days)
   - Verify admin role in database

### Database Queries for Debugging:

```javascript
// Check if profile exists
db.getCollection('admin-profiles').find({})

// Check admin accounts
db.getCollection('admins').find({})

// Create missing profile manually (if needed)
db.getCollection('admin-profiles').insertOne({
  adminId: ObjectId("your_admin_id"),
  fullName: "Admin Name",
  email: "admin@fixitfast.com",
  role: "admin",
  contactNumber: "",
  profilePicture: "",
  department: "",
  bio: "",
  lastProfileUpdate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## File Structure

```
backend/
├── src/
│   ├── models/
│   │   ├── AdminProfile.js     # Profile model
│   │   └── Admin.js           # Updated admin model
│   ├── controllers/
│   │   └── adminProfileController.js
│   ├── routes/
│   │   └── adminProfile.js
│   ├── middleware/
│   │   └── auth.js            # JWT authentication
│   ├── config/
│   │   └── cloudinary.js      # Image upload config
│   └── server.js              # Updated with new routes
└── test-admin-profile.js      # Test script

frontend/
├── src/
│   ├── pages/admin/AdminProfile/
│   │   ├── AdminProfile.jsx
│   │   └── AdminProfile.css
│   ├── services/
│   │   └── adminProfileService.js
│   └── App.jsx                # Updated with new route
```

## Security Considerations

- All profile endpoints require valid JWT authentication
- Admin role verification on all routes
- Input validation and sanitization at multiple levels
- Cloudinary URLs are secure and optimized
- No sensitive admin data exposed in API responses
- Rate limiting can be added if needed

## Next Steps

After setup, you may want to:

1. Add profile completion percentage indicators
2. Implement profile picture cropping interface
3. Add more profile fields (timezone, preferences, etc.)
4. Create profile activity logs
5. Add bulk admin profile management for super admins

## Support

If you encounter issues:

1. Check the test script output for specific error messages
2. Review browser console for frontend errors
3. Check server logs for backend issues
4. Verify all environment variables are correctly set
5. Ensure MongoDB Atlas and Cloudinary services are accessible