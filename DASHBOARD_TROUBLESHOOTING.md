# Real-Time Complaints Dashboard Troubleshooting Guide

## 🎯 **What Was Implemented**

### Backend Changes:
1. **New Admin API Endpoint**: Added `GET /api/admin/complaints` in `/backend/src/routes/admin.js`
   - Returns all complaints with full population (user, assignedTo, assignedBy)
   - Supports filtering by status, category, priority
   - Requires admin authentication

### Frontend Changes:
1. **Updated Dashboard Component**: `/frontend/src/components/Dashboard.jsx`
   - Added direct API call to fetch all complaints
   - Added auto-refresh every 30 seconds
   - Added real-time categorization by status
   - Added fallback API calls for reliability
   - Added comprehensive status sections

2. **Updated API Service**: `/frontend/src/services/api.js`
   - Added `adminAPI.getAllComplaints()` function

3. **Enhanced CSS**: Updated styling for new sections and status indicators

## 🔧 **Setup Instructions**

### 1. Start Backend Server
```bash
cd "C:\Users\harin\OneDrive\Documents\FIT Community\backend"
npm run dev
```

### 2. Start Frontend Server
```bash
cd "C:\Users\harin\OneDrive\Documents\FIT Community\frontend"
npm start
```

### 3. Login as Admin
- Navigate to admin login page
- Ensure you're logged in with admin credentials
- JWT token must be present in localStorage

## 🐛 **Common Issues & Solutions**

### Issue 1: "401 Unauthorized" Error
**Symptoms**: Dashboard shows no complaints, console shows 401 errors
**Solutions**:
1. Make sure you're logged in as an admin user
2. Check browser localStorage for `authToken`
3. Verify the token hasn't expired
4. Try logging out and logging back in

### Issue 2: Backend Server Not Running
**Symptoms**: Network errors, "ECONNREFUSED" in console
**Solutions**:
1. Check if backend is running on port 5000
2. Run: `netstat -ano | findstr :5000`
3. Start backend server if not running
4. Check MongoDB connection

### Issue 3: No Complaints Showing
**Symptoms**: Dashboard loads but shows 0 complaints
**Solutions**:
1. Check if there are actual complaints in MongoDB
2. Verify admin user has proper role permissions
3. Check browser console for API errors
4. Test the endpoint directly (see test script below)

### Issue 4: Auto-refresh Not Working
**Symptoms**: Complaints don't update automatically
**Solutions**:
1. Check if auto-refresh toggle is enabled (should show ✨ Auto-refresh ON)
2. Look for JavaScript errors in console
3. Verify the 30-second interval is running

## 🧪 **Testing the Implementation**

### Test Script
Run this from the main directory:
```bash
cd "C:\Users\harin\OneDrive\Documents\FIT Community"
node test-admin-complaints.js
```

### Manual Testing Steps
1. **Backend Test**:
   ```bash
   curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" http://localhost:5000/api/admin/complaints
   ```

2. **Frontend Test**:
   - Open browser dev tools (F12)
   - Go to admin dashboard
   - Check Console tab for logs starting with 🔄, ✅, or ❌
   - Check Network tab for API calls to `/api/admin/complaints`

## 📊 **Expected Behavior**

### When Working Correctly:
1. **Dashboard loads**: Shows statistics cards with real-time counts
2. **Complaints sections**: Organized by status (Pending, Assigned, In Progress, etc.)
3. **Auto-refresh indicator**: Shows "✨ Auto-refresh ON"
4. **Console logs**: Shows successful fetching messages
5. **Updates automatically**: New complaints appear within 30 seconds

### Status Sections Should Show:
- ⏳ **Pending**: New complaints waiting for assignment
- 📄 **Assigned**: Complaints assigned to workers
- 🔄 **In Progress**: Active complaints being worked on
- ✔️ **Completed**: Finished complaints
- ✅ **Resolved**: Fully resolved complaints  
- ❌ **Rejected**: Declined complaints

## 🔍 **Debugging Checklist**

### Frontend Debugging:
- [ ] Check browser console for error messages
- [ ] Verify authToken exists in localStorage
- [ ] Check Network tab for failed API requests
- [ ] Look for Dashboard debug logs (🚀, 📈, 🔄, ✅, ❌)
- [ ] Verify auto-refresh toggle state

### Backend Debugging:
- [ ] Backend server running on port 5000
- [ ] MongoDB connection successful
- [ ] Admin routes properly mounted
- [ ] Authentication middleware working
- [ ] Admin complaints endpoint accessible

### Authentication Debugging:
- [ ] User logged in with admin role
- [ ] JWT token not expired
- [ ] Authorization header being sent
- [ ] Admin permissions verified

## 📞 **Support Information**

If issues persist, check:
1. **Server logs**: Look for errors in backend terminal
2. **MongoDB**: Verify database connection and data
3. **Environment**: Check .env variables are correct
4. **Dependencies**: Ensure all npm packages are installed

## 🎉 **Success Indicators**

You'll know it's working when you see:
- Real-time complaint counts in stat cards
- Complaints organized by status sections
- Auto-refresh indicator active
- Console logs showing successful API calls
- New complaints appearing automatically
- Smooth updates without page refresh

---

**Implementation Date**: January 2025
**Status**: Ready for Testing
**Next Steps**: Start servers and test with admin account