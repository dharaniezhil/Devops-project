# Quick Start Guide - Create Labour Feature

## 🚀 Getting Started

### Prerequisites
- Admin account with assigned city
- Backend server running
- Frontend dev server running
- MongoDB connected

---

## 📝 Quick Steps

### **1. Start Servers**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### **2. Login as Admin**

Navigate to: `http://localhost:3000/admin/login`

---

### **3. Create a Labour**

Navigate to: `http://localhost:3000/admin/create-labour`

**Fill in the form:**
- Name: `John Worker`
- Phone: `9876543210`
- Email: `john@worker.com`
- Identity Key: Click **"Generate"** → `ABC123`
- Password: Click **"Generate"** → `P@ssw0rd123`
- District (optional): `North District`
- Pincode (optional): `123456`

**City auto-fills from your admin account**

Click **"Create Labour"** ✅

---

### **4. Test Labour Login**

Navigate to: `http://localhost:3000/labour/login`

**Try both login methods:**

**Method 1 - Email:**
- Identifier: `john@worker.com`
- Password: `P@ssw0rd123`

**Method 2 - Identity Key:**
- Identifier: `ABC123`
- Password: `P@ssw0rd123`

Both should work! 🎉

---

## 🎯 Key Features

| Feature | Description |
|---------|-------------|
| **Identity Key** | 6-character alphanumeric login code |
| **Auto City** | Admin's city automatically assigned |
| **Password Tools** | Generate strong passwords, show/hide, copy |
| **Validation** | Real-time frontend + backend validation |
| **Dual Login** | Email OR Identity Key |
| **Security** | Bcrypt hashing, JWT tokens |

---

## 🔑 API Endpoints

### Create Labour
```bash
POST http://localhost:5000/api/admin/labours/create
Authorization: Bearer <admin_token>

{
  "name": "John Worker",
  "phone": "9876543210",
  "email": "john@worker.com",
  "identityKey": "ABC123",
  "password": "P@ssw0rd123"
}
```

### Labour Login
```bash
POST http://localhost:5000/api/labour/login

{
  "identifier": "ABC123",  # or email
  "password": "P@ssw0rd123"
}
```

---

## ✅ Testing Checklist

- [ ] Admin can access `/admin/create-labour`
- [ ] Form displays admin's city
- [ ] Generate buttons work for ID and password
- [ ] Copy buttons copy to clipboard
- [ ] Form validation shows errors
- [ ] Submit creates labour successfully
- [ ] Labour can login with email
- [ ] Labour can login with Identity Key
- [ ] Dashboard loads after labour login

---

## 🐛 Common Issues

### "Admin has no assigned city"
```bash
cd backend
npm run migrate:admin-city
```

### "Duplicate Identity Key"
Click **"Generate"** again for a new unique key

### "Invalid credentials"
- Check Identity Key is uppercase (ABC123)
- Verify password is correct
- Try email login instead

---

## 📱 Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/admin/create-labour` | Admin only | Create labour form |
| `/admin/labours` | Admin only | View all labours |
| `/labour/login` | Public | Labour login page |
| `/labour/dashboard` | Labour only | Labour dashboard |

---

## 🎨 UI Preview

```
┌─────────────────────────────────┐
│   Create Labour Account         │
├─────────────────────────────────┤
│ Auto-filled City: Mumbai        │
├─────────────────────────────────┤
│ Full Name:     [____________]   │
│ Phone:         [__________]     │
│ Email:         [____________]   │
│ Identity Key:  [______] Generate│
│ Password:      [______] 👁 Gen  │
│ District:      [____________]   │
│ Pincode:       [______]         │
├─────────────────────────────────┤
│  [CREATE LABOUR]  [RESET FORM]  │
└─────────────────────────────────┘
```

---

## 📚 Documentation

For complete documentation, see: **`CREATE_LABOUR_FEATURE.md`**

For auth issues, see: **`AUTO_LOGOUT_FIX.md`**

---

## 💡 Pro Tips

1. **Use Generate buttons** - Creates strong, random credentials
2. **Copy credentials** - Click 📋 to copy to clipboard
3. **Save credentials** - Note them before redirecting
4. **Test both login methods** - Email and Identity Key
5. **Check console logs** - Credentials printed on success

---

## 🎉 Success!

If everything works:
- ✅ Labour created successfully
- ✅ Credentials displayed in toast
- ✅ Auto-redirected to labour list
- ✅ Labour can login immediately
- ✅ Dashboard loads after login

**Feature is ready to use! 🚀**
