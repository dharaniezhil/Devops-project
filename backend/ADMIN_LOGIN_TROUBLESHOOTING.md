# Admin Login "Page Not Found" Troubleshooting

## The Problem
You're getting a "page not found" error when trying to login as admin with the password `SuperAdmin@123`.

## Most Likely Causes

### 1. Wrong API Endpoint URL
Your frontend might be calling the wrong URL.

**❌ Wrong URLs (will cause 404):**
- `http://localhost:5000/admin/login`
- `http://localhost:3000/admin/login`
- `/admin/login` (missing base URL)

**✅ Correct URLs:**
- `http://localhost:5000/api/admin/login`
- `http://localhost:5000/api/admins/login`

### 2. Wrong Server Port
The server might be running on a different port than expected.

Check your terminal where you ran `npm run dev` - it should show:
```
🚀 Server running on port 5000
```

## Quick Tests

### Test 1: Check if server is running
Open a new terminal/PowerShell and run:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{"status":"ok","database":"connected"}
```

### Test 2: Test admin login endpoint
```bash
curl -X POST http://localhost:5000/api/admin/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"SuperAdmin@123\"}"
```

Expected response (401 error is normal):
```json
{"success":false,"message":"Invalid credentials"}
```

### Test 3: Using our test script
```bash
node test-admin-login-endpoint.js
```

## Frontend Configuration

### If you're using React/JavaScript frontend:

**Check your API configuration file** (usually in `/src/config/` or similar):

```javascript
// Make sure the base URL is correct
const API_BASE_URL = 'http://localhost:5000/api';

// Admin login function should be:
const adminLogin = async (email, password, secretKey) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/admin/login`, {
      email,
      password,
      secretKey  // Only required if not using temporary password
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
```

### If you're using fetch:

```javascript
const adminLogin = async (email, password) => {
  const response = await fetch('http://localhost:5000/api/admin/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};
```

## Create Test Admin

Before testing, create a test admin:

```bash
npm run create:temp-admin "Test Admin" test@admin.com Mumbai
```

Then try logging in with:
- Email: `test@admin.com`
- Password: `SuperAdmin@123`

## Common Solutions

### Solution 1: Check Network Tab in Browser
1. Open browser Developer Tools (F12)
2. Go to Network tab
3. Try logging in
4. Look for the login request
5. Check if the URL is correct

### Solution 2: Check Console for Errors
Look in browser console for JavaScript errors that might prevent the request from being sent.

### Solution 3: CORS Issues
If you see CORS errors, make sure your frontend is running on an allowed origin:
- `http://localhost:3000`
- `http://localhost:5173`
- `http://localhost:5174`

### Solution 4: Server Not Running
Make sure the backend server is running:
```bash
cd backend
npm run dev
```

Should see:
```
✅ Connected to MongoDB Atlas!
🚀 Server running on port 5000
```

## Testing with Postman/Insomnia

If you have Postman or Insomnia:

1. **Method:** POST
2. **URL:** `http://localhost:5000/api/admin/login`
3. **Headers:** 
   ```
   Content-Type: application/json
   ```
4. **Body (JSON):**
   ```json
   {
     "email": "test@admin.com",
     "password": "SuperAdmin@123"
   }
   ```

## Still Having Issues?

If you're still getting "page not found":

1. Check the exact error message in browser console
2. Verify the server is running and accessible
3. Check if there are any proxy settings in your frontend (like in `package.json` or vite.config.js)
4. Make sure you're not hitting any caching issues (try hard refresh: Ctrl+F5)

## Need More Help?

Run this command to get detailed endpoint information:
```bash
node test-admin-login-endpoint.js
```

This will test all possible combinations and tell you exactly which endpoint works.