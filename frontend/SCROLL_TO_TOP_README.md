# Scroll to Top Functionality

This document describes the scroll-to-top functionality implemented in the CTF platform.

## Features Implemented

### 1. Automatic Scroll to Top on Route Change
- **Component**: `ScrollToTop.jsx`
- **Location**: `frontend/src/components/ScrollToTop.jsx`
- **Functionality**: Automatically scrolls to the top of the page when navigating between routes
- **Features**:
  - Smooth scrolling behavior
  - Handles hash/anchor links properly
  - Respects user's reduced motion preferences
  - Works with React Router

### 2. Back to Top Button
- **Component**: `BackToTopButton.jsx`
- **Location**: `frontend/src/components/BackToTopButton.jsx`
- **Functionality**: Floating button that appears when user scrolls down
- **Features**:
  - Appears after scrolling 300px down
  - Smooth scroll animation
  - Responsive design
  - Hover effects
  - Accessibility support (ARIA labels)

### 3. Scroll Utilities
- **File**: `scrollUtils.js`
- **Location**: `frontend/src/utils/scrollUtils.js`
- **Functionality**: Collection of utility functions for scroll behavior
- **Functions**:
  - `scrollToTop()` - Scroll to page top
  - `scrollToElement()` - Scroll to specific element
  - `scrollToPosition()` - Scroll to specific position
  - `getCurrentScrollPosition()` - Get current scroll position
  - `isAtTop()` - Check if at page top
  - `isAtBottom()` - Check if at page bottom
  - `enhanceAnchorLinks()` - Add smooth scrolling to anchor links
  - `addScrollListener()` - Throttled scroll event listener

### 4. Global Smooth Scrolling
- **File**: `index.css`
- **Enhancement**: Added `scroll-behavior: smooth` to HTML element
- **Benefit**: Enables smooth scrolling for all scroll operations

## Implementation Details

### Integration in App.jsx
```jsx
import ScrollToTop from './components/ScrollToTop'
import BackToTopButton from './components/BackToTopButton'

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            {/* Routes */}
          </main>
          <Footer />
          <BackToTopButton />
        </div>
      </Router>
    </AuthProvider>
  )
}
```

### Usage Examples

#### Using Scroll Utilities
```jsx
import { scrollToTop, scrollToElement } from '../utils/scrollUtils';

// Scroll to top
const handleBackToTop = () => {
  scrollToTop(true); // true for smooth scrolling
};

// Scroll to specific element
const handleScrollToSection = () => {
  scrollToElement('section-id', true, 100); // 100px offset
};
```

#### Adding Scroll Listener
```jsx
import { addScrollListener } from '../utils/scrollUtils';

useEffect(() => {
  const cleanup = addScrollListener((position) => {
    console.log('Current scroll position:', position);
  }, 100); // 100ms throttle

  return cleanup;
}, []);
```

## Accessibility Features

1. **Reduced Motion Support**: Respects `prefers-reduced-motion` media query
2. **ARIA Labels**: Back to top button includes proper accessibility labels
3. **Keyboard Navigation**: Button is focusable and keyboard accessible
4. **Screen Reader Support**: Proper semantic markup and labels

## Browser Compatibility

- **Modern Browsers**: Full support with smooth scrolling
- **Older Browsers**: Graceful fallback to instant scrolling
- **Mobile Devices**: Responsive design and touch-friendly

## Performance Optimizations

1. **Throttled Scroll Listeners**: Prevents excessive function calls
2. **Conditional Rendering**: Back to top button only renders when needed
3. **Efficient Event Cleanup**: Proper cleanup of event listeners
4. **Minimal Re-renders**: Optimized state updates

## Testing

To test the functionality:

1. **Route Navigation**: Navigate between different pages and verify scroll position resets to top
2. **Back to Top Button**: Scroll down on any page and click the floating button
3. **Hash Links**: Test anchor links with hash fragments
4. **Reduced Motion**: Test with reduced motion preferences enabled

## Customization

### Styling the Back to Top Button
Edit `frontend/src/components/BackToTopButton.css` to customize:
- Colors and gradients
- Size and positioning
- Animation effects
- Responsive breakpoints

### Adjusting Scroll Behavior
Modify parameters in the components:
- Scroll threshold for button visibility
- Animation duration and easing
- Offset values for element scrolling

## Future Enhancements

Potential improvements:
1. Progress indicator showing scroll position
2. Multiple scroll targets/bookmarks
3. Scroll position memory for specific routes
4. Advanced scroll animations and effects
