const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT token
const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Generate random string
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Calculate time difference
const getTimeDifference = (date1, date2 = new Date()) => {
  const diffTime = Math.abs(date2 - date1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Format response
const formatResponse = (success, message, data = null) => {
  const response = { success, message };
  if (data) response.data = data;
  return response;
};

// Pagination helper
const getPaginationOptions = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return {
    skip: offset,
    limit: parseInt(limit)
  };
};

// Email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation
const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

module.exports = {
  generateToken,
  generateRandomString,
  getTimeDifference,
  formatResponse,
  getPaginationOptions,
  isValidEmail,
  isValidPhone
};
