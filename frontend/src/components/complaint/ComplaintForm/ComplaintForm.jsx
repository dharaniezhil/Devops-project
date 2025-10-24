import React, { useState, useEffect } from 'react';
import axios from 'axios';

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken'); // or however you store your JWT
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const ComplaintForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'Medium',
    location: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [complaints, setComplaints] = useState([]);

  // Categories available in your backend
  const categories = [
    'Roads & Infrastructure',
    'Water Supply',
    'Electricity',
    'Sanitation',
    'Public Transport',
    'Healthcare',
    'Education',
    'Environment',
    'Safety & Security',
    'Other'
  ];

  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit complaint (CREATE)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('🚀 Submitting complaint:', formData);
      
      const response = await api.post('/complaints', formData);
      
      console.log('✅ Complaint submitted successfully:', response.data);
      
      setMessage({
        type: 'success',
        text: response.data.message || 'Complaint lodged successfully!'
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        priority: 'Medium',
        location: ''
      });
      
      // Refresh complaints list
      fetchComplaints();
      
    } catch (error) {
      console.error('❌ Error submitting complaint:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0] || 
                          'Failed to submit complaint. Please try again.';
      
      setMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's complaints (READ)
  const fetchComplaints = async () => {
    try {
      console.log('🔄 Fetching complaints...');
      
      const response = await api.get('/complaints');
      
      console.log('✅ Complaints fetched:', response.data);
      
      // Handle both possible response formats
      const complaintsData = response.data.data || response.data.complaints || [];
      setComplaints(complaintsData);
      
    } catch (error) {
      console.error('❌ Error fetching complaints:', error);
      
      const errorMessage = error.response?.data?.message || 'Failed to fetch complaints';
      setMessage({
        type: 'error',
        text: errorMessage
      });
    }
  };

  // Load complaints when component mounts
  useEffect(() => {
    fetchComplaints();
  }, []);

  return (
    <div className="complaint-container">
      <h2>Lodge a Complaint</h2>
      
      {/* Message Display */}
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Complaint Form */}
      <form onSubmit={handleSubmit} className="complaint-form">
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            minLength={5}
            maxLength={200}
            placeholder="Brief title for your complaint (5-200 characters)"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            minLength={10}
            maxLength={1000}
            rows={4}
            placeholder="Detailed description of your complaint (10-1000 characters)"
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
          >
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
          >
            {priorities.map(priority => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="location">Location *</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            required
            minLength={2}
            placeholder="Location where the issue occurred"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="submit-btn"
        >
          {loading ? 'Submitting...' : 'Lodge Complaint'}
        </button>
      </form>

      {/* Complaints List */}
      <div className="complaints-list">
        <h3>Your Complaints ({complaints.length})</h3>
        
        {complaints.length === 0 ? (
          <p>No complaints found. Lodge your first complaint above!</p>
        ) : (
          <div className="complaints-grid">
            {complaints.map(complaint => (
              <div key={complaint._id} className="complaint-card">
                <h4>{complaint.title}</h4>
                <p className="description">{complaint.description}</p>
                <div className="complaint-meta">
                  <span className={`status ${complaint.status.toLowerCase().replace(' ', '-')}`}>
                    {complaint.status}
                  </span>
                  <span className="category">{complaint.category}</span>
                  <span className="priority">{complaint.priority}</span>
                  <span className="location">📍 {complaint.location}</span>
                </div>
                <div className="complaint-date">
                  {new Date(complaint.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintForm;
