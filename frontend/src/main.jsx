import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Apply saved theme ASAP to avoid FOUC
try {
  const savedTheme = localStorage.getItem('fixitfast.theme')
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme)
  }
} catch {}

// Get the root element
const container = document.getElementById('root')

// Check if root element exists
if (!container) {
  throw new Error('Root element not found')
}


// Create root and render (only once)
const root = createRoot(container)
root.render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>
)

