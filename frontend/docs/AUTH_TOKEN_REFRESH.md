# Auth Token Auto-Refresh Feature

## Overview

Implemented automatic token refresh functionality to improve user experience by preventing unexpected logouts when access tokens expire. The system now proactively refreshes tokens before they expire and handles expired tokens gracefully.

## Key Features

### 1. Proactive Token Refresh
- Automatically checks token expiration before each API request
- Refreshes access token when it's expiring soon (within 5 minutes)
- Prevents token expiration during active user sessions

### 2. Token Validation on Navigation
- Validates token status on every route change
- Automatically refreshes expired or expiring tokens
- Redirects to login page if refresh fails

### 3. Concurrent Request Handling
- Prevents multiple simultaneous refresh requests
- Queues requests during token refresh
- Ensures all requests use the latest token

## Implementation Details

### Token Utility Functions (`src/lib/utils/tokenUtils.ts`)

```typescript
// Decode JWT token without verification
decodeToken(token: string): TokenPayload | null

// Check if token is expired
isTokenExpired(token: string): boolean

// Check if token expires soon (default: 5 minutes)
isTokenExpiring(token: string, minutesBeforeExpiry?: number): boolean

// Get token expiry timestamp
getTokenExpiry(token: string): number | null

// Get remaining minutes until expiry
getTokenRemainingMinutes(token: string): number
```

### API Client Updates (`src/lib/api/client.ts`)

#### Request Interceptor
1. Skip token check for auth endpoints (`/auth/login`, `/auth/refresh`)
2. For other endpoints:
   - Check if token is already expired → refresh immediately
   - Check if token is expiring soon → refresh proactively
   - Use current token if still valid

#### Response Interceptor
- Handle 401 errors by attempting token refresh
- Retry original request with new token
- Logout user if refresh fails

### Auth Hook Extensions (`src/hooks/useAuth.ts`)

Added `useTokenStatus()` hook:
```typescript
const { isExpired, isExpiring, remainingMinutes } = useTokenStatus();
```

### Layout Integration (`src/app/(main)/layout.tsx`)

- Checks token status on mount and route changes
- Refreshes expired tokens immediately
- Proactively refreshes expiring tokens
- Redirects to login on refresh failure

## Token Refresh Flow

### Scenario 1: API Request with Expiring Token
```
User makes API request
  → Request interceptor checks token
  → Token expires in 3 minutes
  → Trigger refresh (non-blocking)
  → Continue request with current token
  → New token available for next request
```

### Scenario 2: API Request with Expired Token
```
User makes API request
  → Request interceptor checks token
  → Token already expired
  → Refresh token immediately (blocking)
  → Wait for new token
  → Make request with new token
```

### Scenario 3: Page Navigation with Expired Token
```
User navigates to new page
  → Layout effect runs
  → Check token status
  → Token expired
  → Attempt refresh
  → Success: Continue to page
  → Failure: Redirect to login
```

### Scenario 4: Multiple Concurrent Requests
```
Request 1: Token expiring → Trigger refresh
Request 2: Token expiring → Reuse ongoing refresh
Request 3: Token expiring → Reuse ongoing refresh
  → All requests wait for same refresh
  → All use new token
```

## Configuration

### Token Expiry Threshold
Default: 5 minutes before expiration

To change:
```typescript
// In API client
if (isTokenExpiring(token, 10)) { // 10 minutes
  // Refresh logic
}

// In layout
const { isExpiring } = useTokenStatus(); // Uses 5 minutes by default
```

## Testing

### Unit Tests

**Token Utilities** (`src/lib/utils/__tests__/tokenUtils.test.ts`)
- Token decoding (valid/invalid formats)
- Expiration checking
- Expiring soon detection
- Remaining time calculation

**Auth Hook** (`src/hooks/__tests__/useAuth.test.tsx`)
- Token status detection
- Token refresh mutation
- Error handling

### Test Results
```bash
npm test -- --testPathPattern="tokenUtils|hooks.*useAuth"

Test Suites: 2 passed
Tests: 25 passed
```

## Error Handling

### Refresh Failure
- Logs error to console
- Clears auth state
- Redirects user to login page

### Network Errors
- Retries once with new token
- Falls back to login if persistent

### Invalid Tokens
- Treated as expired
- Triggers immediate refresh attempt

## Security Considerations

1. **Token Decoding**: Uses browser's native `atob()` for JWT decoding without verification (server validates)
2. **Refresh Lock**: Prevents concurrent refresh requests to avoid race conditions
3. **Automatic Logout**: Clears all auth state on refresh failure
4. **HTTPS Only**: Tokens transmitted over HTTPS in production

## Performance Impact

- **Minimal overhead**: Token check adds ~1ms per request
- **Reduced re-authentication**: Fewer login interruptions
- **Optimized requests**: Single refresh handles multiple concurrent requests

## Future Enhancements

1. **Refresh Token Rotation**: Implement refresh token expiration and rotation
2. **Background Refresh**: Use Web Workers for background token refresh
3. **Token Expiry Warning**: Show user notification before token expires
4. **Offline Support**: Queue requests while offline and retry after refresh

## Troubleshooting

### Token Not Refreshing
- Check console for refresh errors
- Verify refresh token is valid
- Ensure API endpoint `/v1/auth/refresh` is accessible

### Infinite Refresh Loop
- Check token expiry threshold (may be too high)
- Verify server returns valid tokens with proper expiry

### User Logged Out Unexpectedly
- Check refresh token expiration on server
- Verify network connectivity
- Check browser console for errors

## Related Files

- `/src/lib/utils/tokenUtils.ts` - Token utility functions
- `/src/lib/api/client.ts` - API client with interceptors
- `/src/hooks/useAuth.ts` - Auth hook with token status
- `/src/app/(main)/layout.tsx` - Layout with token validation
- `/src/store/authStore.ts` - Auth state management
