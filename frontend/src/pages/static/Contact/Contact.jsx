import React, { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import './Contact.css';
import TestEmailJS from '../../../TestEmailJS';

const Contact = () => {
  // Initialize EmailJS when component mounts
  useEffect(() => {
    if (import.meta.env.VITE_EMAILJS_PUBLIC_KEY) {
      emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
      console.log('EmailJS initialized');
    } else {
      console.error('EmailJS public key not found in environment variables');
    }
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or null
  const [submitMessage, setSubmitMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Helper function to validate contact form data
  const validateContactData = (data) => {
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors and status
    setFormErrors({});
    setSubmitStatus(null);
    setSubmitMessage('');
    
    // Validate form data
    const validation = validateContactData(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Debug: Check environment variables
      console.log('EmailJS Config:', {
        serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
        templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      });

      // Map form data to EmailJS template variables
      const templateParams = {
        user_name: formData.name,
        user_email: formData.email,
        message: formData.message,
        timestamp: new Date().toLocaleString(),
        subject: "New Contact Form Submission"
      };

      console.log('Template params:', templateParams);

      // Send email using EmailJS
      const result = await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        templateParams
      );
      
      console.log('EmailJS success:', result);
      
      setSubmitStatus('success');
      setSubmitMessage('Message sent successfully!');
      setFormData({ name: '', email: '', message: '' }); // Clear form
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSubmitStatus(null);
        setSubmitMessage('');
      }, 5000);
      
    } catch (error) {
      console.error('EmailJS error:', error);
      console.error('Error details:', {
        status: error.status,
        text: error.text,
        message: error.message
      });
      
      setSubmitStatus('error');
      setSubmitMessage('Failed to send message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-container">
      <TestEmailJS />
      <div className="contact-hero">
        <h1>Contact Us</h1>
        <p>We'd love to hear from you</p>
      </div>

      <div className="contact-content">
        <div className="contact-info">
          <h2>Get in Touch</h2>
          <div className="contact-methods">
            <div className="contact-method">
              <div className="method-icon">📧</div>
              <div>
                <h3>Email</h3>
                <p>fixitfast.contact@gmail.com</p>
                <small>We respond within 24 hours</small>
              </div>
            </div>
            
            <div className="contact-method">
              <div className="method-icon">📍</div>
              <div>
                <h3>Address</h3>
                <p>123 Tech Park, Bangalore</p>
                <small>Karnataka 560001, India</small>
              </div>
            </div>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <h2>Send Message</h2>
          
          {/* Success/Error Message Display */}
          {submitStatus && (
            <div className={`alert alert-${submitStatus === 'success' ? 'success' : 'error'}`}>
              <div className="alert-icon">
                {submitStatus === 'success' ? '✅' : '❌'}
              </div>
              <div className="alert-content">
                <p>{submitMessage}</p>
              </div>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="name">Your Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={formErrors.name ? 'error' : ''}
              required
            />
            {formErrors.name && <span className="error-text">{formErrors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={formErrors.email ? 'error' : ''}
              required
            />
            {formErrors.email && <span className="error-text">{formErrors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              rows="6"
              value={formData.message}
              onChange={handleChange}
              placeholder="Tell us how we can help..."
              className={formErrors.message ? 'error' : ''}
              required
            ></textarea>
            {formErrors.message && <span className="error-text">{formErrors.message}</span>}
          </div>

          <button 
            type="submit" 
            className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="loading-spinner"></span>
                Sending...
              </>
            ) : (
              'Send Message'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
