# Backend API Integration

## Overview
The Cloud component has been updated to use backend API endpoints instead of direct cloud provider APIs.

## Key Changes

### 1. New API Service (`src/services/ApiService.js`)
- Centralized axios-based service for all API calls
- Handles cookies for authentication
- Consistent error handling

### 2. Updated Cloud Component
- Removed AWS SDK and Dropbox SDK dependencies
- All operations now go through backend endpoints
- Simplified error handling with user feedback

### 3. Environment Configuration
Add to your `.env` file:
```
REACT_APP_API_BASE_URL=http://localhost:8888
```

## Backend Endpoints Required

### S3 Operations
- `POST /api/v1/listAllS3`
- `POST /api/v1/getFileS3`
- `POST /api/v1/uploadFileS3`
- `POST /api/v1/deleteFileS3`

### Dropbox Operations
- `POST /api/v1/listAllDropbox`
- `POST /api/v1/getFileDropbox`
- `POST /api/v1/uploadFileDropbox`
- `POST /api/v1/deleteFileDropbox`

### Authentication
- `POST /api/v1/signup`
- `POST /api/v1/signin`

## Request Format
```json
{
  "fileName": "example.txt",
  "content": "file content..."
}
```

## Benefits
- Improved security (no frontend credentials)
- Proper authentication with cookies
- Centralized error handling
- Easier maintenance 