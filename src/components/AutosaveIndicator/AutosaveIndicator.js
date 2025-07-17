import React from 'react';
import { usePopup } from '../../context/PopupContext';
import './AutosaveIndicator.css';

const AutosaveIndicator = () => {
    const { autoSaveStatus } = usePopup();

    if (autoSaveStatus === 'idle') return null;

    const getStatusConfig = () => {
        switch (autoSaveStatus) {
            case 'saving':
                return {
                    icon: '⏳',
                    text: 'Saving...',
                    className: 'autosave-saving'
                };
            case 'saved':
                return {
                    icon: '✓',
                    text: 'Saved',
                    className: 'autosave-saved'
                };
            case 'error':
                return {
                    icon: '⚠',
                    text: 'Save Failed',
                    className: 'autosave-error'
                };
            default:
                return null;
        }
    };

    const statusConfig = getStatusConfig();
    if (!statusConfig) return null;

    return (
        <div className={`autosave-indicator ${statusConfig.className}`}>
            <span className="autosave-icon">{statusConfig.icon}</span>
            <span className="autosave-text">{statusConfig.text}</span>
        </div>
    );
};

export default AutosaveIndicator; 