export const AUTO_SAVE_CONFIG = {
    // Timing configurations
    DEBOUNCE_DELAY: 2000,           // Wait 2s after last edit before saving
    SAVED_STATUS_DURATION: 2000,    // Show "saved" status for 2s
    ERROR_STATUS_DURATION: 5000,    // Show error status for 5s
    MIN_SAVE_INTERVAL: 500,         // Minimum 500ms between saves

    // Retry logic
    MAX_RETRY_ATTEMPTS: 3,          // Retry failed saves 3 times
    RETRY_DELAY: 1000,              // Wait 1s between retries

    // Feature toggles
    ENABLED: true,                  // Master enable/disable
    USER_PREFERENCE_KEY: 'autosave-enabled', // LocalStorage key

    // No file exclusions - save all files
    EXCLUDED_FILES: [],
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'development') {
    AUTO_SAVE_CONFIG.DEBOUNCE_DELAY = 1500;  // Faster for development
}

// Utility functions
export const isAutoSaveEnabled = () => {
    try {
        const userPreference = localStorage.getItem(AUTO_SAVE_CONFIG.USER_PREFERENCE_KEY);
        return userPreference !== null ? userPreference === 'true' : AUTO_SAVE_CONFIG.ENABLED;
    } catch {
        return AUTO_SAVE_CONFIG.ENABLED;
    }
};

export const setAutoSaveEnabled = (enabled) => {
    try {
        localStorage.setItem(AUTO_SAVE_CONFIG.USER_PREFERENCE_KEY, enabled.toString());
    } catch {
        // Silently fail
    }
}; 