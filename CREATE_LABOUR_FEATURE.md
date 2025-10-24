# Create Labour Feature - Complete Documentation

## 📋 Overview

This feature allows authenticated admins to create labour accounts with auto-filled location details. Labours can then log in using either their **Email** or **Identity Key** (6-character alphanumeric code) along with their password.

---

## 🎯 Key Features

### ✅ Admin Features:
- Create labour accounts with full validation
- Auto-fill city from admin's assigned city
- Generate random Identity Key (6 characters)
- Generate strong passwords automatically
- Show/hide password toggle
- Copy credentials to clipboard
- Validate email, phone, and Identity Key uniqueness
- Optional district and pincode fields

### ✅ Labour Features:
- Login with **Email OR Identity Key**
- Identity Key is exactly 6 alphanumeric characters
- All login credentials are securely hashed
- JWT-based authentication
- Access to labour dashboard after login

---

## 🗂️ Changes Made

### **Backend Changes**

#### 1. **Updated Labour Model** (`backend/src/models/Labour.js`)

**Added fields:**
```javascript
identityKey: {
  type: String,
  required: true,
  unique: true,
  uppercase: true,
  minlength: 6,
  maxlength: 6,
  validate: /^[A-Z0-9]{6}$/
}

district: { type: String, default: '' }
pincode: { type: String, validate: /^[0-9]{6}$/ }
createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
```

**Updated phone field:**
- Made unique
- Added validation for 10 digits

#### 2. **Created Labour Creation Controller** (`backend/src/controllers/adminController.js`)

**New function:** `createLabour`

**Features:**
- Validates all required fields (name, email, phone, identityKey, password)
- Checks uniqueness of email, phone, and identityKey
- Auto-fills city from admin's `assignedCity`
- Hashes password using bcrypt (pre-save hook)
- Returns detailed labour information

**Validations:**
- Name: minimum 2 characters
- Phone: exactly 10 digits, unique
- Email: valid format, unique
- Identity Key: exactly 6 alphanumeric characters, unique
- Password: minimum 6 characters
- Pincode (optional): exactly 6 digits

#### 3. **Added Route** (`backend/src/routes/admin.js`)

```javascript
POST /api/admin/labours/create
// Authentication: Required (Admin JWT token)
// Authorization: requireAdmin middleware
```

#### 4. **Updated Labour Login** (`backend/src/routes/labour.js`)

**Modified:** `POST /api/labour/login`

**Now supports two login methods:**

1. **Login with Email:**
```json
{
  "identifier": "labour@example.com",
  "password": "Password123"
}
```

2. **Login with Identity Key:**
```json
{
  "identifier": "ABC123",
  "password": "Password123"
}
```

**Logic:**
- Checks if input is 6 alphanumeric characters → Identity Key
- Otherwise → Email
- Validates password
- Returns JWT token on success

---

### **Frontend Changes**

#### 1. **Created CreateLabour Component** (`frontend/src/pages/admin/CreateLabour/CreateLabour.jsx`)

**Features:**
- Fetches admin's assigned city via `/api/admin/me`
- Auto-fills city field (read-only display)
- Form fields:
  - Full Name (required)
  - Phone Number (required, 10 digits, numeric only)
  - Email (required, valid format)
  - Identity Key (required, 6 characters, auto-uppercase)
  - Password (required, min 6 chars, show/hide toggle)
  - District (optional)
  - Pincode (optional, 6 digits)

**Helper Functions:**
- `generateIdentityKey()` - Random 6-char alphanumeric ID
- `generatePassword()` - Strong 10-char password with symbols
- `copyToClipboard()` - Copy credentials to clipboard
- `validateForm()` - Frontend validation before submission

**User Experience:**
- Real-time validation
- Error messages below each field
- Generate buttons for Identity Key and Password
- Copy buttons for credentials
- Reset form button
- Success toast with credentials
- Auto-navigate to labour list after 2 seconds

#### 2. **Created CSS Styling** (`frontend/src/pages/admin/CreateLabour/CreateLabour.css`)

**Design:**
- Gradient background (purple theme)
- Card-based layout
- Responsive design (mobile-friendly)
- Button animations on hover
- Error states with red borders
- Field hints for guidance
- Clean, modern UI

#### 3. **Updated App Routes** (`frontend/src/App.jsx`)

**Added route:**
```javascript
<Route path="/admin/create-labour" element={
  <AdminRoute><CreateLabour /></AdminRoute>
} />
```

**Protection:** AdminRoute ensures only authenticated admins can access

---

## 📡 API Documentation

### **1. Create Labour Account**

```
POST /api/admin/labours/create
```

