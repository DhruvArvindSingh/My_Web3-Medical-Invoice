# 🏥 Web3 Medical Invoice System - Features Documentation

This document provides a comprehensive overview of all the advanced features implemented in the Web3 Medical Invoice System.

---

## 🔄 1. Undo and Redo Functionality

### Overview
The application implements a robust undo/redo system powered by the SocialCalc spreadsheet engine, allowing users to reverse and reapply changes to their medical invoices.

### Technical Implementation
- **Engine**: Built on SocialCalc's UndoStack class
- **Stack Management**: Maintains command and undo stacks with configurable limits
- **Integration**: Connected through `AppGeneral.undo()` and `AppGeneral.redo()` functions
- **UI Controls**: Accessible via header buttons with React icons (MdUndo, MdRedo)

### Key Features
- **Maximum Undo Steps**: Up to 50 operations can be undone (configurable)
- **Audit Trail**: Complete history of all changes for debugging and review
- **Command Batching**: Multiple operations can be grouped into single undo/redo actions
- **State Management**: Automatic cleanup of undone items when new changes are made

### User Experience
```javascript
// Triggered from Header buttons
const handleUndo = () => {
    AppGeneral.undo();
};

const handleRedo = () => {
    AppGeneral.redo();
};
```

### Supported Operations
- Cell edits (formulas, values, text)
- Format changes (borders, colors, alignment)
- Row/column insertions and deletions
- Copy/paste operations
- Cell merging/unmerging

---

## 🔍 2. Search Bar for Local and Cloud Files

### Overview
Advanced search functionality allows users to quickly locate files across both local storage and cloud providers (S3 and Dropbox).

### Local File Search
**Location**: `src/components/Files/Files.js`

#### Features
- **Real-time filtering**: Instant results as you type
- **Case-insensitive**: Searches regardless of letter case
- **Partial matching**: Finds files containing search terms
- **Clear functionality**: Quick reset button (×) to clear search

#### Implementation
```javascript
const [searchTerm, setSearchTerm] = useState('');

const filteredFiles = Object.keys(files).filter(key =>
    key !== 'default' && key.toLowerCase().includes(searchTerm.toLowerCase())
);
```

### Cloud File Search
**Location**: `src/components/Cloud/Cloud.js`

#### Features
- **Multi-provider**: Works with both S3 and Dropbox
- **Unified interface**: Same search experience across providers
- **Real-time results**: Immediate filtering as you type
- **Provider-specific**: Searches within currently active tab (S3/Dropbox)

#### Implementation
```javascript
const getCurrentFiles = () => {
    return activeTab === 's3' ? s3Files : dropboxFiles;
};

const filteredFiles = Object.keys(getCurrentFiles()).filter(key =>
    key.toLowerCase().includes(searchTerm.toLowerCase())
);
```

### Search UI Components
- **Input field**: Styled with focus states and transitions
- **Clear button**: Appears when search term exists
- **No results state**: Helpful message when no files match
- **Responsive design**: Works on mobile and desktop

---

## 🔐 3. Authentication using JWT Token

### Overview
Secure authentication system using JSON Web Tokens (JWT) for user management and API access control.

### Technical Architecture
**Service**: `src/services/ApiService.js`
**Component**: `src/components/Login/Login.js`

### Authentication Flow

#### 1. User Registration
```javascript
static async signup(userData) {
    const response = await apiClient.post('/api/v1/signup', userData);
    return this.handleApiResponse(response);
}
```

#### 2. User Login
```javascript
static async signin(credentials) {
    const response = await apiClient.post('/api/v1/signin', credentials);
    if (response.data.success && response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('email', response.data.data.email);
    }
    return this.handleApiResponse(response);
}
```

#### 3. Token Management
- **Storage**: Tokens stored in localStorage for persistence
- **Retrieval**: Automatic token inclusion in API requests
- **Validation**: Real-time auth status checking
- **Cleanup**: Automatic token removal on logout

### Security Features
- **Token Validation**: Server-side verification for all protected endpoints
- **Automatic Logout**: Clears tokens when authentication fails
- **Error Handling**: Graceful handling of authentication errors
- **Session Management**: Persistent login state across browser sessions

