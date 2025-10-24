# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

FixItFast is a comprehensive complaint management system with location-based separation between Users, Admins, and Labours. The system enables citizens to lodge complaints, admins to manage and assign them, and labours to resolve them - all filtered by geographical location (city, district, pincode).

## Commands

### Backend Development

```bash
# Start development server with auto-reload
cd backend
npm run dev

# Start production server
npm start

# Seed database with SuperAdmin
npm run seed:superadmin

# Create temporary admin account
npm run create:temp-admin

# Fix admin passwords
npm run fix:admin-pw
npm run fix:superadmin-pw

# Migrate admin cities
npm run migrate:admin-city

# Run specific API tests
npm run test:admin-auth
npm run test:login-after-change
```

**Backend runs on:** `http://localhost:5000`

### Frontend Development

```bash
# Start development server
cd frontend
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

**Frontend runs on:** `http://localhost:5173`

### Running Tests

There are no automated test suites (no jest/mocha). Testing is done through:
1. Manual API testing using the test scripts in `backend/` (e.g., `test-admin-profile.js`)
2. Running the backend development server and using frontend UI
3. Direct API calls with tools like curl/Postman

## Architecture

### High-Level System Design

**Three-Actor Model:** The system has three distinct user types with role-based access:
- **Users (Citizens):** Lodge complaints, track status, view community feed
- **Admins:** Manage complaints, assign to labours, view reports - **filtered by assigned city**
- **Labours:** Complete assigned tasks, update status, upload work photos - **filtered by city**

**Location-Based Filtering:** The core architectural principle is that complaints, admins, and labours are isolated by location:
- Each User has location info (city, district, pincode) stored in `location` object
- Each Admin has `assignedCity` field determining which complaints they see
- Each Labour has `city`, `district`, `pincode` fields inherited from their creating admin
- Complaints are linked to user's location and only visible to matching admin/labour

### Backend Architecture

**Technology Stack:**
- Node.js + Express.js REST API
- MongoDB Atlas (database: `fixitfast`)
- JWT authentication (7-day token expiry)
- Bcrypt password hashing (12 rounds)
- Cloudinary for image storage (optional - falls back to local)
- Multer for file uploads

**Key Models** (`backend/src/models/`):
- `User.js`: Citizens with location object (country, state, city, address, pincode)
- `Admin.js`: Admins with `assignedCity` field, password change tracking
- `Labour.js`: Workers with city/district/pincode, identityKey (6-char login), createdBy ref
- `Complaint.js`: Complaints with status workflow, assignment tracking, work photos
- `Attendance.js`: Labour check-in/out system with leave tracking
- `LabourProfile.js` & `AdminProfile.js`: Extended profile data with location fields

**Authentication Flow:**
1. Users: Email/password → JWT token (actorType: 'user')
2. Admins: Email/password → JWT token (actorType: 'admin'), must change password on first login
3. Labours: Email OR IdentityKey (6-char) + password → JWT token (actorType: 'labour')

**Middleware** (`backend/src/middleware/auth.js`):
- `authenticateToken`: Verifies JWT, attaches `req.user`
- `requireAdmin`: Ensures user is admin/superadmin
- `requireSuperAdmin`: Ensures user is superadmin only
- `requireLabour`: Ensures user is labour
- `checkPasswordChangeRequired`: Redirects admin if `mustChangePassword` is true

**Key Routes:**
- `/api/auth`: User registration, login, profile
- `/api/admin`: Admin dashboard, complaint management, labour creation
- `/api/labour`: Labour login, assigned complaints, attendance
- `/api/complaints`: CRUD operations for complaints
- `/api/superadmin`: SuperAdmin-specific operations

**Location-Based Filtering Logic:**
- When admin fetches complaints: filter by `admin.assignedCity`
- When admin creates labour: auto-fill labour's city from `admin.assignedCity`
- When user lodges complaint: inherit user's location (city, district, pincode)
- When admin assigns complaint: only show labours matching admin's city

### Frontend Architecture

**Technology Stack:**
- React 19.1.1 with functional components + hooks
- Vite (build tool)
- React Router DOM (client-side routing)
- Axios (HTTP client with interceptors)
- Context API for state management
- CSS3 with custom properties (theme variables)

**Context Providers** (`frontend/src/context/`):
- `AuthContext`: User authentication state
- `AdminAuthContext`: Admin authentication state
- `ComplaintContext`: Complaint data management
- `UserContext`: User profile data
- `ThemeContext`: Light/dark theme switching

**Route Protection** (`frontend/src/routes/`):
- `ProtectedRoute`: Requires user authentication
- `AdminRoute`: Requires admin authentication
- `SuperAdminRoute`: Requires superadmin authentication

**Key Pages:**
- User: Dashboard, LodgeComplaint, MyComplaints, TrackStatus, Profile
- Admin: AdminDashboard, ManageComplaints, AssignComplaint, CreateLabour, Reports, AdminProfile
- Labour: LabourDashboard, AssignedComplaints, SimpleAttendance, LabourProfile

**Authentication Storage:**
- JWT tokens stored in `localStorage` (`token`, `adminToken`)
- Axios interceptors auto-attach Authorization header
- Token expiry handled with 401 response → redirect to login

### Database Schema Notes

**Location Fields in Collections:**

Users collection:
```js
location: {
  country: String,
  state: String,
  city: String,
  address: String,
  pincode: String,
  latitude: Number,
  longitude: Number
}
```

