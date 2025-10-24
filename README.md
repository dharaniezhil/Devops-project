# FixItFast - Full Stack Web Application

A comprehensive complaint management system built with React.js frontend and Node.js backend with MongoDB Atlas integration.

## 🚀 Project Structure

```
FixItFast/
├── frontend/                 # React.js Frontend Application
│   ├── src/                 # React source code
│   ├── public/              # Static assets & legacy files
│   ├── package.json         # Frontend dependencies
│   └── vite.config.js       # Vite configuration
│
├── backend/                 # Node.js Backend API
│   ├── src/                 # Backend source code
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Auth & validation
│   │   └── config/          # Configuration files
│   ├── package.json         # Backend dependencies
│   ├── server.js           # Main server file
│   └── test-*.js           # API test files
│
├── docs/                    # Documentation
│   ├── API documentation
│   ├── Setup guides
│   └── Feature specifications
│
├── .env                     # Environment variables
├── .env.example            # Environment template
└── README.md               # This file
```

## 🛠️ Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB Atlas account

### 1. Setup Backend
```bash
cd backend
npm install
npm run dev
```
Backend runs on: `http://localhost:5000`

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: `http://localhost:5173`

### 3. Environment Configuration
Copy `.env.example` to `.env` and configure:
```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

## 🎯 Features

### 👨‍💼 Admin Features
- Admin Dashboard with analytics
- User & Labour management
- Complaint assignment & tracking
- Reports & analytics
- **Admin Profile Management** with password change
- Role-based access control

### 👤 User Features  
- User registration & authentication
- Complaint lodging system
- Complaint tracking & status updates
- Profile management
- Community feed

### 🔧 Labour Features
- Labour registration & profiles
- Assigned complaint management
- Status updates & completion
- Skill-based assignment

## 🔐 Authentication & Security

- JWT-based authentication
- Role-based authorization (User, Admin, SuperAdmin, Labour)
- Password encryption with bcrypt
- Protected routes and API endpoints
- Input validation and sanitization

## 📱 Technology Stack

### Frontend
- React.js 19+
- Vite (build tool)
- React Router DOM
- Axios (HTTP client)
- CSS3 with modern features

### Backend
- Node.js & Express.js
- MongoDB Atlas (Database)
- Mongoose (ODM)
- JWT Authentication
- bcryptjs (Password hashing)
- Express Validator

## 📖 API Documentation

The API provides full CRUD operations for:
- User management
- Complaint management  
- Admin operations
- Labour assignment
- Authentication & authorization

See `/docs` folder for detailed API documentation.

## 🧪 Testing

### Backend Tests
```bash
cd backend
node test-admin-profile.js     # Test admin profile functionality
node test-labour-workflow.js   # Test labour workflows
node test-registration.js      # Test user registration
```

### Frontend Testing
```bash
cd frontend
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🚀 Deployment

### Backend Deployment
1. Configure production environment variables
2. Build and deploy to your preferred hosting service
3. Ensure MongoDB Atlas is accessible

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy the `dist` folder to static hosting
3. Configure API endpoints for production

## 📝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the `/docs` folder for detailed documentation
- Review API test files for usage examples
- Create an issue for bugs or feature requests

## 🔄 Recent Updates

- ✅ Implemented Admin Profile Management with password change
- ✅ Added professional avatar system (no image uploads needed)
- ✅ Organized project structure for better maintainability
- ✅ Enhanced security with JWT authentication
- ✅ Added comprehensive API testing suite