# Autosave Implementation for Web3 Medical Invoice

## Overview

This implementation adds comprehensive autosave functionality to the Web3 Medical Invoice React application. The autosave system automatically saves spreadsheet changes to local storage with visual feedback, retry logic, error handling, and user preference management.

## Features

### ✅ Core Functionality
- **Automatic Saving**: Saves changes 3 seconds after the last edit (configurable)
- **Visual Feedback**: Shows saving status with animated indicators in the app header
- **Retry Logic**: Automatically retries failed saves up to 3 times
- **Change Detection**: Monitors spreadsheet content changes through polling
- **File Exclusions**: Skips autosave for 'default', 'template', and 'untitled' files
- **User Preferences**: Toggle autosave on/off with settings stored in localStorage

### ✅ User Interface
- **Status Indicator**: Shows "Saving...", "Saved", or "Save Failed" in the header
- **Settings Dialog**: Accessible via gear icon (⚙️) in the header
- **Modern UI**: Responsive design with smooth animations and professional styling
- **Non-Intrusive**: Minimal impact on user workflow

### ✅ Advanced Features
- **App Close Autosave**: Automatically saves when user closes browser/tab
- **Visibility Change Saving**: Saves when user switches tabs or minimizes window
- **Debounced Saves**: Prevents excessive save operations
- **Error Handling**: Graceful error recovery with user feedback

## Architecture

### Components

1. **`src/config/autosave.config.js`**
   - Centralized configuration for timing, retry logic, and feature toggles
   - Environment-specific overrides (faster in development)
   - Utility functions for user preferences

2. **`src/hooks/useAutosave.js`**
   - Custom React hook managing autosave logic
   - Change detection through content polling
   - Debounced save operations with retry logic
   - Integration with SocialCalc spreadsheet engine

3. **`src/components/AutosaveIndicator/`**
   - Visual feedback component with animated status icons
   - Displays in app header during save operations
   - Responsive design with CSS animations

4. **`src/components/AutosaveSettings/`**
   - User preference management dialog
   - Modern toggle switches and configuration display
   - Settings persistence in localStorage

5. **`src/context/PopupContext.js`** (Extended)
   - Added autosave status state management
   - Centralized state for visual indicators

## Configuration

### Default Settings
```javascript
const AUTO_SAVE_CONFIG = {
    DEBOUNCE_DELAY: 3000,           // Wait 3s after last edit
    SAVED_STATUS_DURATION: 2000,    // Show "saved" status for 2s
    ERROR_STATUS_DURATION: 5000,    // Show error status for 5s
    MIN_SAVE_INTERVAL: 1000,        // Minimum 1s between saves
    MAX_RETRY_ATTEMPTS: 3,          // Retry failed saves 3 times
    RETRY_DELAY: 1000,              // Wait 1s between retries
    ENABLED: true,                  // Master enable/disable
    EXCLUDED_FILES: ['default', 'template', 'untitled']
};
```

### Environment Overrides
- **Development**: `DEBOUNCE_DELAY` reduced to 2 seconds for faster testing
- **Production**: Uses default settings for optimal user experience

## Usage

### For Users

1. **Automatic Operation**
   - Autosave works automatically when editing named files
   - Visual indicator appears in header during save operations
   - No manual intervention required

2. **Settings Management**
   - Click the gear icon (⚙️) in the app header
   - Toggle autosave on/off as needed
   - View current configuration settings

3. **File Requirements**
   - Works with all named files (not 'default' templates)
   - Saves to local storage using existing File/Local classes
   - Compatible with existing save/load workflow

### For Developers

1. **Integration**
   ```javascript
   // In your main component
   import { useAutosave } from '../hooks/useAutosave';
   
   const { saveNow, triggerAutoSave } = useAutosave(currentFile, updateSelectedFile);
   ```

2. **Configuration**
   ```javascript
   // Modify settings in src/config/autosave.config.js
   import { AUTO_SAVE_CONFIG, isAutoSaveEnabled, setAutoSaveEnabled } from '../config/autosave.config';
   ```

3. **Status Monitoring**
   ```javascript
   // Access autosave status via context
   const { autoSaveStatus, setAutoSaveStatus } = usePopup();
   ```

## Technical Implementation

