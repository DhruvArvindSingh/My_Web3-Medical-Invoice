# Web3-Medical-Invoice
Medical Billing System with Metamask integration, activation using  ConnectKit and Web3 tooling

## Prerequisites

Make sure you have Node.js and Yarn installed on your machine. You can check their versions using the following commands:

```bash
node -v
yarn -v
```

## Getting Started

### Cloning the Repository

Clone your fork of the Web3-Medical-Invoice repository:

```bash
git clone https://github.com/[USER_NAME]/Web3-Medical-Invoice
```

### Opening the Project

Open the project in your preferred code editor. If you use Visual Studio Code, you can do this with:

```bash
code Web3-Medical-Invoice
```

### Setting Up Environment Variables

1. Create a `.env` file in the root directory of the project:

   ```bash
   touch .env
   ```

2. Copy the contents from `.env.example` and paste them into `.env`.

3. Obtain the following credentials:

   - **WalletConnect Project ID**: Log into the [WalletConnect dashboard](https://walletconnect.com/) and retrieve your Project ID. Add it to `.env` like this:
     ```
     REACT_APP_WALLETCONNECT_PROJECT_ID=<your_walletconnect_project_id>
     ```

   - **Alchemy API Key**: Visit the [Alchemy dashboard](https://dashboard.alchemy.com/) to get your API key. Add it to `.env` like this:
     ```
     REACT_APP_ALCHEMY_ID=<your_alchemy_api_key>
     ```

### Installing Dependencies

Install the necessary dependencies using Yarn:

```bash
yarn
```

### Running the Project

To start the project locally and view it in your browser, run:

```bash
yarn start
```

The project will be available at `http://localhost:3000`.

## Cloud Storage Integration

The application now supports dual cloud storage providers for saving and managing medical invoices:

### Supported Providers

- **AWS S3**: Enterprise-grade object storage
- **Dropbox**: User-friendly cloud storage with easy sharing capabilities

### Environment Variables

Add the following environment variables to your `.env` file:

```bash
# AWS S3 Configuration
REACT_APP_REGION=your-aws-region
REACT_APP_BUCKET=your-s3-bucket-name
REACT_APP_ACCESS_KEY=your-aws-access-key
REACT_APP_SECRET_KEY=your-aws-secret-key

# Dropbox Configuration
REACT_APP_DROPBOX_ACCESS_TOKEN=your-dropbox-access-token
```

### Features

- **Tabbed Interface**: Switch between S3 and Dropbox storage providers
- **File Management**: Upload, download, edit, and delete invoice files
- **Search Functionality**: Search through your stored files
- **Real-time Sync**: Files are automatically refreshed after operations
- **Cross-Provider Support**: Each tab maintains its own file list and operations

### Usage

1. **Switching Providers**: Click on the S3 or Dropbox tabs to switch between storage providers
2. **Uploading Files**: Use the "Upload Current Invoice" option to save the current spreadsheet
3. **Managing Files**: Edit or delete files directly from the interface
4. **Searching**: Use the search bar to find specific files quickly

### Security Note

⚠️ **Important**: The current implementation stores credentials in frontend environment variables for development purposes. For production deployments, implement proper backend authentication and token management.

### Troubleshooting Dropbox Integration

If you encounter issues with Dropbox integration, follow these steps:

#### 1. **Check Environment Variables**
Ensure your `.env` file contains the Dropbox access token:
```bash
REACT_APP_DROPBOX_ACCESS_TOKEN=your-dropbox-access-token
```

#### 2. **Get Dropbox Access Token**
1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Click "Create app"
3. Choose "Scoped access" (recommended) or "Full access"
4. Select "Full Dropbox" for permissions
5. Choose "No" for "Can your app be limited to its own folder?"
6. Give your app a name (e.g., "Medical Invoice App")
7. Click "Create app"
8. In your app settings, go to the "Permissions" tab
9. Enable these permissions:
   - `files.metadata.read`
   - `files.content.read`
   - `files.content.write`
10. Go to the "Settings" tab
11. Under "OAuth 2", click "Generate" to create an access token
12. Copy the generated token (it should be ~64 characters long)
13. Add it to your `.env` file: `REACT_APP_DROPBOX_ACCESS_TOKEN=your_token_here`

#### 3. **Test Connection**
- Switch to the Dropbox tab in the application
- Click the "🔧 Test" button to verify your connection
- Check the browser console for detailed error messages

#### 4. **Common Issues**

| Error | Cause | Solution |
|-------|-------|----------|
| **400 Error** | Invalid API parameters | ✅ Fixed with proper content encoding |
| **401 Error** | Invalid/expired access token | Check token validity and permissions |
| **403 Error** | Insufficient app permissions | Enable required permissions in app console |

**401 Error Specific Solutions:**
1. **Token Expired**: Generate a new access token in Dropbox App Console
2. **Invalid Token**: Ensure token is copied correctly (no extra spaces)
3. **Wrong App Type**: Make sure app has "Full Dropbox" access
4. **Missing Permissions**: Enable `files.content.write` permission
5. **Token Format**: Token should be ~64 characters, alphanumeric

#### 5. **Debug Information**
The application logs detailed error information to the browser console. Check the console for:
- Access token configuration status
- API request/response details
- Error codes and messages
