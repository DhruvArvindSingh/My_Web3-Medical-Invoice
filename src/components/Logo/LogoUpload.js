import React, { useState, useRef } from 'react';
import ApiService from '../../services/ApiService';
import './LogoUpload.css';
import * as AppGeneral from '../../socialcalc/AppGeneral';
import { LOGO } from '../../app-data';

const LogoUpload = ({ userLogo, setUserLogo, onLogoChange }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const fileInputRef = useRef(null);

    const validateFile = (file) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            return {
                isValid: false,
                error: 'Please upload a PNG, JPG, JPEG, or SVG file'
            };
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return {
                isValid: false,
                error: 'File size must be less than 5MB'
            };
        }

        return { isValid: true };
    };

    const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleFileSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const validation = validateFile(file);
        if (!validation.isValid) {
            setError(validation.error);
            return;
        }

        uploadLogo(file);
    };

    const uploadLogo = async (file) => {
        setIsUploading(true);
        setUploadProgress(0);
        setError(null);

        try {
            const base64String = await convertFileToBase64(file);

            const timestamp = Date.now();
            const fileExtension = file.name.split('.').pop();
            const fileName = `logo_${timestamp}.${fileExtension}`;

            // Simulate progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 200);

            const response = await ApiService.uploadLogo(fileName, base64String);

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (response.success && response.data.signedUrl) {
                // setLoadingMessage("Adding logo to spreadsheet...");

                // Use the signed URL instead of the base64 data
                if (AppGeneral.addLogo) {
                    const deviceType = AppGeneral.getDeviceType ? AppGeneral.getDeviceType() : "default";
                    await AppGeneral.addLogo(LOGO[`${deviceType}`], response.data.signedUrl);
                    // setToastMessage("Logo added successfully");
                    // setShowToast1(true);
                } else {
                    // Fallback: Store logo URL in localStorage for future use
                    localStorage.setItem('spreadsheet_logo_url', response.data.signedUrl);
                    setToastMessage("Logo uploaded successfully. Please refresh to see changes.");
                    setShowToast1(true);
                }
            } else {
                throw new Error(response.message || 'Failed to upload logo');
            }

        } catch (error) {
            console.error('Logo upload error:', error);
            setError(error.message || 'Failed to upload logo');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleRemoveLogo = () => {
        setShowDeleteConfirm(true);
    };

    const confirmRemoveLogo = async () => {
        if (!userLogo?.fileName) {
            setShowDeleteConfirm(false);
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            await ApiService.deleteLogo(userLogo.fileName);
            setUserLogo(null);
            if (onLogoChange) {
                onLogoChange(null);
            }
        } catch (error) {
            console.error('Logo removal error:', error);
            setError('Failed to remove logo');
        } finally {
            setIsUploading(false);
            setShowDeleteConfirm(false);
        }
    };

    const cancelRemoveLogo = () => {
        setShowDeleteConfirm(false);
    };

    return (
        <div className="logo-upload-container">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            <div className="logo-display-area">
                {userLogo?.url ? (
                    <div className="logo-preview">
                        <img
                            src={userLogo.url}
                            alt="Company Logo"
                            className="logo-image"
                            onError={() => {
                                setUserLogo(null);
                                setError('Failed to load logo');
                            }}
                        />
                        <div className="logo-actions">
                            <button
                                className="logo-btn logo-btn-primary"
                                onClick={triggerFileInput}
                                disabled={isUploading}
                            >
                                Change
                            </button>
                            <button
                                className="logo-btn logo-btn-danger"
                                onClick={handleRemoveLogo}
                                disabled={isUploading}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="logo-placeholder">
                        <div className="logo-placeholder-icon">📷</div>
                        <p>No logo uploaded</p>
                        <button
                            className="logo-btn logo-btn-primary"
                            onClick={triggerFileInput}
                            disabled={isUploading}
                        >
                            Upload Logo
                        </button>
                    </div>
                )}
            </div>

            {isUploading && (
                <div className="upload-progress">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                    </div>
                    <p>Uploading logo... {uploadProgress}%</p>
                </div>
            )}

            {error && (
                <div className="error-message">
                    <span>⚠️ {error}</span>
                    <button
                        className="error-close"
                        onClick={() => setError(null)}
                    >
                        ×
                    </button>
                </div>
            )}

            {showDeleteConfirm && (
                <div className="delete-confirm-overlay">
                    <div className="delete-confirm-modal">
                        <h3>Remove Logo</h3>
                        <p>Are you sure you want to remove your company logo?</p>
                        <div className="delete-confirm-actions">
                            <button
                                className="logo-btn logo-btn-secondary"
                                onClick={cancelRemoveLogo}
                            >
                                Cancel
                            </button>
                            <button
                                className="logo-btn logo-btn-danger"
                                onClick={confirmRemoveLogo}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LogoUpload;