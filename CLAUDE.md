# CLAUDE.md

## Agent Behavior Instructions

### MANDATORY Handoff Process
**Every agent MUST follow this exact workflow:**

1. **Check `comms.md`** - Read "Current Step Being Executed" to see if someone is working
2. **Wait your turn** - Only proceed if no one has "Status: In Progress" 
3. **Write what you're doing** - Update "Current Step Being Executed" with your action
4. **Execute ONE small step** - Make a focused, incremental change
5. **Write what's next** - Update "Next Step Required" with specific instructions for next agent
6. **Mark complete** - Change your status and add to Action Log

### Required Format in comms.md:
```
### Current Step Being Executed
**Agent**: [Frontend/Backend/Testing]
**Executing**: [Specific task you're doing right now]
**Status**: In Progress

### Next Step Required  
**Next Agent**: [Which agent goes next]
**Next Task**: [Exact step they should do]
**Why**: [Why this is the logical next step]
```

### Coordination Rules
- **ONE agent works at a time** - never overlap
- **Small steps only** - no big feature implementations
- **Clear handoffs** - be specific about what's next
- **Always update comms.md** - before and after your work

### Code Quality Standards
- Follow existing patterns
- Add helpful comments
- Test your changes
- Don't break existing functionality

---

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


## Action Logging Protocol
- Agents are designated as Agent 1, Agent 2, or Agent 3. - Start each log entry with 'Agent X:' where X is your assigned number.
- Describe the small step you executed.
- Specify the very next step required.
- Indicate the agent responsible for the next step (e.g., 'Next: Agent Y').
- Review previous logs to ensure continuity and awareness of others' actions.


## Development Commands

### Running the Application
```bash
yarn start          # Start development server on http://localhost:3000
yarn build          # Build for production
yarn test           # Run tests
```

### Installing Dependencies
```bash
yarn                # Install all dependencies
```

## Architecture Overview

### Core Components
This is a React-based Web3 medical invoice application built with a spreadsheet interface using SocialCalc. The application integrates blockchain wallet functionality with dual cloud storage providers.

**Main Application Structure:**
- `src/App/App.js` - Main application component with state management for file selection, cloud storage, and device detection
- `src/socialcalc/` - Spreadsheet engine integration (SocialCalc fork)
- `src/services/ApiService.js` - API client for backend communication with S3 and Dropbox endpoints
- `src/utils/Web3Provider.js` - Web3 wallet integration using ConnectKit and Wagmi
- `src/Cloud/Cloud.js` - Cloud storage interface component
- `src/Files/Files.js` - Local file management component
- `src/Menu/Menu.js` - Application menu component

### Web3 Integration
- Uses **ConnectKit** for wallet connection UI
- **Wagmi** for Web3 React hooks and chain management  
- Configured for **Polygon zkEVM Cardona** testnet
- Requires `REACT_APP_WALLETCONNECT_PROJECT_ID` and `REACT_APP_ALCHEMY_ID` environment variables

### Cloud Storage Architecture
The application provides dual cloud storage support through a tabbed interface:

**S3 Integration:**
- Backend API endpoints: `/api/v1/listAllS3`, `/api/v1/getFileS3`, `/api/v1/uploadFileS3`, `/api/v1/deleteFileS3`
- Environment variables: `REACT_APP_REGION`, `REACT_APP_BUCKET`, `REACT_APP_ACCESS_KEY`, `REACT_APP_SECRET_KEY`

**Dropbox Integration:**
- Backend API endpoints: `/api/v1/listAllDropbox`, `/api/v1/getFileDropbox`, `/api/v1/uploadFileDropbox`, `/api/v1/deleteFileDropbox`
- Environment variable: `REACT_APP_DROPBOX_ACCESS_TOKEN`

### Build Configuration
- Uses `react-app-rewired` for webpack customization
- `config-overrides.js` disables Node.js polyfills for minimal bundle size
- Web3 polyfills are minimally configured for wallet functionality only

### Backend API
- Default API base URL: `http://localhost:8888` (configurable via `REACT_APP_API_BASE_URL`)
- All API calls use POST requests with JSON payloads
- Includes request/response interceptors for debugging and error handling
- Authentication endpoints available: `/api/v1/signup`, `/api/v1/signin`

### SocialCalc Integration
- Spreadsheet functionality provided through modified SocialCalc library
- Device type detection for responsive UI
- Footer buttons and workbook controls integrated into React component lifecycle
- Spreadsheet data initialized from `src/app-data.js`

### State Management
The main App component manages:
- `selectedFile` - Currently active spreadsheet/invoice file
- `device` - Device type detection (mobile/desktop)
- `listFiles` - Toggle for local file management interface
- `cloud` - Toggle for cloud storage interface

File operations flow between local state, cloud storage APIs, and the SocialCalc spreadsheet engine.