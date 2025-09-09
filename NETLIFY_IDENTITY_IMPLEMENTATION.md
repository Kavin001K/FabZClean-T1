# Netlify Identity Login Wall Implementation

This document provides a complete implementation of a client-side login wall for a Netlify-hosted Single Page Application using Netlify Identity service.

## Overview

The implementation creates a login wall that:
- Automatically checks user authentication status on page load
- Shows/hides the main application content based on login status
- Automatically opens the Netlify Identity login modal for unauthenticated users
- Handles login/logout events to update the UI accordingly

## Implementation Components

### 1. HTML Script Tag for Netlify Identity Widget

```html
<!-- Netlify Identity Widget -->
<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
```

This script tag is included in the `<head>` section of the HTML file and loads the Netlify Identity widget.

### 2. HTML Structure

```html
<body>
  <!-- Main Application Container (hidden by default) -->
  <div id="main-app" style="display: none;">
    <div id="root"></div>
  </div>
  
  <!-- Loading indicator (shown while checking authentication) -->
  <div id="loading-indicator" style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: 'Inter', sans-serif;">
    <div style="text-align: center;">
      <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
      <p style="color: #666; margin: 0;">Loading...</p>
    </div>
  </div>
  
  <!-- Your existing React app script -->
  <script type="module" src="/src/main.tsx"></script>
  
  <!-- Netlify Identity Login Wall Script -->
  <script>
    // JavaScript implementation (see below)
  </script>
</body>
```

### 3. CSS for Loading Animation

```css
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### 4. Complete JavaScript Implementation

```javascript
// Wait for the Netlify Identity widget to load
if (window.netlifyIdentity) {
  window.netlifyIdentity.on("init", user => {
    // Initialize the login wall
    initLoginWall();
  });
} else {
  // Fallback if netlifyIdentity is not available
  document.addEventListener('DOMContentLoaded', () => {
    initLoginWall();
  });
}

function initLoginWall() {
  const mainApp = document.getElementById('main-app');
  const loadingIndicator = document.getElementById('loading-indicator');
  
  // Function to show the main application
  function showMainApp() {
    if (mainApp) {
      mainApp.style.display = 'block';
    }
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
  }
  
  // Function to hide the main application
  function hideMainApp() {
    if (mainApp) {
      mainApp.style.display = 'none';
    }
    if (loadingIndicator) {
      loadingIndicator.style.display = 'flex';
    }
  }
  
  // Function to open the login modal
  function openLoginModal() {
    if (window.netlifyIdentity) {
      window.netlifyIdentity.open();
    }
  }
  
  // Check if user is logged in on initial load
  function checkAuthStatus() {
    if (window.netlifyIdentity) {
      const user = window.netlifyIdentity.currentUser();
      if (user) {
        // User is logged in, show the main app
        showMainApp();
      } else {
        // User is not logged in, hide main app and show login modal
        hideMainApp();
        // Small delay to ensure the loading indicator is visible before opening modal
        setTimeout(() => {
          openLoginModal();
        }, 100);
      }
    } else {
      // Fallback: show main app if Netlify Identity is not available
      showMainApp();
    }
  }
  
  // Listen for login events
  if (window.netlifyIdentity) {
    window.netlifyIdentity.on("login", user => {
      console.log('User logged in:', user);
      // User successfully logged in, show the main app
      showMainApp();
      // Close the modal
      window.netlifyIdentity.close();
    });
    
    // Listen for logout events
    window.netlifyIdentity.on("logout", () => {
      console.log('User logged out');
      // User logged out, hide the main app and show login modal
      hideMainApp();
      setTimeout(() => {
        openLoginModal();
      }, 100);
    });
  }
  
  // Initial authentication check
  checkAuthStatus();
}
```

## How It Works

### 1. Initial Load
- The page loads with the main application hidden (`display: none`)
- A loading indicator is shown while checking authentication
- The script waits for Netlify Identity to initialize

### 2. Authentication Check
- `checkAuthStatus()` function checks if a user is currently logged in
- If logged in: shows the main application
- If not logged in: keeps the main app hidden and opens the login modal

### 3. Login Flow
- When user successfully logs in, the `login` event is triggered
- The main application becomes visible
- The login modal is automatically closed

### 4. Logout Flow
- When user logs out, the `logout` event is triggered
- The main application is hidden again
- The login modal is automatically opened

### 5. Fallback Behavior
- If Netlify Identity is not available, the main app is shown (for development)
- Graceful handling of missing elements

## Key Features

- **Automatic Modal Opening**: Login modal opens automatically for unauthenticated users
- **Seamless Transitions**: Smooth show/hide transitions between states
- **Loading States**: Visual feedback during authentication checks
- **Event-Driven**: Responds to login/logout events in real-time
- **Fallback Support**: Works even if Netlify Identity fails to load
- **No Redirects**: All handled client-side without page redirects

## Setup Requirements

1. **Netlify Identity**: Must be enabled in your Netlify site settings
2. **Domain Configuration**: Ensure your domain is properly configured in Netlify
3. **Identity Settings**: Configure registration, login methods, and user management in Netlify dashboard

## Testing

To test the implementation:

1. Deploy to Netlify with Identity enabled
2. Visit the site - you should see the login modal automatically
3. Log in with a test account
4. The main application should become visible
5. Log out - the main app should hide and login modal should reappear

## Customization

You can customize:
- Loading indicator styling
- Animation timing
- Modal behavior
- Error handling
- User experience flow

The implementation is designed to be robust and handle edge cases while providing a smooth user experience.