### User Interface
- **Login Modal**: Popup-style authentication form
- **Form Validation**: Email format and password length validation
- **Loading States**: Visual feedback during authentication
- **Error Messages**: Clear feedback for failed attempts
- **Responsive Design**: Mobile-optimized login experience

### Protected Operations
All cloud storage and logo operations require valid JWT tokens:
- S3 file operations
- Dropbox file operations
- Logo upload/delete
- User profile management

---

## 📄 4. Export as PDF, Workbook as PDF and CSV Client-Side

### Overview
Comprehensive export functionality allowing users to generate PDFs and CSV files entirely in the browser without server dependencies.

### PDF Export Features

#### Standard PDF Export
**Location**: `src/components/Menu/Menu.js` - `exportAsPDF()`

```javascript
const exportAsPDF = (filename) => {
    const content = AppGeneral.getCurrentHTMLContent();
    const logoHTML = createLogoHTML();
    
    // Create new window for PDF generation
    const printWindow = window.open("", "_blank", "width=800,height=600");
    // ... PDF generation logic
}
```

#### Features
- **Logo Integration**: Automatically includes company logo
- **Responsive Styling**: Optimized for A4 page size
- **Print CSS**: Special styles for print media
- **Content Validation**: Checks for data before export
- **Error Handling**: Fallback mechanisms for popup blockers

#### Workbook PDF Export
- **Multi-sheet Support**: Exports entire workbook structure
- **Sheet Navigation**: Includes all active sheets
- **Formatting Preservation**: Maintains cell formatting and styles
- **Print Optimization**: Automatic page breaks and scaling

### CSV Export Features
**Implementation**: Client-side CSV generation

```javascript
const exportAsCSV = (filename) => {
    const csvContent = AppGeneral.getCSVContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.click();
}
```

#### Features
- **Data Conversion**: Converts spreadsheet data to CSV format
- **UTF-8 Encoding**: Proper character encoding support
- **Automatic Download**: Browser-native download mechanism
- **Filename Customization**: Uses current file name or default
- **Error Handling**: Validation and fallback mechanisms

### Export UI
- **Dropdown Menu**: Integrated export options in menu
- **Format Selection**: PDF and CSV options
- **Progress Feedback**: Visual indicators during export
- **Error Messages**: Clear feedback for failed exports

---

## 🔒 5. Save as Password Protected

### Overview
Advanced file security feature allowing users to password-protect their medical invoice files with encryption-like protection.

### Technical Implementation
**Updated Components**:
- `src/components/Menu/Menu.js` - Save dropdown functionality
- `src/components/Files/Files.js` - Password validation on file access
- `src/components/storage/LocalStorage.js` - Password storage structure

### Save As Dropdown Menu

#### Menu Structure
```javascript
<select value={saveFormat} onChange={handleSaveAsChange} className="export-select">
    <option value="">Save As...</option>
    <option value="regular">Save As</option>
    <option value="password">Save As Password Protected</option>
</select>
```

#### Password Protection Flow
1. **File Name Prompt**: User enters desired filename
2. **Password Prompt**: User sets password for the file
3. **Validation**: Ensures password is not empty
4. **Storage**: Saves file with password in metadata

```javascript
const doSaveAsPasswordProtected = (event) => {
    const filename = window.prompt("Enter filename : ");
    const password = window.prompt("Enter password for this file : ");
    
    if (password && typeof password === 'string' && password.trim() !== '') {
        const fileObj = new File(
            new Date().toString(),
            new Date().toString(),
            content,
            filename,
            password.trim() // Store password securely
        );
        storeRef.current._saveFile(fileObj);
    }
};
```

### File Access Control

#### Password Verification
```javascript
const editFile = (key) => {
    const data = storeRef.current._getFile(key);
    
    // Check if file is password protected
    if (data.password && typeof data.password === 'string' && data.password.trim() !== '') {
        const userPassword = window.prompt(`File "${key}" is password protected. Enter password:`);
        
        if (userPassword.trim() !== data.password.trim()) {
            window.alert('Incorrect password! Access denied.');
            return;
        }
    }
    
    // Proceed to open file
    AppGeneral.viewFile(key, decodeURIComponent(data.content));
};
```

