import { useEffect, useRef, useCallback } from 'react';
import { usePopup } from '../context/PopupContext';
import { AUTO_SAVE_CONFIG, isAutoSaveEnabled } from '../config/autosave.config';
import * as AppGeneral from '../socialcalc/AppGeneral';
import { File, Local } from '../components/storage/LocalStorage';
import ApiService from '../services/ApiService';

export const useAutosave = (currentFile, updateSelectedFile) => {
    const { autoSaveStatus, setAutoSaveStatus } = usePopup();
    const storeRef = useRef(new Local());

    // Refs for managing timers and state
    const autoSaveTimerRef = useRef(null);
    const lastSaveTimeRef = useRef(0);
    const retryCountRef = useRef(0);
    const lastContentRef = useRef('');
    const changeListenerRef = useRef(null);

    // Get current spreadsheet content
    const getCurrentContent = useCallback(() => {
        try {
            return AppGeneral.getSpreadsheetContent();
        } catch (error) {
            console.error('Error getting spreadsheet content:', error);
            return null;
        }
    }, []);

    // Check if content has changed
    const hasContentChanged = useCallback(() => {
        const currentContent = getCurrentContent();
        if (!currentContent) return false;

        const hasChanged = currentContent !== lastContentRef.current;
        if (hasChanged) {
            lastContentRef.current = currentContent;
        }
        return hasChanged;
    }, [getCurrentContent]);

    // Save to local storage after typing stops (2 seconds)
    const handleLocalAutoSave = useCallback(async (isRetry = false) => {
        // Check if autosave is enabled
        if (!isAutoSaveEnabled()) return;

        // Prevent excessive saving
        const now = Date.now();
        if (now - lastSaveTimeRef.current < AUTO_SAVE_CONFIG.MIN_SAVE_INTERVAL && !isRetry) {
            return;
        }

        // Don't save if no content changes
        if (!hasContentChanged() && !isRetry) {
            return;
        }

        lastSaveTimeRef.current = now;
        setAutoSaveStatus('saving');

        try {
            // Get current data to save
            const content = getCurrentContent();
            if (!content) {
                throw new Error('No content to save');
            }

            // Determine the filename to save with
            const saveFileName = currentFile || 'default';

            // Get existing file data or create new
            const existingData = storeRef.current._getFile(saveFileName);
            const fileObj = new File(
                existingData?.created || new Date().toString(),
                new Date().toString(),
                encodeURIComponent(content),
                saveFileName,
                existingData?.password // Preserve existing password if it exists
            );

            // Perform save operation to local storage
            storeRef.current._saveFile(fileObj);

            setAutoSaveStatus('saved');
            retryCountRef.current = 0;

            // Reset to idle after configured duration
            setTimeout(() => {
                setAutoSaveStatus('idle');
            }, AUTO_SAVE_CONFIG.SAVED_STATUS_DURATION);

            console.log(`Auto-saved to local storage: ${saveFileName}`);

        } catch (error) {
            console.error("Auto-save failed:", error);

            // Implement retry logic
            if (retryCountRef.current < AUTO_SAVE_CONFIG.MAX_RETRY_ATTEMPTS) {
                retryCountRef.current++;
                setTimeout(() => {
                    handleLocalAutoSave(true);
                }, AUTO_SAVE_CONFIG.RETRY_DELAY);
                return;
            }

            // Show error after all retries failed
            setAutoSaveStatus('error');
            retryCountRef.current = 0;

            setTimeout(() => {
                setAutoSaveStatus('idle');
            }, AUTO_SAVE_CONFIG.ERROR_STATUS_DURATION);
        }
    }, [currentFile, setAutoSaveStatus, getCurrentContent, hasContentChanged]);

    // Save to backend on app close/refresh
    const saveToBackend = useCallback(async () => {
        try {
            const content = getCurrentContent();
            if (!content) return;

            // Determine filename for backend save
            const backendFileName = currentFile === 'default' || !currentFile ? 'default' : currentFile;

            console.log(`Saving to backend as: ${backendFileName}`);

            // For now, we'll save to localStorage as the primary backend
            // In future, this could be extended to save to actual backend API
            const existingData = storeRef.current._getFile(backendFileName);
            const fileObj = new File(
                existingData?.created || new Date().toString(),
                new Date().toString(),
                encodeURIComponent(content),
                backendFileName,
                existingData?.password // Preserve existing password if it exists
            );

            storeRef.current._saveFile(fileObj);
            console.log(`Backend save completed: ${backendFileName}`);

        } catch (error) {
            console.error('Backend save failed:', error);
        }
    }, [currentFile, getCurrentContent]);

    // Debounced trigger function for local saves
    const triggerAutoSave = useCallback(() => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(() => {
            handleLocalAutoSave();
            autoSaveTimerRef.current = null;
        }, AUTO_SAVE_CONFIG.DEBOUNCE_DELAY);
    }, [handleLocalAutoSave]);

    // Set up change detection
    useEffect(() => {
        if (!currentFile) return;

        // Initialize content reference
        const initialContent = getCurrentContent();
        if (initialContent) {
            lastContentRef.current = initialContent;
        }

        // Set up change detection interval (since SocialCalc doesn't have direct change events)
        const changeDetectionInterval = setInterval(() => {
            if (hasContentChanged()) {
                triggerAutoSave();
            }
        }, 1000); // Check for changes every second

        // Store cleanup function
        changeListenerRef.current = () => {
            clearInterval(changeDetectionInterval);
        };

        // Cleanup on unmount
        return () => {
            if (changeListenerRef.current) {
                changeListenerRef.current();
            }
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [currentFile, hasContentChanged, triggerAutoSave]);

    // Manual save function for immediate saves
    const saveNow = useCallback(() => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = null;
        }
        handleLocalAutoSave();
    }, [handleLocalAutoSave]);

    return {
        saveNow,
        triggerAutoSave,
        saveToBackend
    };
}; 