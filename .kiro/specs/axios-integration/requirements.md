# Requirements Document

## Introduction

This feature involves migrating all API calls throughout the React Native application to use a centralized axios configuration (axiosConfig). The current implementation uses native fetch API calls scattered across multiple screens and components, which leads to code duplication and inconsistent error handling. By standardizing on the axiosConfig, the application will benefit from centralized authentication token management, automatic logout handling, and consistent API request/response patterns.

## Glossary

- **axiosConfig**: A centralized axios instance configured with base URL, interceptors for authentication tokens, and automatic session expiration handling
- **API Client**: The configured axios instance exported from src/axiosConfig.js
- **Fetch API**: The native JavaScript fetch function currently used for HTTP requests
- **Request Interceptor**: Middleware that automatically adds authentication tokens to outgoing requests
- **Response Interceptor**: Middleware that handles session expiration and automatic logout
- **Screen Component**: React Native screen components that make API calls (e.g., LoginScreen, PropertyListScreen)
- **Service Component**: React components that handle specific functionality like DocumentUpload

## Requirements

### Requirement 1

**User Story:** As a developer, I want all API calls to use the centralized axiosConfig, so that authentication and error handling are consistent across the application

#### Acceptance Criteria

1. THE API Client SHALL be imported in all screen components that make HTTP requests
2. WHEN any screen component makes an API request, THE API Client SHALL be used instead of the native Fetch API
3. THE API Client SHALL automatically include authentication tokens in request headers through the Request Interceptor
4. IF a session expires (401 or specific 400 response), THEN THE Response Interceptor SHALL automatically log out the user and navigate to the login screen
5. WHERE a component previously used fetch with manual token handling, THE API Client SHALL replace both the fetch call and manual token management

### Requirement 2

**User Story:** As a developer, I want to remove all manual token management code, so that authentication logic is centralized and maintainable

#### Acceptance Criteria

1. THE Screen Component SHALL NOT manually retrieve tokens from AsyncStorage before making API requests
2. THE Screen Component SHALL NOT manually add Authorization headers to requests
3. WHEN migrating from fetch to axios, THE Screen Component SHALL remove all token-related code from the request setup
4. THE API Client SHALL handle all token retrieval and header injection through its Request Interceptor

### Requirement 3

**User Story:** As a developer, I want consistent error handling across all API calls, so that users receive appropriate feedback and the app handles failures gracefully

#### Acceptance Criteria

1. WHEN an API request fails, THE Screen Component SHALL handle the error using axios error structure (error.response)
2. THE Screen Component SHALL display appropriate error messages to users based on the error response
3. IF the Response Interceptor handles session expiration, THEN THE Screen Component SHALL NOT need additional logout logic
4. THE Screen Component SHALL maintain existing user-facing error messages while using the new error structure

### Requirement 4

**User Story:** As a developer, I want to migrate all screens systematically, so that no API calls are missed and the migration is complete

#### Acceptance Criteria

1. THE API Client SHALL be integrated into LoginScreen for authentication requests
2. THE API Client SHALL be integrated into PropertyListScreen for property management and logout
3. THE API Client SHALL be integrated into PropertyDetailScreen for property details and room management
4. THE API Client SHALL be integrated into TenantCarousel for tenant operations
5. THE API Client SHALL be integrated into TenantDocuments for document retrieval and deletion
6. THE API Client SHALL be integrated into TransactionList for transaction and payment operations
7. THE API Client SHALL be integrated into DocumentUpload component for document uploads
8. THE API Client SHALL be integrated into authSlice for token verification

### Requirement 5

**User Story:** As a developer, I want to handle multipart/form-data requests correctly, so that file uploads continue to work with axios

#### Acceptance Criteria

1. WHERE a component uploads files using FormData, THE API Client SHALL be configured with appropriate Content-Type headers
2. WHEN making a file upload request, THE Screen Component SHALL pass FormData directly to axios
3. THE API Client SHALL support multipart/form-data requests without breaking the default JSON configuration
4. THE DocumentUpload component SHALL successfully upload files using the API Client

### Requirement 6

**User Story:** As a developer, I want to maintain backward compatibility with existing API response handling, so that UI logic doesn't need to change

#### Acceptance Criteria

1. WHEN migrating from fetch to axios, THE Screen Component SHALL access response data using response.data instead of response.json()
2. THE Screen Component SHALL maintain existing state updates and UI rendering logic
3. THE Screen Component SHALL preserve existing loading states and user feedback mechanisms
4. WHERE response status codes are checked, THE Screen Component SHALL use axios response structure (response.status)