### Security Features
- **Password Storage**: Passwords stored with file metadata
- **Access Control**: Files cannot be opened without correct password
- **Visual Indicators**: 🔒 icon shows password-protected files
- **Type Safety**: Robust password validation and type checking
- **Auto-save Compatibility**: Password preservation during automatic saves

### User Experience
- **Clear Prompts**: Intuitive password entry dialogs
- **Visual Feedback**: Lock icons for protected files
- **Error Handling**: Clear messages for wrong passwords
- **Cancel Support**: Users can cancel password prompts

---

## ☁️ 6. Added S3 Cloud Storage

### Overview
Enterprise-grade cloud storage integration with Amazon S3, providing scalable file storage and management for medical invoices.

### Technical Architecture
**Service Layer**: `src/services/ApiService.js`
**UI Component**: `src/components/Cloud/Cloud.js`
**Backend Integration**: RESTful API endpoints

### S3 Operations

#### File Listing
```javascript
static async listAllS3() {
    const token = this.getToken();
    const response = await apiClient.post('/api/v1/listAllS3', { token });
    return this.handleApiResponse(response);
}
```

#### File Upload
```javascript
static async uploadFileS3(fileName, content) {
    const token = this.getToken();
    const response = await apiClient.post('/api/v1/uploadFileS3', {
        fileName,
        content,
        token
    });
    return this.handleApiResponse(response);
}
```

#### File Download
```javascript
static async getFileS3(fileName) {
    const token = this.getToken();
    const response = await apiClient.post('/api/v1/getFileS3', { fileName, token });
    return this.handleApiResponse(response);
}
```

#### File Deletion
```javascript
static async deleteFileS3(fileName) {
    const token = this.getToken();
    const response = await apiClient.post('/api/v1/deleteFileS3', { fileName, token });
    return this.handleApiResponse(response);
}
```

### Features
- **Bulk Operations**: Upload/download multiple files simultaneously
- **Conflict Resolution**: Handles file overwrite scenarios
- **Progress Tracking**: Visual feedback for long operations
- **Error Handling**: Comprehensive error management and user feedback
- **Authentication**: Secure access using JWT tokens

### S3 Configuration
```env
REACT_APP_REGION=your-aws-region
REACT_APP_BUCKET=your-s3-bucket-name
REACT_APP_ACCESS_KEY=your-aws-access-key
REACT_APP_SECRET_KEY=your-aws-secret-key
```

### User Interface
- **Tabbed Interface**: Easy switching between S3 and local storage
- **File Selection**: Checkbox-based multiple file selection
- **Search Integration**: Real-time search within S3 files
- **Connection Testing**: Built-in connectivity verification

---

## 📦 7. Added Dropbox Cloud Storage

### Overview
User-friendly cloud storage integration with Dropbox, offering easy file sharing and synchronization capabilities.

### Technical Implementation
**Service Integration**: Similar architecture to S3 with Dropbox-specific endpoints
**API Endpoints**: Dedicated Dropbox operations through backend

### Dropbox Operations

#### File Listing
```javascript
static async listAllDropbox() {
    const token = this.getToken();
    const response = await apiClient.post('/api/v1/listAllDropbox', { token });
    return this.handleApiResponse(response);
}
```

#### File Management
- **Upload**: `uploadFileDropbox(fileName, content)`
- **Download**: `getFileDropbox(fileName)`
- **Delete**: `deleteFileDropbox(fileName)`

### Dropbox Features
- **Easy Setup**: Simple API token configuration
- **File Sharing**: Built-in sharing capabilities
- **Version History**: Dropbox's native version control
- **Cross-Platform**: Access from any device
- **Real-time Sync**: Automatic synchronization across devices

### Configuration
```env
REACT_APP_DROPBOX_ACCESS_TOKEN=your-dropbox-access-token
```

### Permissions Required
- `files.metadata.read`: Read file information
- `files.content.read`: Download file contents
- `files.content.write`: Upload and modify files

### User Experience
- **Familiar Interface**: Dropbox-style file management
- **Drag & Drop**: Intuitive file upload (planned feature)
- **Mobile Optimized**: Responsive design for mobile access
- **Error Recovery**: Robust error handling and retry mechanisms

---

## 🎨 8. Add Logo / Remove Logo

