# 🏥 Web3 Medical Invoice System

A modern, decentralized medical billing and invoice management system built with React, featuring Web3 integration, automatic saving, and multi-cloud storage support.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3.1-blue.svg)
![Web3](https://img.shields.io/badge/Web3-Enabled-green.svg)

## ✨ Features

### 🔗 Web3 Integration
- **MetaMask Integration**: Seamless wallet connection using ConnectKit
- **Multi-Chain Support**: Built with Wagmi and Viem for robust blockchain interactions
- **WalletConnect**: Support for various wallet providers

### 📊 Spreadsheet Engine
- **SocialCalc Integration**: Powerful spreadsheet functionality for invoice creation
- **Real-time Editing**: Live spreadsheet editing with formula support
- **Export/Import**: Save and load invoice data in multiple formats

### ☁️ Multi-Cloud Storage
- **AWS S3**: Enterprise-grade object storage
- **Dropbox**: User-friendly cloud storage with easy sharing
- **Local Storage**: Offline-first approach with local data persistence

### 🔄 Auto-Save System
- **Smart Auto-Save**: Automatic saving with configurable intervals
- **Change Detection**: Intelligent content change monitoring
- **Retry Logic**: Robust error handling with automatic retries
- **Visual Indicators**: Real-time save status feedback

### 🎨 User Experience
- **Responsive Design**: Mobile and desktop optimized
- **Custom Logo Upload**: Personalized branding for invoices
- **Tabbed Interface**: Easy switching between storage providers
- **Search Functionality**: Quick file discovery across storage providers

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:
- **Node.js** (v16 or higher)
- **Yarn** package manager
- **Git**

```bash
# Check versions
node -v
yarn -v
git --version
```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DhruvArvindSingh/My_Web3-Medical-Invoice.git
   cd My_Web3-Medical-Invoice
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Configure your `.env` file**
   ```env
   # Web3 Configuration
   REACT_APP_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
   REACT_APP_ALCHEMY_ID=your_alchemy_api_key
   
   # AWS S3 Configuration
   REACT_APP_REGION=your-aws-region
   REACT_APP_BUCKET=your-s3-bucket-name
   REACT_APP_ACCESS_KEY=your-aws-access-key
   REACT_APP_SECRET_KEY=your-aws-secret-key
   
   # Dropbox Configuration
   REACT_APP_DROPBOX_ACCESS_TOKEN=your-dropbox-access-token
   ```

5. **Start the development server**
   ```bash
   yarn start
   ```

The application will be available at `http://localhost:3000`

## 🔧 Configuration

### Web3 Setup

#### WalletConnect Project ID
1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy your Project ID
4. Add to `.env`: `REACT_APP_WALLETCONNECT_PROJECT_ID=your_project_id`

#### Alchemy API Key
1. Go to [Alchemy Dashboard](https://dashboard.alchemy.com/)
2. Create a new app
3. Copy your API key
4. Add to `.env`: `REACT_APP_ALCHEMY_ID=your_api_key`

### Cloud Storage Setup

#### AWS S3 Configuration
```env
REACT_APP_REGION=us-east-1
REACT_APP_BUCKET=your-bucket-name
REACT_APP_ACCESS_KEY=your-access-key
REACT_APP_SECRET_KEY=your-secret-key
```

#### Dropbox Configuration
1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Create a new app with these settings:
   - **API**: Scoped access
   - **Access**: Full Dropbox
   - **Permissions**: `files.metadata.read`, `files.content.read`, `files.content.write`
3. Generate an access token
4. Add to `.env`: `REACT_APP_DROPBOX_ACCESS_TOKEN=your_token`

### Auto-Save Configuration

The auto-save system can be configured in `src/config/autosave.config.js`:

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

## 📱 Usage

### Creating Invoices
1. **Start with Template**: The app loads with a default medical invoice template
2. **Edit Spreadsheet**: Click on cells to edit patient information, services, and costs
3. **Add Formulas**: Use spreadsheet formulas for automatic calculations
4. **Auto-Save**: Changes are automatically saved as you type

### Managing Files
1. **List Files**: Click "List Files" to view saved invoices
2. **Cloud Storage**: Use "Cloud" button to access S3/Dropbox files
3. **Search**: Use the search bar to find specific invoices
4. **Export/Import**: Save invoices locally or to cloud storage

### Web3 Features
1. **Connect Wallet**: Click the ConnectKit button to connect your wallet
2. **Blockchain Integration**: Future features will include on-chain invoice verification
3. **Multi-Chain**: Support for Ethereum and other EVM-compatible chains

### Customization
1. **Logo Upload**: Click "Logo" to upload your practice logo
2. **Auto-Save Settings**: Click the ⚙️ button to configure auto-save preferences
3. **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🏗️ Project Structure

```
src/
├── App/                    # Main application component
├── components/             # Reusable UI components
│   ├── AutosaveIndicator/ # Save status indicator
│   ├── AutosaveSettings/  # Auto-save configuration
│   └── Login/            # Authentication component
├── Cloud/                 # Cloud storage integration
├── Files/                 # Local file management
├── Logo/                  # Logo upload functionality
├── Menu/                  # Application menu
├── config/                # Configuration files
├── context/               # React context providers
├── hooks/                 # Custom React hooks
├── services/              # API and external services
├── socialcalc/           # Spreadsheet engine
├── storage/              # Storage abstractions
└── utils/                # Utility functions
```

## 🛠️ Available Scripts

```bash
# Development
yarn start          # Start development server
yarn build          # Build for production
yarn test           # Run test suite

# Linting and Formatting
yarn lint           # Run ESLint
yarn format         # Format code with Prettier
```

## 🔍 Troubleshooting

### Common Issues

#### Dropbox Connection Issues
- **401 Error**: Check if your access token is valid and has proper permissions
- **403 Error**: Ensure your app has `files.content.write` permission enabled
- **400 Error**: Verify the API request format (usually auto-resolved)

#### Web3 Connection Problems
- **Wallet Not Detected**: Ensure MetaMask or compatible wallet is installed
- **Network Issues**: Check if you're connected to the correct blockchain network
- **Transaction Failures**: Verify sufficient gas fees and network connectivity

#### Auto-Save Issues
- **Not Saving**: Check browser console for errors and verify storage permissions
- **Frequent Saves**: Adjust `DEBOUNCE_DELAY` in auto-save configuration
- **Save Failures**: Check network connectivity and storage quotas

### Debug Mode
Enable debug logging by adding to your `.env`:
```env
REACT_APP_DEBUG=true
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **SocialCalc**: Spreadsheet engine powering the invoice editor
- **ConnectKit**: Elegant Web3 connection interface
- **Wagmi**: React hooks for Ethereum
- **React Query**: Data fetching and caching

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/DhruvArvindSingh/My_Web3-Medical-Invoice/issues)
- **Discussions**: [GitHub Discussions](https://github.com/DhruvArvindSingh/My_Web3-Medical-Invoice/discussions)
- **Email**: [Contact Us](mailto:support@example.com)

## 🗺️ Roadmap

- [ ] **Blockchain Invoice Storage**: Store invoice hashes on-chain for verification
- [ ] **Multi-Currency Support**: Support for various cryptocurrencies
- [ ] **Patient Portal**: Allow patients to view and pay invoices
- [ ] **Insurance Integration**: Connect with insurance providers
- [ ] **Advanced Analytics**: Invoice analytics and reporting
- [ ] **Mobile App**: Native mobile application
- [ ] **API Integration**: RESTful API for third-party integrations

---

**Built with ❤️ for the future of medical billing**
