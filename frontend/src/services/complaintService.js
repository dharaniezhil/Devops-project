// src/services/complaintService.js
import { complaintsAPI } from './api';

// List complaints with optional filters
export const listComplaints = async (filters = {}) => {
  // filters can include: page, limit, status, category, priority, location, user, sortBy, sortOrder
  const { data } = await complaintsAPI.getAll(filters);
  return data; // { success, complaints, pagination }
};

// Create a complaint (protected)
export const createComplaint = async (payload) => {
  // payload: { title, description, category, priority, location }
  const { data } = await complaintsAPI.create(payload);
  return data; // { success, message, complaint }
};

// Update a complaint by id (owner or admin; user only if Pending)
export const updateComplaint = async (id, updates) => {
  const { data } = await complaintsAPI.update(id, updates);
  return data; // { success, message, complaint }
};

// Update complaint status (admin/moderator)
export const updateComplaintStatus = async (id, status, note = '') => {
  const { data } = await complaintsAPI.updateStatus(id, status, note);
  return data; // { success, message, complaint }
};

// Delete a complaint (owner/admin; user only if Pending)
export const deleteComplaint = async (id) => {
  const { data } = await complaintsAPI.delete(id);
  return data; // { success, message }
};

// Toggle like on a complaint
export const toggleComplaintLike = async (id) => {
  const { data } = await complaintsAPI.like(id);
  return data; // { success, message, likes }
};

export const getUserComplaints = async (filters = {}) => {
  const { data } = await complaintsAPI.getUserComplaints(filters);
  return data; // { success, complaints, pagination }
};

export default {
  listComplaints,
  createComplaint,
  updateComplaint,
  updateComplaintStatus,
  deleteComplaint,
  toggleComplaintLike,
  getUserComplaints,   // ✅ added this one
};