### Overview
Comprehensive logo management system allowing users to upload, display, and remove company logos from their medical invoices.

### Technical Components
**Upload Component**: `src/components/Logo/LogoUpload.js`
**Display Component**: `src/components/Logo/LogoDisplay.js`
**Integration**: `src/socialcalc/AppGeneral.js`

### Logo Upload Features

#### File Validation
```javascript
const validateFile = (file) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(file.type)) {
        return { isValid: false, error: 'Please upload a PNG, JPG, JPEG, or SVG file' };
    }
    
    if (file.size > maxSize) {
        return { isValid: false, error: 'File size must be less than 5MB' };
    }
    
    return { isValid: true };
};
```

#### Upload Process
1. **File Selection**: Browse and select image file
2. **Validation**: Check file type and size
3. **Base64 Conversion**: Convert to base64 for API upload
4. **Cloud Upload**: Store in cloud storage with signed URL
5. **Spreadsheet Integration**: Add logo to active spreadsheet

### Logo Integration in Spreadsheets
```javascript
export function addLogo(coord, url) {
    const control = SocialCalc.GetCurrentWorkBookControl();
    const cmd = `set ${coord} text t <img src="${url}" height="100" width="150"></img>`;
    control.ExecuteWorkBookControlCommand(cmd, false);
}
```

### Logo Display Features
- **Responsive Sizing**: Automatic scaling for different contexts
- **Print Optimization**: Special handling for PDF exports
- **Error Handling**: Graceful fallback when logos fail to load
- **Multiple Contexts**: Support for headers, invoices, and documents

### Logo Management UI
- **Upload Interface**: Drag-and-drop style upload area
- **Progress Tracking**: Visual upload progress indicator
- **Preview**: Real-time logo preview
- **Management Actions**: Change, remove, and replace functionality
- **Error Feedback**: Clear error messages and recovery options

### Logo Removal
```javascript
const handleRemoveLogo = async () => {
    await ApiService.deleteLogo(userLogo.fileName);
    setUserLogo(null);
    // Clear from spreadsheet if needed
    AppGeneral.removeLogo(LOGO_COORDINATES);
};
```

---

## 💾 9. Autosave

### Overview
Intelligent automatic saving system that continuously backs up user work without interrupting the editing experience.

### Technical Architecture
**Hook**: `src/hooks/useAutosave.js`
**Configuration**: `src/config/autosave.config.js`
**Context**: `src/context/PopupContext.js`

### Core Features

#### Change Detection
```javascript
const hasContentChanged = useCallback(() => {
    const currentContent = getCurrentContent();
    if (!currentContent) return false;
    
    const newHash = btoa(currentContent).slice(0, 100);
    if (newHash !== lastContentHashRef.current) {
        lastContentHashRef.current = newHash;
        return true;
    }
    return false;
}, [getCurrentContent]);
```

#### Debounced Saving
- **Delay**: 2-second delay after last change
- **Minimum Interval**: 5-second minimum between saves
- **Content Validation**: Only saves when content actually changes
- **Error Recovery**: Automatic retry with exponential backoff

### Autosave Configuration
```javascript
export const AUTO_SAVE_CONFIG = {
    DEBOUNCE_DELAY: 2000,        // Wait 2s after typing stops
    MIN_SAVE_INTERVAL: 5000,     // Minimum 5s between saves
    MAX_RETRY_ATTEMPTS: 3,       // Retry failed saves 3 times
    RETRY_DELAY: 1000,          // Wait 1s between retries
    SAVED_STATUS_DURATION: 3000, // Show "saved" for 3s
    ERROR_STATUS_DURATION: 5000  // Show errors for 5s
};
```

### Save Triggers

#### Typing Autosave
```javascript
const handleLocalAutoSave = useCallback(async (isRetry = false) => {
    if (!isAutoSaveEnabled()) return;
    
    const content = getCurrentContent();
    const saveFileName = currentFile || 'default';
    
    const fileObj = new File(
        existingData?.created || new Date().toString(),
        new Date().toString(),
        encodeURIComponent(content),
        saveFileName,
        existingData?.password // Preserve password protection
    );
    
    storeRef.current._saveFile(fileObj);
}, [currentFile, getCurrentContent]);
```

