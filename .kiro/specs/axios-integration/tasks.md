# Implementation Plan

- [x] 1. Migrate LoginScreen to use axios

  - Import api from axiosConfig
  - Replace fetch call for POST /owner/auth/login with api.post()
  - Update response handling to use response.data instead of response.json()
  - Update error handling to use axios error structure
  - Test login functionality with valid and invalid credentials
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 6.1, 6.2_

- [x] 2. Migrate PropertyListScreen to use axios

  - Import api from axiosConfig
  - Remove manual token retrieval from Redux state in API calls
  - Replace fetch call for GET /properties/get-properties with api.get()
  - Replace fetch call for POST /properties/add-property with api.post()
  - Replace fetch call for PATCH /owner/auth/logout with api.patch()
  - Update all response handling to use response.data
  - Update error handling to use axios error structure
  - Remove manual logout logic (handled by interceptor)
  - Test property listing, adding, and logout functionality
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 3.3, 4.2, 6.1, 6.2, 6.3_

- [x] 3. Migrate PropertyDetailScreen to use axios

  - Import api from axiosConfig
  - Remove manual token retrieval from Redux state in API calls
  - Replace fetch calls for GET /properties/get-property/:propertyId with api.get()
  - Replace fetch call for POST /room/addroom/:propertyId with api.post()
  - Update all response handling to use response.data
  - Update error handling to use axios error structure
  - Test property detail fetching and room addition
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 4.3, 6.1, 6.2_

- [x] 4. Migrate TenantCarousel to use axios

  - Import api from axiosConfig
  - Remove manual token retrieval from Redux state in API calls
  - Replace fetch call for POST /tenant/addTenant/:roomId with api.post()
  - Replace fetch call for GET /room/details/:roomId with api.get()
  - Replace fetch call for PATCH /tenant/removeTenant/:roomId with api.patch()
  - Replace fetch call for PATCH /tenant/editTenant/:roomId/:tenantId with api.patch()
  - Update all response handling to use response.data
  - Update error handling to use axios error structure
  - Test tenant addition, room details, tenant removal, and tenant editing
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 4.4, 6.1, 6.2_

- [x] 5. Migrate TenantDocuments to use axios

  - Import api from axiosConfig
  - Remove manual token retrieval from Redux state in API calls
  - Replace fetch call for GET /tenant/getAllDocuments/:tenantId with api.get()
  - Replace fetch call for DELETE /tenant/deleteDocument/:tenantId/:documentId with api.delete()
  - Update all response handling to use response.data
  - Update error handling to use axios error structure
  - Test document listing and deletion
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 4.5, 6.1, 6.2_

- [x] 6. Migrate TransactionList to use axios

  - Import api from axiosConfig
  - Remove manual token retrieval from Redux state in API calls
  - Replace fetch call for GET /tenant/getTransaction/:tenantId with api.get()
  - Replace fetch call for POST /payment/addPayment with api.post()
  - Update all response handling to use response.data
  - Update error handling to use axios error structure
  - Test transaction listing and payment addition
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 4.6, 6.1, 6.2_

- [x] 7. Migrate DocumentUpload component to use axios

  - Import api from axiosConfig
  - Remove manual token handling (userToken prop still needed for component interface)
  - Replace fetch call for POST /tenant/addDocument/:tenantId with api.post()
  - Ensure FormData is passed correctly to axios (axios handles Content-Type automatically)
  - Update response handling to use response.data
  - Update error handling to use axios error structure
  - Test document upload with images from gallery and camera
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 4.7, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2_

- [x] 8. Migrate authSlice to use axios

  - Import api from axiosConfig
  - Replace fetch call for GET /owner/auth/verify with api.get()
  - Update response handling to use response.data
  - Update error handling to use axios error structure
  - Test token verification on app initialization
  - Test behavior with valid and invalid tokens
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 4.8, 6.1, 6.2_

- [x] 9. Verify session expiration handling

  - Test with expired token to verify automatic logout
  - Verify navigation to Login screen occurs
  - Verify Redux state is cleared
  - Verify AsyncStorage is cleared
  - Test across multiple screens to ensure consistent behavior
  - _Requirements: 1.4, 3.3_

- [x] 10. Clean up unused imports and code

  - Remove NODE_API_ENDPOINT imports from migrated files (optional cleanup)
  - Remove unused AsyncStorage imports if only used for token retrieval
  - Verify no console errors or warnings
  - _Requirements: 2.3_
