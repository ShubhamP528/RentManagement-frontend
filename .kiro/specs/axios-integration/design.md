# Design Document

## Overview

This design document outlines the approach for migrating all API calls in the React Native application from the native fetch API to a centralized axios configuration. The existing axiosConfig (src/axiosConfig.js) provides automatic authentication token injection, session expiration handling, and consistent error management through request and response interceptors.

The migration will systematically replace fetch calls across 8 files (7 screens/components + 1 Redux slice) while maintaining existing functionality and user experience. The design ensures backward compatibility with current UI logic while leveraging axios's superior error handling and interceptor capabilities.

## Architecture

### Current State

The application currently uses:

- Native fetch API for all HTTP requests
- Manual token retrieval from AsyncStorage in each component
- Manual Authorization header injection
- Inconsistent error handling patterns
- Duplicate logout logic across components

### Target State

After migration:

- Centralized axios instance (api) imported from src/axiosConfig.js
- Automatic token management via request interceptor
- Automatic session expiration handling via response interceptor
- Consistent error structure (axios error.response)
- Single source of truth for authentication logic

### Axios Configuration Analysis

The existing axiosConfig provides:

**Base Configuration:**

- Base URL: NODE_API_ENDPOINT from constants
- Timeout: 10000ms
- Default Content-Type: application/json

**Request Interceptor:**

- Automatically retrieves token from AsyncStorage ('rent-owner' key)
- Injects Bearer token into Authorization header
- Handles async token retrieval before each request

**Response Interceptor:**

- Detects session expiration (401 or specific 400 responses)
- Automatically dispatches Redux logout action
- Navigates to Login screen using navigationRef
- Passes through successful responses unchanged

## Components and Interfaces

### Files Requiring Migration

1. **src/screens/LoginScreen.tsx**

   - API Call: POST /owner/auth/login
   - Current: fetch with manual headers
   - Migration: Use api.post() with automatic token handling (though login doesn't need token)

2. **src/screens/PropertyListScreen.tsx**

   - API Calls:
     - GET /properties/get-properties (with token)
     - POST /properties/add-property (with token)
     - PATCH /owner/auth/logout (with token)
   - Current: fetch with manual token from Redux state
   - Migration: Use api.get(), api.post(), api.patch()

3. **src/screens/PropertyDetailScreen.tsx**

   - API Calls:
     - GET /properties/get-property/:propertyId (with token)
     - POST /room/addroom/:propertyId (with token)
   - Current: fetch with manual token
   - Migration: Use api.get(), api.post()

4. **src/screens/TenantCarousel.tsx**

   - API Calls:
     - POST /tenant/addTenant/:roomId (with token)
     - GET /room/details/:roomId (with token)
     - PATCH /tenant/removeTenant/:roomId (with token)
     - PATCH /tenant/editTenant/:roomId/:tenantId (with token)
   - Current: fetch with manual token
   - Migration: Use api.post(), api.get(), api.patch()

5. **src/screens/TenantDocuments.tsx**

   - API Calls:
     - GET /tenant/getAllDocuments/:tenantId (with token)
     - DELETE /tenant/deleteDocument/:tenantId/:documentId (with token)
   - Current: fetch with manual token
   - Migration: Use api.get(), api.delete()

6. **src/screens/TransactionList.tsx**

   - API Calls:
     - GET /tenant/getTransaction/:tenantId (with token)
     - POST /payment/addPayment (with token)
   - Current: fetch with manual token
   - Migration: Use api.get(), api.post()

7. **src/component/DocumentUpload.tsx**

   - API Call: POST /tenant/addDocument/:tenantId (multipart/form-data with token)
   - Current: fetch with manual token and FormData
   - Migration: Use api.post() with FormData and custom headers

8. **src/redux/authSlice.ts**
   - API Call: GET /owner/auth/verify (with token)
   - Current: fetch with manual token
   - Migration: Use api.get()

### Migration Pattern

For each file, follow this pattern:

**Step 1: Import axios instance**

```typescript
import api from '../axiosConfig'; // or '../../axiosConfig' depending on depth
```

**Step 2: Remove manual token handling**

- Remove AsyncStorage imports (if only used for token)
- Remove token retrieval from Redux state (if only used for API calls)
- Remove manual Authorization header construction

**Step 3: Replace fetch with axios**

**GET requests:**

```typescript
// Before
const response = await fetch(`${NODE_API_ENDPOINT}/endpoint`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
});
const data = await response.json();

// After
const response = await api.get('/endpoint');
const data = response.data;
```

**POST requests:**

```typescript
// Before
const response = await fetch(`${NODE_API_ENDPOINT}/endpoint`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(payload),
});
const data = await response.json();

// After
const response = await api.post('/endpoint', payload);
const data = response.data;
```

**PATCH/DELETE requests:**

```typescript
// Before
const response = await fetch(`${NODE_API_ENDPOINT}/endpoint`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(payload),
});

// After
const response = await api.patch('/endpoint', payload);
// or
const response = await api.delete('/endpoint');
```

**Step 4: Update error handling**

```typescript
// Before
if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`);
}