**Headers:**
```json
{
  "Authorization": "Bearer <admin_jwt_token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "9876543210",
  "email": "john@example.com",
  "identityKey": "ABC123",
  "password": "SecurePass123",
  "district": "North District",
  "pincode": "123456"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Labour account created successfully. Login credentials are ready.",
  "labour": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "identityKey": "ABC123",
    "role": "labour",
    "status": "active",
    "city": "Mumbai",
    "district": "North District",
    "pincode": "123456",
    "createdAt": "2025-10-22T08:44:43.000Z"
  }
}
```

**Error Responses:**

**400 - Validation Error:**
```json
{
  "success": false,
  "message": "Phone number must be exactly 10 digits"
}
```

**409 - Duplicate Entry:**
```json
{
  "success": false,
  "message": "Email address is already registered"
}
```

**401 - Unauthorized:**
```json
{
  "success": false,
  "message": "No token provided"
}
```

---

### **2. Labour Login**

```
POST /api/labour/login
```

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body (Email Login):**
```json
{
  "identifier": "john@example.com",
  "password": "SecurePass123"
}
```

**Request Body (Identity Key Login):**
```json
{
  "identifier": "ABC123",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "identityKey": "ABC123",
    "role": "labour"
  },
  "redirect": "/labour/dashboard"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials or account is inactive"
}
```

---

## 🧪 Testing Checklist

### **Backend Tests**

- [ ] Create labour with all valid fields → Success (201)
- [ ] Create labour with duplicate email → Error (409)
- [ ] Create labour with duplicate phone → Error (409)
- [ ] Create labour with duplicate Identity Key → Error (409)
- [ ] Create labour with invalid phone (9 digits) → Error (400)
- [ ] Create labour with invalid Identity Key (5 chars) → Error (400)
- [ ] Create labour with weak password (3 chars) → Error (400)
- [ ] Create labour without admin token → Error (401)
- [ ] Labour login with email → Success (200)
- [ ] Labour login with Identity Key → Success (200)
- [ ] Labour login with wrong password → Error (401)
- [ ] Labour login with non-existent email → Error (401)
- [ ] Verify password is hashed in database
- [ ] Verify city auto-filled from admin's assignedCity
- [ ] Verify JWT token includes labour ID and role

### **Frontend Tests**

- [ ] Navigate to `/admin/create-labour` as admin → Page loads
- [ ] Navigate to `/admin/create-labour` without auth → Redirect to login
- [ ] Admin city displays correctly at top of form
- [ ] Generate Identity Key button → Creates 6-char code
- [ ] Generate Password button → Creates strong password
- [ ] Copy button copies to clipboard
- [ ] Show/Hide password toggle works
- [ ] Phone field accepts only numbers (10 max)
- [ ] Identity Key auto-uppercases input
- [ ] Pincode field accepts only numbers (6 max)
- [ ] Validation errors show below fields
- [ ] Submit with empty fields → Shows validation errors
- [ ] Submit with valid data → Success toast + redirect
- [ ] Reset button clears form
- [ ] Responsive design on mobile devices

---

## 🚀 Usage Guide

### **For Admins:**

1. **Login to Admin Panel**
   - Go to `/admin/login`
   - Enter credentials

2. **Navigate to Create Labour**
   - Go to `/admin/create-labour`
   - Or click "Create Labour" link in dashboard (if added)

3. **Fill in Labour Details**
   - Enter full name
   - Enter 10-digit phone number
   - Enter email address
   - Click "Generate" for Identity Key (or enter manually)
   - Click "Generate" for Password (or enter manually)
   - Optionally enter district and pincode

4. **Review Auto-filled City**
   - City is automatically set from your admin account
   - Displayed at top of form

5. **Submit Form**
   - Click "Create Labour"
   - Wait for success message
   - Copy credentials if needed
   - Auto-redirects to labour list

### **For Labours:**

1. **Login to Labour Portal**
   - Go to `/labour/login`

2. **Choose Login Method**

   **Option A: Email Login**
   - Enter email address
   - Enter password
   - Click Login

   **Option B: Identity Key Login**
   - Enter 6-character Identity Key (e.g., ABC123)
   - Enter password
   - Click Login

3. **Access Dashboard**
   - After successful login, redirects to `/labour/dashboard`
   - JWT token stored in localStorage
   - Session valid for 7 days

---

## 🔒 Security Features

1. **Password Hashing:**
   - Passwords hashed with bcrypt (12 rounds)
   - Pre-save hook in Labour model
   - Never stored in plain text

2. **JWT Authentication:**
   - Token expires in 7 days
   - Includes labour ID, role, and actorType
   - Required for accessing protected routes

