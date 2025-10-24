# Labour Role System Implementation

This document describes the complete implementation of the Labour role system in the FixItFast complaint management application.

## Overview

The Labour role system extends the existing User, Admin, and SuperAdmin roles with a new **Labour** role that handles the actual execution of complaint resolution work.

## Architecture

### Roles Hierarchy
1. **SuperAdmin** - System owner, creates and manages all accounts
2. **Admin** - Supervisor, manages complaints and assigns work to labours
3. **Labour** - Worker, executes assigned tasks and updates complaint status
4. **User** - Citizen, raises complaints and tracks progress

### Workflow
```
User raises complaint → Admin assigns to Labour → Labour completes work → Admin marks resolved
```

## Database Changes

### Complaint Model Updates

The `Complaint` model has been enhanced with new fields to support Labour assignment:

```javascript
// New status values
status: ['Pending', 'Assigned', 'In Progress', 'Completed', 'Resolved', 'Rejected']

// Labour assignment fields
assignedTo: ObjectId (ref: 'Labour')      // Previously referenced 'User'
assignedBy: ObjectId (ref: 'Admin')       // Who assigned the complaint
assignedAt: Date                          // When it was assigned

// Work tracking fields
labourRemarks: String                     // Labour's work notes
workPhotos: [{                           // Photos of completed work
  url: String,
  filename: String,
  uploadedAt: Date,
  description: String
}]
workStartedAt: Date                       // When labour started work
workCompletedAt: Date                     // When labour completed work
```

### Labour Model

New collection `labours` with the following schema:

```javascript
{
  name: String (required),
  email: String (unique, required),
  password: String (hashed, required),
  skills: [String],                      // e.g., ['Plumbing', 'Electrical']
  status: String (enum: ['active', 'inactive']),
  timestamps: true
}
```

## API Endpoints

### SuperAdmin Endpoints (Labour Management)

- `POST /api/admins/labours` - Create new labour account
- `GET /api/admins/labours` - List all labours
- `PATCH /api/admins/labours/:id` - Update labour details
- `DELETE /api/admins/labours/:id` - Delete labour account

### Admin Endpoints (Complaint Assignment)

- `PUT /api/complaints/:id/assign` - Assign complaint to labour
- `GET /api/admins/labours` - List available labours for assignment
- `GET /api/complaints/stats/overview` - View complaint statistics (updated with new statuses)

### Labour Endpoints

- `POST /api/labour/login` - Labour login (separate from user/admin login)
- `GET /api/labour/complaints` - Get assigned complaints
- `GET /api/labour/complaints/:id` - Get specific complaint details
- `PUT /api/labour/complaints/:id/status` - Update complaint status (In Progress/Completed)
- `POST /api/labour/complaints/:id/photos` - Add work photos
- `GET /api/labour/profile` - Get labour profile

## Authentication & Authorization

### JWT Token Structure
Labour tokens include:
```javascript
{
  id: labourId,
  role: 'labour',
  actorType: 'labour'
}
```

### Middleware Functions
- `requireLabour` - Ensures user is authenticated as labour
- `requireLabourActor` - Checks actorType is 'labour'

## User Workflows

### SuperAdmin Workflow
1. Create Admin accounts via `/api/admins/create-admin`
2. Create Labour accounts via `/api/admins/labours`
3. Monitor system-wide complaint statistics
4. Manage all user accounts (activate/deactivate)

### Admin Workflow
1. Login with email, password, and secret key
2. View all complaints via `/api/complaints`
3. List available labours via `/api/admins/labours`
4. Assign complaints to labours via `/api/complaints/:id/assign`
5. Monitor complaint progress and statistics

### Labour Workflow
1. Login separately at `/api/labour/login`
2. View assigned complaints via `/api/labour/complaints`
3. Start work by updating status to "In Progress"
4. Add work photos for documentation
5. Mark complaint as "Completed" with remarks
6. View personal profile and work history

### User Workflow (Updated)
1. Raise complaints (status starts as "Pending")
2. Track complaint progress through new statuses:
   - Pending → Assigned → In Progress → Completed → Resolved
3. View assigned labour details and work photos

## Status Flow

```
Pending (User creates) 
    ↓
Assigned (Admin assigns to Labour)
    ↓
In Progress (Labour starts work)
    ↓
Completed (Labour finishes work)
    ↓
Resolved (Admin marks as resolved)
```

Alternative flows:
- Admin can mark complaints as "Rejected"
- Complaints can be reassigned to different labours

## Security Features

1. **Separate Authentication**: Labour login is completely separate from User/Admin
2. **Role-based Access Control**: Each role can only access their authorized endpoints
3. **Complaint Ownership**: Labours can only see/modify their assigned complaints
4. **Admin Oversight**: Admins can view all complaints and reassign if needed

## Testing

Use the provided test script to validate the complete workflow:

```bash
node test-labour-workflow.js
```

The test covers:
- Account creation for all roles
- Login authentication
- Complaint assignment process
- Labour work execution
- Status updates and tracking
- Photo attachments
- Statistics reporting

## Example Usage

### 1. SuperAdmin creates Labour account
```javascript
POST /api/admins/labours
Authorization: Bearer <superadmin_token>
{
  "name": "John Electrician",
  "email": "john@example.com", 
  "password": "password123",
  "skills": ["Electrical", "Street Lighting"]
}
```

### 2. Admin assigns complaint
```javascript
PUT /api/complaints/607f1f77bcf86cd799439011/assign
Authorization: Bearer <admin_token>
{
  "labourId": "607f1f77bcf86cd799439012",
  "note": "Electrical expert assigned for street light repair"
}
```

### 3. Labour updates status
```javascript
PUT /api/labour/complaints/607f1f77bcf86cd799439011/status
Authorization: Bearer <labour_token>
{
  "status": "In Progress",
  "remarks": "Started diagnosis, found faulty wiring"
}
```

### 4. Labour completes work
```javascript
PUT /api/labour/complaints/607f1f77bcf86cd799439011/status
Authorization: Bearer <labour_token>
{
  "status": "Completed", 
  "remarks": "Replaced faulty wiring, light is working properly"
}
```

## Frontend Integration Notes

The frontend should be updated to:

1. **Admin Dashboard**: 
   - Show labour management section
   - Display complaint assignment interface
   - Include new status indicators

2. **Labour Dashboard**:
   - Separate login page at `/labour/login`
   - Complaint list showing only assigned complaints
   - Status update interface
   - Photo upload functionality

3. **User Interface**:
   - Display assigned labour information
   - Show work progress with photos
   - Updated status indicators

4. **SuperAdmin Panel**:
   - Labour account management
   - System-wide statistics with new status breakdown

## Benefits

1. **Clear Accountability**: Every complaint has a clear chain of responsibility
2. **Work Tracking**: Photo documentation and timestamped progress
3. **Efficient Assignment**: Admins can assign based on labour skills
4. **Separate Access**: Labours only see their work, maintaining privacy
5. **Comprehensive Monitoring**: SuperAdmin has full system oversight

This implementation provides a complete work management system that scales from individual labour workers to large municipal complaint handling systems.