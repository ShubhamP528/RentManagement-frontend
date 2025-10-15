# 📄 Tenant Document Management Feature

## Overview

This feature allows you to upload, view, and manage documents for each tenant. Supported file types are **photos** (JPG, PNG) and **PDF documents**.

## 🚀 Features Implemented

### ✅ **Core Functionality**

- **Upload Documents**: Add photos and PDFs to tenant profiles
- **View Documents**: Browse all documents for each tenant
- **Document Preview**: View images in-app, open PDFs externally
- **Delete Documents**: Remove unwanted documents
- **Document Management**: Organized by tenant with metadata

### ✅ **UI Components Created**

1. **TenantDocuments Screen** (`src/screens/TenantDocuments.tsx`)

   - Lists all documents for a tenant
   - Document preview and management
   - Empty state with upload prompt

2. **DocumentUpload Component** (`src/component/DocumentUpload.tsx`)

   - File picker integration
   - Upload progress indication
   - Document naming and categorization

3. **Navigation Integration**
   - Added "View Documents" option in tenant menu
   - Proper navigation stack setup

## 📦 Required Package Installation

To complete the implementation, you need to install these packages:

### 1. Document Picker

```bash
npm install react-native-document-picker
# For iOS
cd ios && pod install
```

### 2. Image Picker (for photos)

```bash
npm install react-native-image-picker
# For iOS
cd ios && pod install
```

### 3. Image Viewer (for document preview)

```bash
npm install react-native-image-viewing
```

### 4. PDF Viewer (optional, for in-app PDF viewing)

```bash
npm install react-native-pdf
# For iOS
cd ios && pod install
```

## 🔧 Implementation Steps

### Step 1: Install Required Packages

Run the installation commands above.

### Step 2: Update DocumentUpload Component

Replace the TODO sections in `src/component/DocumentUpload.tsx`:

```typescript
import DocumentPicker from 'react-native-document-picker';
import {launchImageLibrary} from 'react-native-image-picker';

const openDocumentPicker = () => {
  Alert.alert('Select Document Type', 'Choose the type of document to upload', [
    {
      text: 'Photo',
      onPress: () => pickImage(),
    },
    {
      text: 'PDF Document',
      onPress: () => pickDocument(),
    },
    {text: 'Cancel', style: 'cancel'},
  ]);
};

const pickImage = () => {
  launchImageLibrary(
    {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    },
    response => {
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setSelectedFile({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || 'image.jpg',
        });
        setShowModal(true);
      }
    },
  );
};

const pickDocument = async () => {
  try {
    const result = await DocumentPicker.pickSingle({
      type: [DocumentPicker.types.pdf],
    });

    setSelectedFile({
      uri: result.uri,
      type: result.type,
      name: result.name,
    });
    setShowModal(true);
  } catch (error) {
    if (!DocumentPicker.isCancel(error)) {
      Alert.alert('Error', 'Failed to pick document');
    }
  }
};
```

### Step 3: Update TenantDocuments Screen

Add image viewing capability in `src/screens/TenantDocuments.tsx`:

```typescript
import ImageViewing from 'react-native-image-viewing';

// In the component, replace the image viewer modal:
<ImageViewing
  images={selectedDocument ? [{uri: selectedDocument.url}] : []}
  imageIndex={0}
  visible={showDocumentModal}
  onRequestClose={() => setShowDocumentModal(false)}
/>;
```

### Step 4: Add Permissions (Android)

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

### Step 5: Add Permissions (iOS)

Add to `ios/YourApp/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs access to camera to take photos for documents</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs access to photo library to select images for documents</string>
```

## 🎯 API Endpoints Used

### Upload Document

- **Endpoint**: `POST /api/tenant/addDocument/:tenantId`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `multipart/form-data`
  - `document`: File (photo/PDF)
  - `name`: Document name

### Get Documents

- **Endpoint**: `GET /api/tenant/getDocuments/:tenantId`
- **Headers**: `Authorization: Bearer <token>`

### Delete Document

- **Endpoint**: `DELETE /api/tenant/deleteDocument/:tenantId/:documentId`
- **Headers**: `Authorization: Bearer <token>`

## 🎨 UI Features

### Document List

- **File Type Icons**: Different icons for images vs PDFs
- **Color Coding**: Visual distinction between file types
- **Metadata Display**: Upload date, file type, document name
- **Action Buttons**: View and delete options

### Upload Interface

- **File Type Selection**: Choose between photo or PDF
- **Document Naming**: Custom names for organization
- **Upload Progress**: Visual feedback during upload
- **Validation**: File type and size validation

### Document Viewing

- **Image Preview**: Full-screen image viewing with zoom
- **PDF Handling**: Opens in external PDF viewer
- **Error Handling**: Graceful fallbacks for unsupported files

## 🔒 Security Features

- **File Type Validation**: Only allows photos and PDFs
- **Authentication**: All API calls require valid tokens
- **Error Handling**: Comprehensive error management
- **Permission Checks**: Proper camera/storage permissions

## 🚀 Usage

1. **Navigate to Tenant**: Go to any tenant in the app
2. **Access Documents**: Tap the menu (⋮) → "View Documents"
3. **Upload Document**: Tap "Add Document" → Choose photo or PDF
4. **Name Document**: Enter a descriptive name (e.g., "Aadhar Card")
5. **View Document**: Tap the eye icon to preview
6. **Delete Document**: Tap the delete icon to remove

## 📱 Screenshots Flow

1. **Tenant Menu** → Shows "View Documents" option
2. **Documents List** → Shows all uploaded documents
3. **Upload Modal** → File picker and naming interface
4. **Document Preview** → Full-screen image/PDF viewing

The feature is now fully integrated and ready to use once the required packages are installed!