3. **Input Validation:**
   - Frontend validation (immediate feedback)
   - Backend validation (security layer)
   - Prevents SQL injection, XSS attacks

4. **Uniqueness Checks:**
   - Email must be unique
   - Phone must be unique
   - Identity Key must be unique

5. **Admin Authorization:**
   - Only admins can create labour accounts
   - Requires valid JWT token
   - `requireAdmin` middleware enforces this

6. **City Assignment:**
   - Labour's city automatically matches admin's city
   - Prevents manual manipulation
   - Ensures proper geographical assignment

---

## 📝 Database Schema

### **Labour Collection:**

```javascript
{
  _id: ObjectId,
  name: String (required, 2-50 chars),
  email: String (required, unique, lowercase),
  phone: String (required, unique, 10 digits),
  identityKey: String (required, unique, 6 chars, uppercase),
  password: String (hashed, required, min 6 chars),
  role: String (default: 'labour'),
  skills: Array<String> (default: []),
  status: String (enum: ['active', 'inactive'], default: 'active'),
  city: String (required),
  district: String (optional),
  pincode: String (optional, 6 digits),
  createdBy: ObjectId (ref: 'Admin'),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

### **Indexes:**
- email (unique)
- phone (unique)
- identityKey (unique)

---

## 🐛 Troubleshooting

### **Issue: "Admin has no assigned city"**

**Cause:** Admin account doesn't have `assignedCity` field set

**Solution:**
```bash
# Run migration script
cd backend
npm run migrate:admin-city
```

Or manually update admin in database:
```javascript
db.admins.updateOne(
  { email: 'admin@example.com' },
  { $set: { assignedCity: 'Mumbai' } }
)
```

---

### **Issue: "Duplicate key error on identityKey"**

**Cause:** Generated Identity Key already exists

**Solution:**
- Frontend: Click "Generate" again for new key
- Backend: Already handles this with proper error message

---

### **Issue: "Labour login fails with Identity Key"**

**Cause:** Identity Key not uppercase or invalid format

**Solution:**
- Ensure Identity Key is exactly 6 characters
- Check if it's alphanumeric (A-Z, 0-9)
- Try login with email instead

---

### **Issue: "Token expired" after password change"**

**Cause:** Related to admin password change flow

**Solution:** Refer to `AUTO_LOGOUT_FIX.md` for complete fix

---

## 🔄 Future Enhancements

### **Planned Features:**

1. **Email/SMS Notifications:**
   - Send credentials to labour's email/phone after creation
   - Use services like SendGrid, Twilio

2. **Bulk Labour Creation:**
   - Upload CSV file with multiple labours
   - Validate and create in batch

3. **Labour Profile Pictures:**
   - Upload image during creation
   - Display in labour list and profile

4. **Skill Assignment:**
   - Multi-select skill tags
   - Match complaints with labour skills

5. **QR Code for Identity Key:**
   - Generate QR code containing Identity Key
   - Labour can scan to auto-fill login

6. **Labour Account Activation:**
   - Send activation link to email
   - Labour must activate before first login

7. **Password Reset Flow:**
   - Forgot password functionality
   - Email-based reset link

8. **Audit Logs:**
   - Track who created which labour
   - Log all credential changes

---

## 📞 Support

If you encounter any issues:

1. Check browser console for errors
2. Check backend logs for detailed errors
3. Verify database connection
4. Ensure admin has `assignedCity` set
5. Review `AUTO_LOGOUT_FIX.md` for auth issues

---

## ✅ Summary

### **What Was Built:**

✅ Complete labour creation system
✅ Dual login support (Email + Identity Key)
✅ Auto-location filling from admin
✅ Password generation & show/hide
✅ Clipboard copy functionality
✅ Full validation (frontend + backend)
✅ Responsive UI with modern design
✅ Secure JWT authentication
✅ Protected admin routes
✅ Database schema with indexes

### **Files Created/Modified:**

**Backend:**
- ✅ `src/models/Labour.js` (updated)
- ✅ `src/controllers/adminController.js` (added createLabour)
- ✅ `src/routes/admin.js` (added route)
- ✅ `src/routes/labour.js` (updated login)

**Frontend:**
- ✅ `src/pages/admin/CreateLabour/CreateLabour.jsx` (new)
- ✅ `src/pages/admin/CreateLabour/CreateLabour.css` (new)
- ✅ `src/App.jsx` (added route)

**Documentation:**
- ✅ `CREATE_LABOUR_FEATURE.md` (this file)

---

🎉 **Feature is complete and ready to use!**
