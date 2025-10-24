const express = require("express");
const { body } = require("express-validator");
const { authenticateToken } = require("../middleware/auth");
const { register, login, getMe, logout } = require("../controllers/authController");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Dashboard = require("../models/Dashboard");

const router = express.Router();

// Validation middlewares
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 1 })
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
];

// Regular auth routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', authenticateToken, getMe);
router.post('/logout', logout);

module.exports = router;
