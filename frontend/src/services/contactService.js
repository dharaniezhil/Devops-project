// frontend/src/service/contactService.js
import { contactAPI, apiHelpers } from './api';

// Send contact message
export const sendContactMessage = async (data) => {
    try {
        const response = await contactAPI.sendMessage(data);
        return response;
    } catch (error) {
        const errorInfo = apiHelpers.handleError(error);
        throw new Error(errorInfo.message);
    }
};

// Get contact messages (for admin use)
export const getContactMessages = async (params = {}) => {
    try {
        const response = await contactAPI.getMessages(params);
        return response;
    } catch (error) {
        const errorInfo = apiHelpers.handleError(error);
        throw new Error(errorInfo.message);
    }
};

// Update contact message status (for admin use)
export const updateContactStatus = async (id, status, adminResponse = '') => {
    try {
        const response = await contactAPI.updateStatus(id, status, adminResponse);
        return response;
    } catch (error) {
        const errorInfo = apiHelpers.handleError(error);
        throw new Error(errorInfo.message);
    }
};

// Get contact statistics (for admin use)
export const getContactStats = async () => {
    try {
        const response = await contactAPI.getStats();
        return response;
    } catch (error) {
        const errorInfo = apiHelpers.handleError(error);
        throw new Error(errorInfo.message);
    }
};

// Helper function to validate contact form data
export const validateContactData = (data) => {
    const errors = {};

    if (!data.name || data.name.trim().length < 2) {
        errors.name = 'Name must be at least 2 characters long';
    }

    if (!data.email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(data.email)) {
        errors.email = 'Please enter a valid email address';
    }

    if (!data.message || data.message.trim().length < 10) {
        errors.message = 'Message must be at least 10 characters long';
    }

    if (data.message && data.message.length > 1000) {
        errors.message = 'Message cannot exceed 1000 characters';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};