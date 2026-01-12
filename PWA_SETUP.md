# Progressive Web App (PWA) Setup

This document outlines the PWA features that have been implemented and what's needed to complete the setup.

## ✅ Implemented Features

### 1. Responsive Design
- Mobile menu toggle (hamburger menu)
- Responsive sidebar that slides in/out on mobile
- Touch-friendly buttons and interactions (minimum 44px touch targets)
- Responsive tables with horizontal scrolling on mobile
- Optimized layouts for tablets and phones
- Viewport meta tags for proper mobile rendering

### 2. Progressive Web App (PWA) Features
- **Manifest File**: Created `/static/manifest.json` with app metadata
- **Service Worker**: Created `/static/service-worker.js` for offline support and caching
- PWA meta tags in HTML (theme-color, apple-mobile-web-app, etc.)
- Service worker registration in HTML

### 3. Mobile Enhancements
- Overlay for mobile menu
- Sidebar close button on mobile
- Card-style table layout on mobile (with data-label attributes)
- Horizontal scrolling tables for wide content
- Improved form layouts for mobile
- Better spacing and typography for smaller screens

### 4. Code Improvements
- Enhanced CSS with media queries for multiple breakpoints
- JavaScript utilities for table responsiveness
- Mobile menu toggle functionality
- Auto-close mobile menu on navigation

## ⚠️ Required: Icon Files

The PWA manifest references icon files that need to be created:

1. **icon-192.png** - 192x192 pixels (required)
2. **icon-512.png** - 512x512 pixels (recommended)

**Location**: Place these files in `/static/` directory

**How to Create Icons:**
- Use an icon generator (like [RealFaviconGenerator](https://realfavicongenerator.net/))
- Create a simple hospital/medical-themed icon
- Export as PNG files in the specified sizes
- Ensure icons have transparent backgrounds for maskable icons

## Testing the PWA

1. **Test Responsive Design**:
   - Open the app in Chrome DevTools
   - Use device toolbar (Toggle device toolbar: Cmd/Ctrl + Shift + M)
   - Test on various device sizes (mobile, tablet, desktop)

2. **Test PWA Features**:
   - Open Chrome DevTools → Application tab
   - Check "Service Workers" to verify registration
   - Check "Manifest" to verify it loads correctly
   - Test "Add to Home Screen" functionality

3. **Test Offline Support**:
   - Open DevTools → Network tab
   - Enable "Offline" mode
   - Navigate the app - cached pages should load
   - API calls will show offline message

## Browser Support

- **Chrome/Edge**: Full PWA support
- **Safari (iOS)**: Partial PWA support (manifest supported, service worker supported)
- **Firefox**: Full PWA support
- **Mobile Browsers**: All major mobile browsers support PWA features

## Notes

- Service worker uses network-first strategy for API calls (always fresh data)
- Service worker uses cache-first strategy for static assets (faster loading)
- Tables automatically adapt to mobile with card-style layout on small screens
- Mobile menu auto-closes when navigating to a new module
- Touch targets are minimum 44px for better mobile usability