Admins collection:
```js
assignedCity: String  // e.g., "Egmore_Nungambakka"
```

Labours collection:
```js
city: String,          // inherited from admin
district: String,
pincode: String,
identityKey: String    // 6-char unique login ID
```

Complaints collection:
```js
// Currently lacks location fields - NEEDS TO BE ADDED per requirements
// Should have: city, district, pincode from user's location
```

**Important Indexes:**
- User.email (unique)
- Admin.email (unique)
- Labour.email, Labour.phone, Labour.identityKey (all unique)
- Complaint.status, Complaint.assignedTo

## Location-Based Separation Implementation

**Current Status:** Partially implemented. Labour model has location fields, Admin has `assignedCity`, but Complaint model is missing location fields.

**Required Changes for Full Implementation:**

1. **Update Complaint Model** (`backend/src/models/Complaint.js`):
   - Add fields: `city`, `district`, `pincode` (all type String, required)
   - On complaint creation, inherit from `user.location.city`, `user.location.district`, `user.location.pincode`

2. **Update Complaint Creation** (`backend/src/controllers/complaintController.js`):
   - Fetch user document to get location
   - Auto-fill complaint's city/district/pincode from user

3. **Update Admin Complaint Queries** (`backend/src/routes/admin.js`):
   - Add filter: `{ city: req.user.assignedCity }` when fetching complaints
   - Ensures admin sees only their city's complaints

4. **Update Labour Assignment** (`backend/src/routes/admin.js` or `complaints.js`):
   - When fetching available labours, filter by: `{ city: req.user.assignedCity }`
   - Prevents cross-city assignments

5. **Update User Registration** (`frontend/src/pages/auth/Register/Register.jsx`):
   - Add input fields for city, district, pincode
   - Store in user's location object

**Testing Approach:**
- Create test users in different cities (Egmore_Nungambakka, Saidapet)
- Lodge complaints and verify admin sees only their city's complaints
- Test labour assignment respects city boundaries
- Use admin credentials:
  - Egmore_Nungambakka: egmorenungambakka_chennai_admin@fixitfast.gov.in / Egmore_Nungambakka@123
  - Saidapet: saidapet_kanchipuram_admin@fixitfast.gov.in / Saidapet@123

## Important Development Notes

**Password Management:**
- Admins have temporary passwords on first login (`mustChangePassword: true`)
- After password change, new JWT token is issued
- Old tokens remain valid until expiry (7 days)

**Labour Creation:**
- Only admins can create labours via `/api/admin/labours/create`
- Labour's city is auto-filled from admin's `assignedCity`
- Labour can login with either email or 6-character `identityKey`
- Identity keys are auto-generated, must be unique, uppercase alphanumeric

**Attendance System:**
- Labours must check-in before receiving assignments
- Max 4 active tasks per labour
- Check-in/out tracked in Attendance collection
- Leave requests must be approved by admin

**File Uploads:**
- Supports Cloudinary (if configured) or local storage
- Work photos stored in complaint's `workPhotos` array
- Supporting documents in complaint's `attachments` array

**Status Workflow:**
- Complaint statuses: Pending → Assigned → In Progress → Resolved
- Labour requests status changes, admin approves
- Status history tracked in `statusHistory` array

## Common Development Patterns

**Adding a new protected route:**
1. Define route in `backend/src/routes/`
2. Add middleware: `authenticateToken`, `requireAdmin`, etc.
3. Create controller function in `backend/src/controllers/`
4. Add frontend route in `frontend/src/App.jsx` with appropriate guard (ProtectedRoute, AdminRoute, etc.)
5. Create React component in `frontend/src/pages/`

**Adding location filtering to a query:**
```js
const admin = await Admin.findById(req.user.id);
const complaints = await Complaint.find({ city: admin.assignedCity });
```

**Checking labour availability for assignment:**
```js
const availableLabours = await Labour.find({ 
  city: admin.assignedCity,
  status: 'active' 
});
```

**Inheriting user location in complaint:**
```js
const user = await User.findById(req.user.id);
const complaint = new Complaint({
  user: req.user.id,
  city: user.location.city,
  district: user.location.district,
  pincode: user.location.pincode,
  // ... other fields
});
```

## Environment Variables

Required in `backend/.env`:
```
MONGODB_URI=<MongoDB Atlas connection string>
JWT_SECRET=<secret key for JWT signing>
PORT=5000
CORS_ORIGIN=http://localhost:5173
CLOUDINARY_CLOUD_NAME=<optional>
CLOUDINARY_API_KEY=<optional>
CLOUDINARY_API_SECRET=<optional>
```

## Known Issues & Workarounds

- **Complaint model lacks location fields:** Must be added for full location-based filtering
- **Admin assignedCity migration:** Run `npm run migrate:admin-city` if admins have no city
- **Floating attendance button disabled:** Hooks error in FloatingAttendanceButton component (line 112 of App.jsx)
- **No automated tests:** Use manual testing and API test scripts
- **Token doesn't auto-refresh:** Tokens expire after 7 days, user must re-login

## Code Style & Conventions

- Use async/await for asynchronous operations (not .then())
- Controllers should return JSON responses with `{ success: boolean, message: string, data: object }`
- Frontend components use functional components with hooks (no class components)
- CSS uses custom properties for theming (`--primary-color`, `--background-color`, etc.)
- Error handling: try-catch in controllers, return 400/404/500 with descriptive messages
- Validation: Use express-validator in backend, HTML5 validation + JS in frontend
