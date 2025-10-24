# Admin Authentication with Temporary Password

## Overview

This system implements secure admin authentication with temporary password functionality, forced password changes on first login, and city-based labour management restrictions.

## Features

### 🔐 Temporary Password System
- Admins are created with temporary password: `SuperAdmin@123`
- No secret key required for temporary password login
- System forces password change on first login
- Temporary password is disabled after first password change

### 🔄 Password Change Flow
1. Admin logs in with `SuperAdmin@123`
2. System returns special token with `requirePasswordChange: true`
3. Admin must change password before accessing other features
4. After password change, secret key requirement is removed
5. Normal authentication flow begins

### 🏙️ City-Based Management
- Each admin is assigned to a specific city
- Admins can only manage labours in their assigned city
- SuperAdmins can manage labours across all cities

## API Endpoints

### Authentication
- `POST /api/admin/login` - Admin login (supports temporary password)
- `POST /api/admin/change-password` - Change password on first login

### Labour Management
- `GET /api/admin/labours` - Get labours (filtered by admin's city)
- `POST /api/admin/labours` - Create labour (SuperAdmin only)

## Database Changes

### Admin Model Updates
```javascript
{
  // Existing fields...
  
  // New fields for password management
  isFirstLogin: { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: true },
  passwordChangedAt: { type: Date, default: null },
  assignedCity: { type: String, required: true, trim: true },
  temporaryPassword: { type: Boolean, default: true }
}
```

### Labour Model Updates
```javascript
{
  // Existing fields...
  
  // New field for city-based management
  city: { type: String, required: true, trim: true }
}
```

## Usage Instructions

### Creating an Admin with Temporary Password

#### Using the Script
```bash
npm run create:temp-admin "John Smith" john@example.com Mumbai
```

#### Manual Creation
```javascript
const admin = new Admin({
  name: 'John Smith',
  email: 'john@example.com',
  password: 'SuperAdmin@123',
  role: 'admin',
  assignedCity: 'Mumbai',
  temporaryPassword: true,
  isFirstLogin: true,
  mustChangePassword: true
});
await admin.save();
```

### Admin Login Flow

#### 1. Initial Login (Temporary Password)
```javascript
// Request
POST /api/admin/login
{
  "email": "admin@example.com",
  "password": "SuperAdmin@123"
  // No secretKey required for temporary password
}

// Response
{
  "success": true,
  "requirePasswordChange": true,
  "message": "Password change required on first login",
  "tempToken": "temporary_jwt_token",
  "redirect": "/admin/change-password"
}
```

#### 2. Password Change
```javascript
// Request
POST /api/admin/change-password
Headers: { Authorization: "Bearer temporary_jwt_token" }
{
  "currentPassword": "SuperAdmin@123",
  "newPassword": "MyNewSecurePassword123",
  "confirmPassword": "MyNewSecurePassword123"
}

// Response
{
  "success": true,
  "message": "Password changed successfully",
  "token": "permanent_jwt_token",
  "redirect": "/admin/dashboard"
}
```

#### 3. Subsequent Logins
```javascript
// Request
POST /api/admin/login
{
  "email": "admin@example.com",
  "password": "MyNewSecurePassword123"
  // No secretKey required after first password change
}

// Response
{
  "success": true,
  "token": "jwt_token",
  "redirect": "/admin/dashboard"
}
```

## City-Based Labour Management

### Admin View (Filtered by City)
```javascript
// Admin in Mumbai can only see Mumbai labours
GET /api/admin/labours
Headers: { Authorization: "Bearer admin_token" }

// Response
{
  "success": true,
  "labours": [
    {
      "id": "...",
      "name": "Labour 1",
      "city": "Mumbai",
      "skills": ["plumbing"]
    }
    // Only Mumbai labours
  ]
}
```

### SuperAdmin View (All Cities)
```javascript
// SuperAdmin sees all labours across cities
GET /api/admin/labours
Headers: { Authorization: "Bearer superadmin_token" }

// Response includes labours from all cities
```

## Security Features

### Password Protection
- Temporary password `SuperAdmin@123` only works for first login
- Password change is enforced before accessing any other features
- New password cannot be the same as temporary password
- Minimum password length: 6 characters

### Token Management
- Temporary tokens have `requirePasswordChange: true` flag
- Middleware blocks access to protected routes until password is changed
- New permanent tokens are issued after successful password change

### City Isolation
- Admins can only access labours in their assigned city
- Database queries are automatically filtered by city
- SuperAdmins bypass city restrictions

## Testing

### Run Authentication Tests
```bash
npm run test:admin-auth
```

### Manual Testing Steps
1. Create admin: `npm run create:temp-admin "Test Admin" test@example.com Mumbai`
2. Login with temporary password
3. Try accessing protected route (should fail)
4. Change password
5. Login with new password
6. Access protected routes (should work)
7. Verify city-based labour filtering

## Error Handling

### Common Errors
- `requirePasswordChange: true` - Password change needed
- `Invalid credentials` - Wrong email/password
- `Admin has no assigned city` - Admin missing city assignment
- `Cannot use the temporary password as your new password` - Trying to reuse temp password

## Migration Notes

### Existing Admins
Existing admins in the system will need:
1. `assignedCity` field to be set
2. `temporaryPassword` set to `false` if they have already changed their password
3. `isFirstLogin` and `mustChangePassword` set appropriately

### Database Migration Script
```javascript
// Update existing admins
await Admin.updateMany(
  { assignedCity: { $exists: false } },
  {
    $set: {
      assignedCity: 'DefaultCity', // Set appropriate city
      temporaryPassword: false,
      isFirstLogin: false,
      mustChangePassword: false,
      passwordChangedAt: new Date()
    }
  }
);

// Update existing labours
await Labour.updateMany(
  { city: { $exists: false } },
  { $set: { city: 'DefaultCity' } }
);
```

## Scripts Reference

- `npm run create:temp-admin <name> <email> <city>` - Create admin with temporary password
- `npm run test:admin-auth` - Run authentication flow tests
- `npm run dev` - Start development server
- `npm run start` - Start production server

## Support

For issues or questions about the admin authentication system, please refer to the test files and implementation details in the codebase.