### Change Detection
- **Polling Strategy**: Checks for content changes every 1 second
- **Content Comparison**: Compares current spreadsheet content with last saved version
- **Efficient Updates**: Only triggers save when actual changes detected

### Save Logic Flow
1. **Change Detected** → Content comparison reveals differences
2. **Debounce Timer** → Waits for configured delay after last change
3. **Validation** → Checks if autosave enabled and file not excluded
4. **Save Operation** → Saves to localStorage using existing File class
5. **Status Update** → Updates UI with success/error feedback
6. **Retry Logic** → Retries on failure up to maximum attempts

### Error Handling
- **Retry Mechanism**: Automatic retries with exponential backoff
- **User Feedback**: Clear error messages with visual indicators
- **Graceful Degradation**: App continues working if autosave fails
- **Logging**: Console logging for debugging (non-disruptive)

## Browser Compatibility

### Supported Features
- **localStorage**: Used for file storage and user preferences
- **beforeunload**: Saves on browser/tab close
- **visibilitychange**: Saves when tab becomes hidden
- **Modern CSS**: Animations and transitions for visual feedback

### Fallbacks
- **localStorage Unavailable**: Gracefully disables preference storage
- **Event Support**: Checks for API availability before binding events
- **CSS Support**: Progressive enhancement for animations

## Testing

### Manual Testing Scenarios

1. **Basic Autosave**
   - Open/create a named file
   - Make changes to spreadsheet cells
   - Verify "Saving..." indicator appears after 3 seconds
   - Confirm "Saved" status shows briefly

2. **Settings Management**
   - Click gear icon in header
   - Toggle autosave off/on
   - Verify preference persists after page reload

3. **Error Scenarios**
   - Disable localStorage (browser dev tools)
   - Make changes and verify error handling
   - Check retry attempts in console

4. **App Close Behavior**
   - Make changes to a file
   - Close browser tab/window
   - Reopen and verify changes were saved

### Automated Testing
```javascript
// Example test for autosave hook
describe('useAutosave', () => {
  it('should save after debounce delay', async () => {
    // Test implementation here
  });
  
  it('should retry on save failure', async () => {
    // Test retry logic
  });
});
```

## Performance Considerations

### Optimizations
- **Debounced Saves**: Prevents excessive API calls during rapid editing
- **Content Comparison**: Only saves when actual changes detected
- **Minimal Polling**: 1-second intervals balance responsiveness with performance
- **Efficient Storage**: Reuses existing Local storage implementation

### Memory Management
- **Timer Cleanup**: All timeouts properly cleared on component unmount
- **Event Cleanup**: All event listeners removed during cleanup
- **Ref Usage**: Prevents memory leaks with proper ref management

## Future Enhancements

### Possible Improvements
1. **Cloud Autosave**: Extend to save to S3/Dropbox automatically
2. **Conflict Resolution**: Handle multiple simultaneous editors
3. **Version History**: Track autosave versions for recovery
4. **Real-time Sync**: WebSocket-based real-time collaboration
5. **Progressive Enhancement**: Service worker for offline autosave

### Configuration Extensions
- **Custom Save Intervals**: User-configurable timing
- **File-Specific Settings**: Per-file autosave preferences  
- **Backup Strategies**: Multiple backup locations
- **Compression**: Optional content compression for large files

## Troubleshooting

### Common Issues

1. **Autosave Not Working**
   - Check if file is named (not 'default')
   - Verify autosave is enabled in settings
   - Confirm localStorage is available

2. **Visual Indicator Missing**
   - Check browser console for React errors
   - Verify PopupContext provider is properly wrapped

3. **Save Failures**
   - Check localStorage quota limits
   - Verify file permissions in browser
   - Review console logs for specific errors

### Debug Mode
Enable detailed logging by opening browser console:
```javascript
// Temporary debug mode (add to config)
AUTO_SAVE_CONFIG.DEBUG = true;
```

## Support

For issues or feature requests related to autosave functionality:
1. Check browser console for error messages
2. Verify localStorage functionality in browser
3. Test with minimal example file
4. Report issues with steps to reproduce

---

**Implementation Status**: ✅ Complete
**Last Updated**: January 2024
**Compatibility**: React 18+, Modern Browsers
**Dependencies**: SocialCalc, LocalStorage utilities 