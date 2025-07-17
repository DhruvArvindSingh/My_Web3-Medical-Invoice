import React, { useState, useEffect } from 'react';
import { isAutoSaveEnabled, setAutoSaveEnabled, AUTO_SAVE_CONFIG } from '../../config/autosave.config';
import './AutosaveSettings.css';

const AutosaveSettings = ({ onClose }) => {
    const [isEnabled, setIsEnabled] = useState(isAutoSaveEnabled());

    const handleToggle = (enabled) => {
        setAutoSaveEnabled(enabled);
        setIsEnabled(enabled);
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="autosave-settings-overlay" onClick={handleOverlayClick}>
            <div className="autosave-settings-dialog">
                <div className="autosave-settings-header">
                    <h3>Autosave Settings</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="autosave-settings-content">
                    <div className="setting-item">
                        <label className="toggle-label">
                            <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={(e) => handleToggle(e.target.checked)}
                                className="toggle-input"
                            />
                            <span className="toggle-slider"></span>
                            <span className="setting-text">Enable Autosave</span>
                        </label>
                    </div>

                    {isEnabled && (
                        <div className="autosave-info">
                            <div className="info-item">
                                <span className="info-label">Save Delay:</span>
                                <span className="info-value">{AUTO_SAVE_CONFIG.DEBOUNCE_DELAY / 1000} seconds after last edit</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Retry Attempts:</span>
                                <span className="info-value">{AUTO_SAVE_CONFIG.MAX_RETRY_ATTEMPTS} times on failure</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Save Behavior:</span>
                                <span className="info-value">Saves all files automatically</span>
                            </div>
                        </div>
                    )}

                    <div className="autosave-description">
                        <p>
                            {isEnabled
                                ? `Changes will be automatically saved ${AUTO_SAVE_CONFIG.DEBOUNCE_DELAY / 1000} seconds after you stop editing.`
                                : 'Autosave is disabled. You will need to save files manually.'
                            }
                        </p>
                        <p className="note">
                            Note: Autosave only works for named files (not 'default' templates).
                        </p>
                    </div>
                </div>

                <div className="autosave-settings-footer">
                    <button className="done-btn" onClick={onClose}>
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AutosaveSettings; 