// After
// Axios automatically throws on non-2xx status codes
// Error handling in catch block:
catch (error) {
  if (error.response) {
    // Server responded with error status
    console.error('Error:', error.response.status, error.response.data);
  } else if (error.request) {
    // Request made but no response
    console.error('Network error:', error.message);
  } else {
    // Other errors
    console.error('Error:', error.message);
  }
}
```

## Data Models

### Axios Response Structure

```typescript
{
  data: any,           // Response body (parsed JSON)
  status: number,      // HTTP status code
  statusText: string,  // HTTP status message
  headers: object,     // Response headers
  config: object,      // Request configuration
  request: object      // Original request
}
```

### Axios Error Structure

```typescript
{
  message: string,
  response?: {
    data: any,         // Error response body
    status: number,    // HTTP status code
    headers: object    // Response headers
  },
  request?: object,    // Request that was made
  config: object       // Request configuration
}
```

## Error Handling

### Automatic Session Expiration

The response interceptor automatically handles:

- 401 Unauthorized responses
- 400 Bad Request with message "You are logged out. Login again"

When detected:

1. Logs "Session expired, logging out..."
2. Dispatches Redux logout() action
3. Clears AsyncStorage
4. Navigates to Login screen
5. Rejects the promise with the original error

Components no longer need manual logout logic for expired sessions.

### Component-Level Error Handling

Components should handle:

- User-facing error messages
- Loading state management
- Retry logic (if applicable)
- Specific business logic errors

Example pattern:

```typescript
try {
  setLoading(true);
  const response = await api.get('/endpoint');
  // Handle success
  setData(response.data);
} catch (error) {
  // Session expiration is handled automatically
  // Handle other errors
  if (error.response) {
    Alert.alert('Error', error.response.data.message || 'Request failed');
  } else {
    Alert.alert('Error', 'Network error. Please try again.');
  }
} finally {
  setLoading(false);
}
```

## Testing Strategy

### Manual Testing Checklist

For each migrated screen/component:

1. **Successful API Calls**

   - Verify data loads correctly
   - Verify UI updates as expected
   - Verify loading states work

2. **Authentication**

   - Verify token is automatically included
   - Verify requests succeed with valid token

3. **Session Expiration**

   - Test with expired/invalid token
   - Verify automatic logout occurs
   - Verify navigation to Login screen

4. **Error Handling**

   - Test with network disconnected
   - Test with invalid data
   - Verify appropriate error messages

5. **Special Cases**
   - DocumentUpload: Verify file uploads work with FormData
   - LoginScreen: Verify login works (no token needed)
   - PropertyListScreen: Verify logout endpoint works

### Testing Sequence

1. Test LoginScreen first (establishes valid session)
2. Test PropertyListScreen (basic GET/POST operations)
3. Test PropertyDetailScreen (nested routes)
4. Test TenantCarousel (multiple operations)
5. Test TenantDocuments (GET/DELETE operations)
6. Test TransactionList (transactions and payments)
7. Test DocumentUpload (multipart/form-data)
8. Test authSlice (token verification on app start)

### Regression Testing

After migration:

- Verify all existing features work unchanged
- Verify no UI regressions
- Verify error messages remain user-friendly
- Verify loading states function correctly

## Special Considerations

### FormData Uploads (DocumentUpload)

The DocumentUpload component uses multipart/form-data for file uploads. Axios handles FormData automatically:

```typescript
const formData = new FormData();
formData.append('document', {
  uri: selectedFile.uri,
  type: selectedFile.type,
  name: selectedFile.name,
} as any);
formData.append('name', documentName.trim());

// Axios automatically sets Content-Type: multipart/form-data
const response = await api.post(`/tenant/addDocument/${tenantId}`, formData);
```

Note: The default Content-Type (application/json) in axiosConfig will be overridden automatically by axios when FormData is detected.

### Login Screen

The LoginScreen doesn't need a token for the login request itself, but the request interceptor will still run. Since no token exists in AsyncStorage during login, the interceptor will simply not add an Authorization header, which is correct behavior.

### Redux State Management

The currentUser token from Redux state (used in many components) can be removed after migration since:

- Token is automatically retrieved from AsyncStorage by the interceptor
- Components no longer need direct access to the token
- Redux state can still store username and other user data

However, we'll keep the Redux state unchanged initially to minimize changes and maintain backward compatibility.

### Constants Import

Components currently import NODE_API_ENDPOINT from constants. After migration:

- This import can be removed (axios uses baseURL)
- Endpoints become relative paths (e.g., '/properties/get-properties')
- Reduces coupling to environment configuration

## Implementation Order

1. **Phase 1: Core Screens**

   - LoginScreen (establishes session)
   - PropertyListScreen (most common operations)

2. **Phase 2: Detail Screens**

   - PropertyDetailScreen
   - TenantCarousel

3. **Phase 3: Document Management**

   - TenantDocuments
   - DocumentUpload (test FormData handling)

4. **Phase 4: Transactions & Auth**
   - TransactionList
   - authSlice (critical for app initialization)

This order ensures:

- Early validation of basic patterns
- Progressive complexity (FormData last)
- Critical auth verification tested last after patterns established