#### App Close/Refresh Autosave
```javascript
useEffect(() => {
    const handleBeforeUnload = (event) => {
        saveToBackend();
        event.preventDefault();
        event.returnValue = '';
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [saveToBackend]);
```

### Advanced Features
- **Password Preservation**: Maintains password protection during autosave
- **File Type Handling**: Different behavior for named vs. default files
- **Background Operation**: Non-blocking saves that don't interrupt user workflow
- **Storage Optimization**: Efficient localStorage usage with cleanup
- **Cross-tab Safety**: Handles multiple browser tabs safely

### User Experience
- **Invisible Operation**: Saves happen seamlessly in background
- **No Data Loss**: Automatic recovery from browser crashes
- **Smart Detection**: Only saves when actual changes are made
- **Performance Optimized**: Minimal impact on application responsiveness

---

## 🔧 Configuration & Environment

### Environment Variables
```env
# Web3 Configuration
REACT_APP_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
REACT_APP_ALCHEMY_ID=your_alchemy_api_key

# API Configuration
REACT_APP_API_BASE_URL=http://localhost:8888

# AWS S3 Configuration
REACT_APP_REGION=your-aws-region
REACT_APP_BUCKET=your-s3-bucket-name
REACT_APP_ACCESS_KEY=your-aws-access-key
REACT_APP_SECRET_KEY=your-aws-secret-key

# Dropbox Configuration
REACT_APP_DROPBOX_ACCESS_TOKEN=your-dropbox-access-token
```

### Backend API Endpoints
- **Authentication**: `/api/v1/signup`, `/api/v1/signin`, `/api/v1/checkAuth`
- **S3 Operations**: `/api/v1/listAllS3`, `/api/v1/getFileS3`, `/api/v1/uploadFileS3`, `/api/v1/deleteFileS3`
- **Dropbox Operations**: `/api/v1/listAllDropbox`, `/api/v1/getFileDropbox`, `/api/v1/uploadFileDropbox`, `/api/v1/deleteFileDropbox`
- **Logo Management**: `/api/v1/uploadLogo`, `/api/v1/deleteLogo`, `/api/v1/getUserLogo`

---

## 🚀 Getting Started

### Installation
```bash
git clone https://github.com/your-repo/My_Web3-Medical-Invoice.git
cd My_Web3-Medical-Invoice
yarn install
```

### Development
```bash
yarn start          # Start development server
yarn build          # Build for production
yarn test           # Run tests
```

### Production Deployment
```bash
yarn build
# Deploy build/ directory to your web server
```

---

## 📱 Browser Compatibility

### Supported Browsers
- **Chrome**: 88+ (full support)
- **Firefox**: 85+ (full support)
- **Safari**: 14+ (full support)
- **Edge**: 88+ (full support)

### Mobile Support
- **iOS Safari**: 14+
- **Chrome Mobile**: 88+
- **Firefox Mobile**: 85+

### Feature Dependencies
- **LocalStorage**: Required for file storage and autosave
- **Web Workers**: Enhanced for background processing
- **File API**: Required for logo upload and file management
- **Fetch API**: Required for cloud storage operations

---

## 🔒 Security Considerations

### Data Protection
- **JWT Authentication**: Secure token-based authentication
- **Password Protection**: File-level password security
- **HTTPS Required**: All production deployments should use HTTPS
- **Token Expiration**: Automatic logout on token expiry

### Privacy
- **Local Storage**: Sensitive data stored locally in browser
- **Cloud Encryption**: Files encrypted in transit to cloud providers
- **No Server Storage**: Passwords and sensitive data not stored on servers
- **User Control**: Complete user control over data storage and sharing

---

## 📞 Support & Documentation

### Technical Support
- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Comprehensive guides in `/docs`
- **API Reference**: Complete API documentation available
- **Community**: Active developer community for support

### Contributing
- **Pull Requests**: Welcome for bug fixes and features
- **Code Standards**: ESLint and Prettier configurations provided
- **Testing**: Jest test suite for quality assurance
- **Documentation**: Update docs with new features

---

*This documentation covers all major features of the Web3 Medical Invoice System. For technical implementation details, refer to the source code and inline documentation.* 