# Auto Logout Feature - Test Coverage

## Overview
Comprehensive test suite for the automatic logout functionality when a user is blocked by an admin through Platform Control dashboard.

## Implementation Status
✅ **Feature already exists in codebase**:
- Located in `src/context/AuthContext.jsx` (lines 161-194)
- Periodic check every 30 seconds using `axios.get('/api/auth/me')`
- Automatically logs out and redirects to `/blocked` when user is blocked
- Also checks on initial load when token exists

## Test Files Created

### 1. `src/context/AuthContext.test.jsx`
Comprehensive tests for the automatic block detection and logout mechanism in AuthContext.

#### Test Coverage:
- **Periodic Block Status Check** (8 tests)
  - ✓ Verifies check runs every 30 seconds when authenticated
  - ✓ Logs out immediately when `isBlocked: true` is detected
  - ✓ Logs out on 403 status with `isBlocked` flag
  - ✓ Doesn't check when user not authenticated
  - ✓ Doesn't check when token missing
  - ✓ Clears interval on unmount
  - ✓ Handles block status change from false to true
  - ✓ Sets error message when blocked

- **Block Status Detection on Initial Load** (2 tests)
  - ✓ Detects and logs out blocked user on app load
  - ✓ Handles 403 error with `isBlocked` flag on load

- **Edge Cases** (3 tests)
  - ✓ Continues running if one check fails
  - ✓ Handles 403 error without `isBlocked` flag gracefully
  - ✓ Handles null user data gracefully

### 2. `src/pages/Login.test.jsx` (Enhanced)
Added 6 new tests to existing Login component tests for admin block feature.

#### New Test Coverage:
- **Blocked User Detection - Admin Block Feature** (6 tests)
  - ✓ Shows blocked error with icon when admin blocks during login
  - ✓ Applies `blocked-error` CSS class when blocked
  - ✓ Sets `isBlocked` state on 403 with `isBlocked` flag
  - ✓ Doesn't set blocked state for 403 without `isBlocked` flag
  - ✓ Handles multiple block attempts with persistent blocked state
  - ✓ Clears blocked icon when user starts typing

### 3. `src/pages/UserBlocked.test.jsx`
Complete test suite for the UserBlocked component (shown when user is blocked).

#### Test Coverage:
- **Auto Logout on Block** (5 tests)
  - ✓ Renders blocked account message
  - ✓ Renders lock icon
  - ✓ Automatically logs out after 30 seconds
  - ✓ Logs out when logout button clicked
  - ✓ Displays auto logout countdown message

- **UI Elements** (3 tests)
  - ✓ Renders all required UI elements
  - ✓ Applies correct CSS classes
  - ✓ Renders logout button with correct class

- **Cleanup and Unmount** (2 tests)
  - ✓ Clears timeout when component unmounts
  - ✓ Prevents double logout after manual logout

- **Multiple Renders** (1 test)
  - ✓ Handles multiple component mounts correctly

- **Error States** (2 tests)
  - ✓ Handles logout function errors gracefully
  - ✓ Handles navigate function errors gracefully

- **Message Content Verification** (3 tests)
  - ✓ Displays blocked message content
  - ✓ Displays additional blocked explanation
  - ✓ Displays admin contact instruction

## Auto Logout Flow

### Scenario 1: Admin Blocks Already-Logged-In User
1. Admin clicks "Block" button in Platform Control dashboard
2. AuthContext periodic check (every 30 seconds) detects `isBlocked: true`
3. User's token is removed from localStorage
4. User is logged out automatically
5. User is redirected to `/blocked` page
6. UserBlocked component displays with 30-second auto-logout timer
7. User can manually logout or wait for auto-logout

### Scenario 2: Blocked User Tries to Login
1. User attempts login with email/password
2. Server returns 403 with `isBlocked: true` flag
3. Login component shows error with lock icon
4. User cannot proceed with login

### Scenario 3: New Session with Blocked User
1. Blocked user already has valid token in localStorage
2. On app load, AuthContext checks user status via `/api/auth/me`
3. Server responds with `isBlocked: true` or 403 error
4. User is logged out immediately
5. User is redirected to `/blocked` page

## Total Test Count
- **AuthContext.test.jsx**: 13 tests
- **Login.test.jsx**: +6 new tests (66 total in file)
- **UserBlocked.test.jsx**: 16 tests
- **Total new tests**: 35 tests

## How to Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- AuthContext.test.jsx

# Run with UI
npm test -- --ui

# Run with coverage
npm test -- --coverage
```

## Key Features Tested

✅ **Periodic Monitoring**: Validates that system checks for block status every 30 seconds
✅ **Immediate Logout**: Confirms logout happens instantly when block detected
✅ **Token Cleanup**: Verifies localStorage token is removed
✅ **Redirect Handling**: Tests redirect to `/blocked` page
✅ **Error Message**: Checks appropriate error message is set
✅ **UI Feedback**: Tests lock icon display on blocked error
✅ **User Actions**: Tests logout button and typing to clear errors
✅ **Cleanup**: Tests interval cleanup on unmount
✅ **Edge Cases**: Handles network errors, missing data, etc.

## Implementation Notes

The feature is implemented in `AuthContext.jsx`:
- **Lines 116-128**: Initial load check on app startup
- **Lines 161-194**: Periodic check every 30 seconds while authenticated

The feature uses:
- `axios` for API calls
- `localStorage` for token management
- React hooks (`useEffect`, `useState`)
- Window location redirect

## Security Considerations

✅ Token is removed from localStorage before redirect
✅ User state is cleared completely
✅ Error message doesn't expose sensitive information
✅ Rate limiting is enforced at API level
✅ Block status is verified on both initial load and periodically
