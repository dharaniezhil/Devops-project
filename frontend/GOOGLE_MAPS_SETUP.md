# 🌍 Google Maps Integration Setup Guide

## Overview
The Lodge Complaints page now features Google Maps integration for precise location selection. This guide will help you set up the Google Maps API key to enable full functionality.

## 🚀 Quick Start (Demo Mode)
The application currently runs in **Demo Mode** with a simulated map interface. This allows you to test the UI and functionality without requiring an API key.

### Demo Mode Features:
- ✅ Visual map placeholder with location simulation
- ✅ Click to select random coordinates
- ✅ Address field auto-population
- ✅ All form functionality works
- ✅ No API key required

## 🔧 Setting Up Google Maps API

### Step 1: Get Google Maps API Key

1. **Go to Google Cloud Console**
   - Visit: [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create or Select a Project**
   - Click on the project dropdown at the top
   - Create a new project or select an existing one

3. **Enable APIs**
   - Go to "APIs & Services" > "Library"
   - Search for and enable these APIs:
     - **Maps JavaScript API** (for map display)
     - **Places API** (for address search)
     - **Geocoding API** (for coordinate conversion)

4. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your new API key

### Step 2: Configure API Key Restrictions (Recommended)

1. **Click on your API key** to edit it
2. **Application restrictions**:
   - Select "HTTP referrers"
   - Add your domain: `localhost:5173/*` (for development)
   - Add your production domain: `yourdomain.com/*`

3. **API restrictions**:
   - Select "Restrict key"
   - Choose the APIs you enabled above

### Step 3: Add API Key to Your Project

#### Option A: Environment Variable (Recommended for Vite)
1. Create a `.env.local` file in your project root
2. Add your API key (note the `VITE_` prefix for Vite projects):
   ```bash
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

#### Option B: Direct Replacement
1. Open `src/pages/user/LodgeComplaint/LodgeComplaint.jsx`
2. Replace the line:
   ```javascript
   const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'DEMO_MODE';
   ```
   With:
   ```javascript
   const GOOGLE_MAPS_API_KEY = 'your_actual_api_key_here';
   ```

### Step 4: Restart Your Development Server
```bash
npm run dev
```

## 🌟 Features Available with Full Google Maps

### 🗺️ **Interactive Map**
- Real Google Maps with satellite, terrain, and street views
- Click anywhere on the map to set complaint location
- Zoom controls and full-screen mode
- Street View integration

### 🔍 **Places Autocomplete**
- Search for any address, landmark, or business
- Auto-complete suggestions as you type
- Detailed address information
- India-focused results

### 📍 **Precise Location Selection**
- GPS-accurate coordinate capture
- Automatic address resolution
- Visual marker placement
- Real-time location updates

### 🎯 **Enhanced User Experience**
- Professional Google Maps interface
- Familiar navigation controls
- High-quality map imagery
- Reliable geocoding services

## 💰 Google Maps Pricing

### Free Tier (Generous Limits)
- **$200 free credit per month**
- **28,500+ map loads per month for free**
- **100,000+ geocoding requests per month for free**

### Typical Usage for Complaint System
- Small to medium applications: **Completely free**
- Large applications: **Very affordable** (~$2-10/month)

### Cost Examples
- 1,000 map loads = **Free**
- 10,000 map loads = **Free**
- 50,000 map loads = **Free** (within $200 credit)

## 🔒 Security Best Practices

### 1. API Key Restrictions
```javascript
// ✅ Good: Restrict by HTTP referrer
Application restrictions: HTTP referrers
Referrers: yourdomain.com/*

// ✅ Good: Restrict by API
API restrictions: Maps JavaScript API, Places API, Geocoding API
```

### 2. Environment Variables (Vite)
```bash
# ✅ Store in .env.local (never commit to git)
# Note: Use VITE_ prefix for Vite projects
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

### 3. Never Expose in Code
```javascript
// ❌ Bad: Hardcoded in source
const API_KEY = 'AIzaSyBxxxxxxxxxxxxxxxxxxxxxx';

// ✅ Good: From environment (Vite)
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. "Google Maps JavaScript API error: RefererNotAllowedMapError"
**Solution**: Add your domain to API key restrictions
- Add `localhost:5173` for development
- Add your production domain

#### 2. "Maps API is not enabled"
**Solution**: Enable required APIs in Google Cloud Console
- Maps JavaScript API
- Places API  
- Geocoding API

#### 3. "Loading Google Maps..." never finishes
**Solution**: Check your API key
- Ensure the key is correct
- Check if billing is enabled (required for production use)
- Verify API restrictions aren't too strict

#### 4. Places Autocomplete not working
**Solution**: Enable Places API
- Go to Google Cloud Console
- Enable "Places API" for your project

### Still Having Issues?

1. **Check Browser Console**: Look for specific error messages
2. **Test API Key**: Use Google's API key tester
3. **Verify Billing**: Ensure billing account is set up for production use
4. **Check Quotas**: Review your API usage in Google Cloud Console

## 🚀 Going Live

### Before Production Deployment:

1. **Set up billing** in Google Cloud Console
2. **Update domain restrictions** to your production URL
3. **Monitor usage** to stay within budget
4. **Set up alerts** for usage spikes

### Production Environment Variables:
```bash
# Add to your production environment (Vite)
VITE_GOOGLE_MAPS_API_KEY=your_production_api_key
```

## 📊 Benefits of Full Google Maps Integration

### For Citizens:
- ✅ **Familiar Interface**: Everyone knows how to use Google Maps
- ✅ **Precise Location**: GPS-accurate complaint locations
- ✅ **Easy Search**: Find any address or landmark instantly
- ✅ **Visual Confirmation**: See exactly where you're reporting

### For Administrators:
- ✅ **Accurate Data**: Precise coordinates for every complaint
- ✅ **Better Routing**: Easy integration with other mapping services
- ✅ **Geographic Analysis**: Identify problem areas and patterns
- ✅ **Professional Interface**: Polished, reliable user experience

---

**Need Help?** The application works perfectly in Demo Mode for testing and development. You can always add the Google Maps API key later when you're ready for production use.

**Demo Mode is Perfect For:**
- ✅ Development and testing
- ✅ UI/UX evaluation
- ✅ Feature demonstrations
- ✅ Local development

**Google Maps is Required For:**
- 🎯 Production deployment
- 🎯 Real address search
- 🎯 Satellite imagery
- 🎯 Street View integration