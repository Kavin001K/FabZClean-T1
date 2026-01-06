# Session Timeout Fix - Increased to 30 Days

## Issue
Users were being logged out too quickly (8 hours) when trying to create orders or perform other tasks, leading to frequent login prompts and poor user experience.

## Solution
Increased the JWT token expiry time from **8 hours** to **30 days** for a much better user experience.

## Changes Made

### 1. Backend - JWT Token Expiry (server/auth-service.ts)
**File:** `server/auth-service.ts`
**Line:** 10
**Change:**
```typescript
// Before
const JWT_EXPIRY = '8h';

// After
const JWT_EXPIRY = '30d'; // 30 days - long session for better UX
```

## How It Works

### Authentication Flow
1. **Login**: User logs in with username/password
2. **Token Generation**: Server generates a JWT token valid for 30 days
3. **Token Storage**: Frontend stores token in `localStorage` as `employee_token`
4. **Auto-Login**: On page refresh, the app automatically validates the token
5. **Token Validation**: Each API request includes the token for authentication
6. **Session Expiry**: After 30 days of inactivity, user needs to login again

### Security Considerations
- Tokens are signed with JWT_SECRET for security
- Tokens are validated on every API request
- Inactive accounts are automatically rejected even with valid tokens
- All actions are logged in the audit trail

## Benefits
✅ **No more frequent logins** - Stay logged in for 30 days
✅ **Better UX** - Create orders without interruption
✅ **Persistent sessions** - Work continues even after browser restart
✅ **Secure** - Still maintains security through token validation

## Testing
1. Login to the application
2. Close the browser and reopen after some time
3. You should remain logged in
4. Create orders without being prompted to login
5. Session will last for 30 days unless you manually logout

## Customization
If you want to adjust the session duration, edit line 10 in `server/auth-service.ts`:

```typescript
const JWT_EXPIRY = '30d';  // Options: '1h', '1d', '7d', '30d', '90d', etc.
```

## Note
After making this change:
1. Existing logged-in users will need to logout and login again to get the new 30-day token
2. New logins will automatically get the extended session
3. The change takes effect immediately after server restart
