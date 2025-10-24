import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useComplaint } from '../../../context/ComplaintContext';
import './LodgeComplaint.css';

// Google Maps configuration
// For demo purposes - replace with your actual Google Maps API key
// In Vite, environment variables use import.meta.env instead of process.env
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'DEMO_MODE';
const GOOGLE_MAPS_SCRIPT_URL = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
const DEMO_MODE = GOOGLE_MAPS_API_KEY === 'DEMO_MODE';

// Load Google Maps script
const loadGoogleMaps = () => {
  return new Promise((resolve, reject) => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      resolve(window.google);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google));
      existingScript.addEventListener('error', reject);
      return;
    }

    // Create and load the script
    const script = document.createElement('script');
    script.src = GOOGLE_MAPS_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => {
      if (window.google) {
        resolve(window.google);
      } else {
        reject(new Error('Google Maps failed to load'));
      }
    });
    script.addEventListener('error', reject);
    document.head.appendChild(script);
  });
};

const LodgeComplaint = () => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    priority: 'Medium',
    location: '',
    description: '',
    files: [],
    coordinates: { lat: null, lng: null }
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [animateFields, setAnimateFields] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 12.9716, lng: 77.5946 }); // Default to Bangalore
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLoadingMaps, setIsLoadingMaps] = useState(false);
  const [mapsError, setMapsError] = useState('');
  const [locationSuccess, setLocationSuccess] = useState('');
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const navigate = useNavigate();
  const { createComplaint } = useComplaint();

  useEffect(() => {
    setTimeout(() => setAnimateFields(true), 100);
    // Try to get user's current location on load
    getCurrentLocation();
  }, []);

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoadingMaps(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newCenter = { lat: latitude, lng: longitude };
          setMapCenter(newCenter);
          console.log('📍 Current location obtained:', newCenter);
          
          // Clear any previous errors and show success
          setMapsError('');
          setLocationSuccess('✅ Your current location has been detected and set automatically!');
          
          // Auto-hide success message after 4 seconds
          setTimeout(() => {
            setLocationSuccess('');
          }, 4000);
          
          // Automatically set this as the complaint location
          setSelectedLocation(newCenter);
          setFormData(prev => ({
            ...prev,
            coordinates: newCenter
          }));
          
          // Update map center if map is already loaded
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter(newCenter);
            updateMarkerPosition(newCenter);
            // Automatically reverse geocode the current location
            reverseGeocode(latitude, longitude);
          } else {
            // If map is not loaded yet, reverse geocode immediately
            reverseGeocodeWithoutMap(latitude, longitude);
          }
          
          setIsLoadingMaps(false);
        },
        (error) => {
          console.error('❌ Error getting location:', error);
          setIsLoadingMaps(false);
          // Show user-friendly error message
          let errorMessage = 'Unable to get your location. ';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Please allow location access and try again.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage += 'An unknown error occurred.';
              break;
          }
          setMapsError(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      setMapsError('Geolocation is not supported by this browser. Please enter your location manually.');
      console.log('Geolocation is not supported by this browser.');
    }
  };
  
  // Reverse geocode without requiring the map to be loaded (for immediate location detection)
  const reverseGeocodeWithoutMap = async (lat, lng) => {
    try {
      if (!DEMO_MODE) {
        // Use Google Maps Geocoding API directly
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`);
        const data = await response.json();
        
        if (data.status === 'OK' && data.results[0]) {
          const address = data.results[0].formatted_address;
          setFormData(prev => ({
            ...prev,
            location: address
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          }));
        }
      } else {
        // Demo mode - use coordinates
        setFormData(prev => ({
          ...prev,
          location: `Current Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
        }));
      }
      
      // Clear location error if it exists
      if (errors.location) {
        setErrors(prev => ({ ...prev, location: undefined }));
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      // Fallback to coordinates
      setFormData(prev => ({
        ...prev,
        location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      }));
    }
  };

  // Initialize Google Map or Demo Mode
  const initializeMap = async () => {
    if (!mapRef.current) return;
    
    setIsLoadingMaps(true);
    setMapsError('');
    
    try {
      if (DEMO_MODE) {
        // Demo mode - show a placeholder map
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.innerHTML = `
              <div style="
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: white;
                border-radius: 8px;
                font-family: inherit;
              ">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🗺️</div>
                <h3 style="margin: 0 0 1rem 0; font-size: 1.5rem;">Google Maps Demo Mode</h3>
                <p style="margin: 0; text-align: center; opacity: 0.9; max-width: 300px;">Add your Google Maps API key to enable full map functionality</p>
                <div style="margin-top: 2rem; padding: 1rem; background: rgba(255,255,255,0.1); border-radius: 8px; text-align: center; cursor: pointer;" onclick="
                  const lat = ${mapCenter.lat} + (Math.random() - 0.5) * 0.02;
                  const lng = ${mapCenter.lng} + (Math.random() - 0.5) * 0.02;
                  window.demoMapClick && window.demoMapClick(lat, lng);
                ">
                  <div style="font-size: 2rem; margin-bottom: 0.5rem;">📍</div>
                  <div>Click to simulate location selection</div>
                  <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.5rem;">Current: ${mapCenter.lat.toFixed(4)}, ${mapCenter.lng.toFixed(4)}</div>
                </div>
              </div>
            `;
            
            // Add demo click handler
            window.demoMapClick = (lat, lng) => {
              const location = { lat, lng };
              setSelectedLocation(location);
              setFormData(prev => ({
                ...prev,
                coordinates: location,
                location: `Demo Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
              }));
              
              if (errors.location) {
                setErrors(prev => ({ ...prev, location: undefined }));
              }
            };
          }
          setIsLoadingMaps(false);
        }, 1000);
        return;
      }
      
      await loadGoogleMaps();
      
      // Create map instance
      const map = new window.google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });
      
      mapInstanceRef.current = map;
      
      // Add click listener to map
      map.addListener('click', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        updateMarkerPosition({ lat, lng });
        reverseGeocode(lat, lng);
      });
      
      // Initialize with current location marker if available
      if (selectedLocation) {
        updateMarkerPosition(selectedLocation);
      }
      
      // Initialize Places Autocomplete
      initializeAutocomplete();
      
    } catch (error) {
      console.error('Error loading Google Maps:', error);
      setMapsError('Failed to load Google Maps. Please check your API key and internet connection.');
    } finally {
      setIsLoadingMaps(false);
    }
  };
  
  // Initialize Google Places Autocomplete
  const initializeAutocomplete = () => {
    const input = document.getElementById('location-search-input');
    if (!input || !window.google) return;
    
    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ['establishment', 'geocode'],
      componentRestrictions: { country: 'in' }, // Restrict to India
      fields: ['place_id', 'geometry', 'name', 'formatted_address']
    });
    
    autocompleteRef.current = autocomplete;
    
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) {
        console.log('No location details available for input: ', place.name);
        return;
      }
      
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const location = { lat, lng };
      
      // Update map center and marker
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter(location);
        mapInstanceRef.current.setZoom(17);
      }
      
      updateMarkerPosition(location);
      
      // Update form with selected address
      setFormData(prev => ({
        ...prev,
        location: place.formatted_address || place.name,
        coordinates: location
      }));
      
      if (errors.location) {
        setErrors(prev => ({ ...prev, location: undefined }));
      }
    });
  };
  
  // Update marker position
  const updateMarkerPosition = (location) => {
    if (!mapInstanceRef.current) return;
    
    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }
    
    // Create new marker
    const marker = new window.google.maps.Marker({
      position: location,
      map: mapInstanceRef.current,
      title: 'Complaint Location',
      animation: window.google.maps.Animation.DROP,
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        scaledSize: new window.google.maps.Size(40, 40)
      }
    });
    
    markerRef.current = marker;
    setSelectedLocation(location);
    setFormData(prev => ({
      ...prev,
      coordinates: location
    }));
  };
  
  // Reverse geocode using Google Maps API
  const reverseGeocode = (lat, lng) => {
    if (!window.google) return;
    
    const geocoder = new window.google.maps.Geocoder();
    const location = { lat, lng };
    
    geocoder.geocode({ location }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const address = results[0].formatted_address;
        setFormData(prev => ({
          ...prev,
          location: address
        }));
        
        if (errors.location) {
          setErrors(prev => ({ ...prev, location: undefined }));
        }
      } else {
        console.error('Geocoder failed due to: ', status);
        setFormData(prev => ({
          ...prev,
          location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        }));
      }
    });
  };

  // Toggle map visibility
  const toggleMap = async () => {
    const newShowMap = !showMap;
    setShowMap(newShowMap);
    
    // Initialize map when showing for the first time
    if (newShowMap && !mapInstanceRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(initializeMap, 100);
    }
  };

  // Keep these in sync with backend accepted values
  const categories = [
    { value: 'Roads & Infrastructure', label: '🛣️ Roads & Infrastructure' },
    { value: 'Water Supply', label: '💧 Water Supply' },
    { value: 'Electricity', label: '⚡ Electricity' },
    { value: 'Sanitation', label: '🧹 Sanitation' },
    { value: 'Public Transport', label: '🚌 Public Transport' },
    { value: 'Healthcare', label: '🏥 Healthcare' },
    { value: 'Education', label: '📚 Education' },
    { value: 'Environment', label: '🌿 Environment' },
    { value: 'Safety & Security', label: '🔒 Safety & Security' },
    { value: 'Other', label: '📌 Other' }
  ];

  const priorities = [
    { value: 'Low', label: '🟢 Low' },
    { value: 'Medium', label: '🟡 Medium' },
    { value: 'High', label: '🟠 High' },
    { value: 'Critical', label: '🔴 Critical' }
  ];

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required ✨';
    if (!formData.category) newErrors.category = 'Please select a category 💫';
    if (!formData.priority) newErrors.priority = 'Priority level is needed 🌟';
    if (!formData.location.trim()) newErrors.location = 'Location details required 📍';
    if (!formData.description.trim()) newErrors.description = 'Description is required 📝';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return Math.min(100, prev + Math.random() * 22 + 8);
      });
    }, 180);
    return () => clearInterval(interval);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    // Require auth token
    const token = localStorage.getItem('authToken');
    if (!token) {
      setApiError('Please sign in to submit a complaint.');
      navigate('/signin');
      return;
    }

    setLoading(true);
    const cleanup = simulateProgress();

    try {
      // Create FormData to handle file uploads
      const formDataToSend = new FormData();
      
      // Add text fields
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('category', formData.category);
      formDataToSend.append('priority', formData.priority);
      formDataToSend.append('location', formData.location.trim());
      
      // Add files if any
      if (formData.files && formData.files.length > 0) {
        for (let i = 0; i < formData.files.length; i++) {
          formDataToSend.append('supportingFiles', formData.files[i]);
        }
        console.log('📄 Added files to FormData:', formData.files.length);
      } else {
        console.log('📄 No files to upload');
      }

      // Debug: Log FormData contents
      console.log('📤 FormData contents:');
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0] + ':', pair[1]);
      }

      const result = await createComplaint(formDataToSend);
      
      if (result.success) {
        // Success flow
        setProgress(100);
        setShowSuccess(true);

        // Navigate to dashboard after showing success
        setTimeout(() => {
          setShowSuccess(false);
          clearForm();
          navigate('/dashboard');
        }, 1500);
      } else {
        throw new Error(result.error || 'Failed to submit complaint');
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to submit complaint';
      setApiError(message);
    } finally {
      cleanup();
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(d => ({ ...d, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: undefined }));
    setApiError('');
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setFormData(d => ({ ...d, files }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setFormData(d => ({ ...d, files }));
  };

  const clearForm = () => {
    setFormData({
      title: '',
      category: '',
      priority: 'Medium',
      location: '',
      description: '',
      files: [],
      coordinates: { lat: null, lng: null }
    });
    setErrors({});
    setApiError('');
    setProgress(0);
    setSelectedLocation(null);
    setShowMap(false);
    setMapsError('');
    setLocationSuccess('');
    
    // Clear Google Maps marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
    
    // Clear autocomplete input
    const input = document.getElementById('location-search-input');
    if (input) {
      input.value = '';
    }
  };

  return (
    <div className="lodgecomplaint-page theme-gradient-bg">
      {/* Progress Bar */}
      <div className={`progress-container theme-progress-bg ${loading ? 'active' : ''}`}>
        <div className="progress-bar theme-progress-bar" style={{ width: `${progress}%` }}>
          <div className="progress-shimmer"></div>
        </div>
      </div>

      {/* Floating Background Elements */}
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>

      {/* Header Section */}
      <div className="page-header">
        <div className="header-decoration">
          <span className="decoration-star">✨</span>
          <span className="decoration-heart">💖</span>
          <span className="decoration-star">✨</span>
        </div>
        <h1 className="page-title" style={{ color: 'white' }}>Lodge a New Complaint</h1>
        <p className="page-subtitle" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Help us make your community better, one report at a time 🌟</p>
      </div>

      {/* API error (auth/validation/server) */}
      {apiError && (
        <div className="error-banner">
          <span>⚠️ {apiError}</span>
        </div>
      )}

      {/* Main Form */}
      <form className="lodgecomplaint-form" onSubmit={handleSubmit}>
        <div className="form-container theme-card-elevated theme-glass">

          {/* Title */}
          <div className={`form-field-wrapper ${animateFields ? 'animate-in' : ''}`} style={{ animationDelay: '0.1s' }}>
            <label className="field-label">
              <span className="label-icon">📝</span>
              <span className="label-text">Complaint Title</span>
              <span className="required-star">*</span>
            </label>
            <div className="input-container">
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Brief summary of your concern..."
                className={`form-input theme-input ${errors.title ? 'error' : ''}`}
                required
              />
              <div className="input-decoration"></div>
            </div>
            {errors.title && <div className="error-message">{errors.title}</div>}
          </div>

          {/* Category + Priority */}
          <div className="form-row">
            <div className={`form-field-wrapper ${animateFields ? 'animate-in' : ''}`} style={{ animationDelay: '0.2s' }}>
              <label className="field-label">
                <span className="label-icon">🏷️</span>
                <span className="label-text">Category</span>
                <span className="required-star">*</span>
              </label>
              <div className="select-container">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`form-select theme-select ${errors.category ? 'error' : ''}`}
                  required
                >
                  <option value="">Choose a category...</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                <div className="select-arrow">▼</div>
              </div>
              {errors.category && <div className="error-message">{errors.category}</div>}
            </div>

            <div className={`form-field-wrapper ${animateFields ? 'animate-in' : ''}`} style={{ animationDelay: '0.3s' }}>
              <label className="field-label">
                <span className="label-icon">⚡</span>
                <span className="label-text">Priority</span>
                <span className="required-star">*</span>
              </label>
              <div className="select-container">
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className={`form-select theme-select ${errors.priority ? 'error' : ''}`}
                  required
                >
                  <option value="">Select priority...</option>
                  {priorities.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <div className="select-arrow">▼</div>
              </div>
              {errors.priority && <div className="error-message">{errors.priority}</div>}
            </div>
          </div>

          {/* Location with Google Maps */}
          <div className={`form-field-wrapper ${animateFields ? 'animate-in' : ''}`} style={{ animationDelay: '0.4s' }}>
            <label className="field-label">
              <span className="label-icon">📍</span>
              <span className="label-text">Location</span>
              <span className="required-star">*</span>
            </label>
            
            {/* Location Input with Google Places Autocomplete */}
            <div className="location-input-section">
              <div className="input-container">
                <input
                  type="text"
                  id="location-search-input"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder={isLoadingMaps && !showMap ? "Getting your location..." : "Search for address, landmark, or area..."}
                  className={`form-input theme-input ${errors.location ? 'error' : ''}`}
                  disabled={isLoadingMaps && !showMap}
                  required
                />
                <div className="input-decoration"></div>
                {isLoadingMaps && !showMap && (
                  <div className="input-loading">
                    <div className="loading-spinner"></div>
                  </div>
                )}
              </div>
              
              {/* Location detection feedback */}
              {isLoadingMaps && !showMap && (
                <div className="location-status">
                  <span className="status-icon">📍</span>
                  <span className="status-text">Detecting your current location...</span>
                </div>
              )}
              
              {mapsError && (
                <div className="location-error">
                  <span className="error-icon">⚠️</span>
                  <span className="error-text">{mapsError}</span>
                </div>
              )}
              
              {locationSuccess && (
                <div className="location-success">
                  <span className="success-icon">✅</span>
                  <span className="success-text">{locationSuccess}</span>
                </div>
              )}
              
              {/* Map Controls */}
              <div className="location-controls">
                <button
                  type="button"
                  onClick={toggleMap}
                  className="btn-map-toggle"
                  title="Toggle Google Maps"
                  disabled={isLoadingMaps && !showMap}
                >
                  <span className="btn-icon">🌍</span>
                  <span className="btn-text">{showMap ? 'Hide Google Maps' : 'Show Google Maps'}</span>
                </button>
                
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="btn-location"
                  title="Get Current Location"
                  disabled={isLoadingMaps}
                >
                  {isLoadingMaps && !showMap ? (
                    <>
                      <div className="loading-spinner small"></div>
                      <span className="btn-text">Getting Location...</span>
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">📍</span>
                      <span className="btn-text">Use My Location</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Selected coordinates display */}
            {selectedLocation && (
              <div className="coordinates-display">
                <span className="coordinates-label">📍 Selected Location:</span>
                <span className="coordinates-text">
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </span>
              </div>
            )}
            
            {/* Google Maps Container */}
            {showMap && (
              <div className="map-container">
                <div className="map-header">
                  <h3 className="map-title">🌍 Select Complaint Location</h3>
                  <div className="map-instructions">
                    Click anywhere on the map to set the location, or use the search box above
                  </div>
                </div>
                
                
                {/* Google Maps Loading */}
                {isLoadingMaps && (
                  <div className="maps-loading">
                    <div className="loading-spinner"></div>
                    <span>Loading Google Maps...</span>
                  </div>
                )}
                
                {/* Google Maps */}
                <div 
                  ref={mapRef}
                  className="google-maps"
                  style={{
                    width: '100%',
                    height: '400px',
                    borderRadius: '8px',
                    display: isLoadingMaps ? 'none' : 'block'
                  }}
                />
                
                {/* Map Actions */}
                <div className="map-actions">
                  <button
                    type="button"
                    onClick={() => setShowMap(false)}
                    className="btn btn-secondary"
                  >
                    ✖️ Close Map
                  </button>
                  
                  {selectedLocation && (
                    <button
                      type="button"
                      onClick={() => {
                        const googleMapsUrl = `https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}&z=17`;
                        window.open(googleMapsUrl, '_blank');
                      }}
                      className="btn btn-secondary"
                    >
                      🗺️ Open in Google Maps
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => {
                      if (mapInstanceRef.current && selectedLocation) {
                        mapInstanceRef.current.setCenter(selectedLocation);
                        mapInstanceRef.current.setZoom(18);
                      }
                    }}
                    className="btn btn-secondary"
                    disabled={!selectedLocation}
                  >
                    🎯 Center on Selection
                  </button>
                </div>
              </div>
            )}
            
            {errors.location && <div className="error-message">{errors.location}</div>}
          </div>

          {/* Description */}
          <div className={`form-field-wrapper ${animateFields ? 'animate-in' : ''}`} style={{ animationDelay: '0.5s' }}>
            <label className="field-label">
              <span className="label-icon">💬</span>
              <span className="label-text">Description</span>
              <span className="required-star">*</span>
            </label>
            <div className="textarea-container">
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide detailed information about the issue..."
                className={`form-textarea theme-textarea ${errors.description ? 'error' : ''}`}
                rows="4"
                required
              />
              <div className="input-decoration"></div>
            </div>
            {errors.description && <div className="error-message">{errors.description}</div>}
          </div>

          {/* File Upload (UI only in this version) */}
          <div className={`form-field-wrapper ${animateFields ? 'animate-in' : ''}`} style={{ animationDelay: '0.6s' }}>
            <label className="field-label">
              <span className="label-icon">📎</span>
              <span className="label-text">Supporting Files</span>
              <span className="optional-text">(Optional)</span>
            </label>
            <div
              className={`file-upload-area ${dragOver ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="upload-icon">📁</div>
              <div className="upload-text">
                <span className="primary-text">Drop files here or click to browse</span>
                <span className="secondary-text">Supports images and PDFs (Max 10MB each)</span>
              </div>
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="file-input"
              />
              {formData.files.length > 0 && (
                <div className="file-preview">
                  <div className="file-count">📄 {formData.files.length} file(s) selected</div>
                  <div className="file-list">
                    {Array.from(formData.files).map((file, index) => (
                      <div key={index} className="file-item-preview">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">({Math.round(file.size / 1024)}KB)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className={`form-actions ${animateFields ? 'animate-in' : ''}`} style={{ animationDelay: '0.7s' }}>
            <button
              type="button"
              onClick={clearForm}
              className="btn btn-secondary theme-btn-secondary"
              disabled={loading}
            >
              <span className="btn-icon">🗑️</span>
              <span className="btn-text">Clear Form</span>
            </button>
            <button
              type="submit"
              className="btn btn-primary theme-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span className="btn-text">Submitting...</span>
                </>
              ) : (
                <>
                  <span className="btn-icon">🚀</span>
                  <span className="btn-text">Submit Complaint</span>
                </>
              )}
              <div className="btn-ripple"></div>
            </button>
          </div>
        </div>
      </form>

      {/* Success Modal */}
      <div className={`success-modal ${showSuccess ? 'active' : ''}`}>
        <div className="success-content">
          <div className="success-animation">
            <div className="success-circle">
              <div className="success-checkmark">
                <svg viewBox="0 0 52 52" className="checkmark-svg">
                  <circle cx="26" cy="26" r="25" fill="none" className="checkmark-circle" />
                  <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" className="checkmark-check" />
                </svg>
              </div>
            </div>
          </div>
          <h2 className="success-title">Complaint Submitted! 🎉</h2>
          <p className="success-message">
            Thank you for making your community better! We'll review your complaint and get back to you soon. ✨
          </p>
          <div className="success-details">
            <span className="detail-item">📧 Confirmation email sent</span>
            <span className="detail-item">⏰ Response within 24-48 hours</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LodgeComplaint;
