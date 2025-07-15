import React, { useState, useEffect, useRef } from "react";
import './Cloud.css';
import * as AppGeneral from '../socialcalc/AppGeneral';
import { Local, File } from '../storage/LocalStorage.js';
import { DATA } from '../app-data.js';
import ApiService from '../services/ApiService';

const Cloud = ({ file, updateSelectedFile }) => {
    const localStoreRef = useRef(new Local());
    const [activeTab, setActiveTab] = useState('s3');
    const [s3Files, setS3Files] = useState({});
    const [dropboxFiles, setDropboxFiles] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [exportFormat, setExportFormat] = useState('');
    const [selectedCloudFiles, setSelectedCloudFiles] = useState({});
    const [showTransferAlert, setShowTransferAlert] = useState(false);
    const [conflictFiles, setConflictFiles] = useState([]);
    const [alertMessage, setAlertMessage] = useState('');

    const loadFiles = async () => {
        if (activeTab === 's3') {
            await loadFilesFromS3();
        } else {
            await loadFilesFromDropbox();
        }
    };

    useEffect(() => {
        loadFiles();
    }, [activeTab]);

    const switchTab = async (tab) => {
        setActiveTab(tab);

        if (tab === 's3' && Object.keys(s3Files).length === 0) {
            await loadFilesFromS3();
        } else if (tab === 'dropbox' && Object.keys(dropboxFiles).length === 0) {
            await loadFilesFromDropbox();
        }
    };

    const getCurrentFiles = () => {
        return activeTab === 's3' ? s3Files : dropboxFiles;
    };

    const testConnection = async () => {
        try {
            if (activeTab === 's3') {
                await ApiService.listAllS3();
                alert("S3 connection successful!");
            } else {
                await ApiService.listAllDropbox();
                alert("Dropbox connection successful!");
            }
            return true;
        } catch (err) {
            console.error("Connection test failed:", err);
            if (err.response?.status === 401) {
                alert("Authentication failed. Please login and try again.");
            } else {
                const provider = activeTab === 's3' ? 'S3' : 'Dropbox';
                alert(`${provider} connection failed. Please check your configuration.`);
            }
            return false;
        }
    };

    const testFileDownload = async () => {
        const files = Object.keys(getCurrentFiles());
        if (files.length === 0) {
            const provider = activeTab === 's3' ? 'S3' : 'Dropbox';
            alert(`No files available in ${provider} to test download.`);
            return;
        }

        const testFileName = files[0];
        console.log("Testing download of file:", testFileName);

        try {
            const fileData = activeTab === 's3'
                ? await getFileFromS3(testFileName)
                : await getFileFromDropbox(testFileName);

            if (fileData && fileData.content) {
                alert(`Successfully downloaded "${testFileName}" (${fileData.content.length} characters)`);
            } else {
                alert(`Failed to download "${testFileName}" - no content received`);
            }
        } catch (err) {
            alert(`Failed to download "${testFileName}": ${err.message}`);
        }
    };

    const loadFilesFromS3 = async () => {
        setLoading(true);
        try {
            const response = await ApiService.listAllS3();
            setS3Files(response.s3Files);
        } catch (err) {
            console.error("Failed to load files from S3", err);
            alert("Failed to load files from S3. Please check your authentication and try again.");
        } finally {
            setLoading(false);
        }
    };

    const getFileFromS3 = async (key) => {
        try {
            console.log("Getting file from S3 via API:", key);
            const response = await ApiService.getFileS3(key);
            console.log("S3 API response:", response);
            console.log("Response type:", typeof response);
            console.log("Response keys:", Object.keys(response));

            if (!response) {
                console.error("No response received from S3 API");
                throw new Error("No response received from S3 API");
            }

            let content = null;
            if (response.content !== undefined) {
                content = response.content;
            } else if (response.data && response.data.content !== undefined) {
                content = response.data.content;
            } else if (typeof response === 'string') {
                content = response;
            } else {
                console.error("Unexpected response format:", response);
                throw new Error("Unexpected response format from S3 API");
            }

            if (content === null || content === undefined) {
                console.error("No content found in response");
                throw new Error("No file content received from S3");
            }

            console.log("Successfully extracted content, length:", content.length);
            console.log("Content preview (first 100 chars):", content.substring(0, 100));

            return {
                content: content,
                modified: s3Files[key] || Date.now(),
                created: s3Files[key] || Date.now()
            };
        } catch (err) {
            console.error("Failed to get file from S3", err);
            console.error("Error details:", {
                message: err.message,
                status: err.response?.status,
                data: err.response?.data
            });

            if (err.response?.status === 401) {
                alert("Authentication failed. Please login and try again.");
            } else if (err.response?.status === 404) {
                alert("File not found in S3.");
            } else {
                alert("Failed to load file from S3. Please check the console for details.");
            }
            return null;
        }
    };

    const saveFileToS3 = async (fileName, content) => {
        console.log("fileName", fileName);
        console.log("content", content);
        try {
            const response = await ApiService.uploadFileS3(fileName, content);
            console.log("response", response);
            await loadFiles();
            return true;
        } catch (err) {
            console.error("Failed to save file to S3", err);
            if (err.response?.status === 401) {
                alert("Authentication failed. Please login and try again.");
            } else {
                alert("Failed to save file to S3. Please try again.");
            }
            return false;
        }
    };

    const deleteFileFromS3 = async (key) => {
        try {
            await ApiService.deleteFileS3(key);
            await loadFiles();
            return true;
        } catch (err) {
            console.error("Failed to delete file from S3", err);
            if (err.response?.status === 401) {
                alert("Authentication failed. Please login and try again.");
            } else if (err.response?.status === 404) {
                alert("File not found in S3.");
            } else {
                alert("Failed to delete file from S3. Please try again.");
            }
            return false;
        }
    };

    const loadFilesFromDropbox = async () => {
        setLoading(true);
        try {
            const response = await ApiService.listAllDropbox();
            console.log("response", response);
            setDropboxFiles(response.dropboxFiles);
        } catch (err) {
            console.error("Failed to load files from Dropbox", err);
            if (err.response?.status === 401) {
                alert("Authentication failed. Please login and try again.");
            } else {
                alert("Failed to load files from Dropbox. Please check your authentication and try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const getFileFromDropbox = async (fileName) => {
        try {
            console.log("Getting file from Dropbox via API:", fileName);
            const response = await ApiService.getFileDropbox(fileName);
            console.log("Dropbox API response:", response);
            console.log("Response type:", typeof response);
            console.log("Response keys:", Object.keys(response));

            if (!response) {
                console.error("No response received from Dropbox API");
                throw new Error("No response received from Dropbox API");
            }

            let content = null;
            if (response.content !== undefined) {
                content = response.content;
            } else if (response.data && response.data.content !== undefined) {
                content = response.data.content;
            } else if (typeof response === 'string') {
                content = response;
            } else {
                console.error("Unexpected response format:", response);
                throw new Error("Unexpected response format from Dropbox API");
            }

            if (content === null || content === undefined) {
                console.error("No content found in response");
                throw new Error("No file content received from Dropbox");
            }

            console.log("Successfully extracted content, length:", content.length);
            console.log("Content preview (first 100 chars):", content.substring(0, 100));

            return {
                content: content,
                modified: dropboxFiles[fileName] || Date.now(),
                created: dropboxFiles[fileName] || Date.now()
            };
        } catch (err) {
            console.error("Failed to get file from Dropbox", err);
            console.error("Error details:", {
                message: err.message,
                status: err.response?.status,
                data: err.response?.data
            });

            if (err.response?.status === 401) {
                alert("Authentication failed. Please login and try again.");
            } else if (err.response?.status === 404) {
                alert("File not found in Dropbox. The file may have been moved or deleted.");
            } else if (err.response?.status === 403) {
                alert("Permission denied. Your app may not have read access to this file.");
            } else {
                alert("Failed to load file from Dropbox. Please check the console for details.");
            }
            return null;
        }
    };

    const saveFileToDropbox = async (fileName, content) => {
        console.log("fileName", fileName);
        console.log("content", content);

        try {
            await ApiService.uploadFileDropbox(fileName, content);
            await loadFiles();
            return true;
        } catch (err) {
            console.error("Failed to save file to Dropbox", err);

            if (err.response?.status === 401) {
                alert("Authentication failed. Please login and try again.");
            } else if (err.response?.status === 403) {
                alert("Permission denied. Your app may not have sufficient permissions.");
            } else if (err.response?.status === 400) {
                alert("Bad request. Please check the file name and content.");
            } else {
                alert("Failed to save file to Dropbox. Please try again.");
            }
            return false;
        }
    };

    const deleteFileFromDropbox = async (fileName) => {
        try {
            await ApiService.deleteFileDropbox(fileName);
            await loadFiles();
            return true;
        } catch (err) {
            console.error("Failed to delete file from Dropbox", err);
            if (err.response?.status === 401) {
                alert("Authentication failed. Please login and try again.");
            } else if (err.response?.status === 404) {
                alert("File not found in Dropbox.");
            } else {
                alert("Failed to delete file from Dropbox. Please try again.");
            }
            return false;
        }
    };

    const uploadCurrentInvoice = async () => {
        const fileName = prompt("Enter filename for the current invoice (without extension):");

        if (!fileName) {
            return;
        }

        if (fileName.trim() === '') {
            alert("Please enter a valid filename");
            return;
        }

        setLoading(true);

        try {
            const currentData = AppGeneral.getSpreadsheetContent();
            const fullFileName = `${fileName.trim()}.txt`;

            const success = activeTab === 's3'
                ? await saveFileToS3(fullFileName, currentData)
                : await saveFileToDropbox(fullFileName, currentData);

            if (success) {
                const provider = activeTab === 's3' ? 'S3' : 'Dropbox';
                alert(`Current invoice saved successfully to ${provider} as "${fullFileName}"`);
            } else {
                alert("Failed to save current invoice to cloud storage");
            }
        } catch (err) {
            console.error("Failed to get current invoice data", err);
            alert("Failed to get current invoice data");
        }

        setLoading(false);
    };

    const editFile = async (key) => {
        setLoading(true);

        try {
            console.log("Editing file:", key, "from provider:", activeTab);

            const fileData = activeTab === 's3'
                ? await getFileFromS3(key)
                : await getFileFromDropbox(key);

            if (fileData && fileData.content) {
                console.log("File loaded successfully, content length:", fileData.content.length);
                AppGeneral.viewFile(key, fileData.content);
                updateSelectedFile(key);
            } else {
                const provider = activeTab === 's3' ? 'S3' : 'Dropbox';
                alert(`Failed to load file from ${provider}. The file may be empty or corrupted.`);
            }
        } catch (err) {
            console.error("Error loading file:", err);
            const provider = activeTab === 's3' ? 'S3' : 'Dropbox';
            alert(`Failed to load file from ${provider}. Please check the console for details.`);
        } finally {
            setLoading(false);
        }
    };

    const deleteFile = async (key, event) => {
        event.preventDefault();
        const provider = activeTab === 's3' ? 'S3' : 'Dropbox';
        const result = window.confirm(`Do you want to delete the ${key} file from ${provider}?`);

        if (result) {
            setLoading(true);
            const success = activeTab === 's3'
                ? await deleteFileFromS3(key)
                : await deleteFileFromDropbox(key);

            if (success) {
                loadDefault();
                alert(`File deleted successfully from ${provider}`);
            } else {
                alert(`Failed to delete file from ${provider}`);
            }

            setLoading(false);
        }
    };

    const handleUploadFile = async () => {
        if (!uploadFile) return alert("Select a file first");

        setLoading(true);

        try {
            const content = await uploadFile.text();
            const success = activeTab === 's3'
                ? await saveFileToS3(uploadFile.name, content)
                : await saveFileToDropbox(uploadFile.name, content);

            if (success) {
                const provider = activeTab === 's3' ? 'S3' : 'Dropbox';
                alert(`File uploaded successfully to ${provider}`);
                setUploadFile(null);
            } else {
                alert("Failed to upload file to cloud storage");
            }
        } catch (err) {
            console.error("Failed to read file", err);
            alert("Failed to read file");
        }

        setLoading(false);
    };

    const loadDefault = () => {
        const msc = DATA['home'][AppGeneral.getDeviceType()]['msc'];
        AppGeneral.viewFile('default', JSON.stringify(msc));
        updateSelectedFile('default');
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    const handleExportChange = (event) => {
        const format = event.target.value;
        setExportFormat('');

        if (format === 'this') {
            uploadCurrentInvoice();
        }
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    // File selection management
    const toggleCloudFileSelection = (key) => {
        setSelectedCloudFiles(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const getSelectedCloudFiles = () => {
        return Object.keys(selectedCloudFiles).filter(key => selectedCloudFiles[key]);
    };

    const hasSelectedCloudFiles = () => {
        return getSelectedCloudFiles().length > 0;
    };

    // Conflict detection
    const isFileExistsLocally = (filename) => {
        const localFiles = localStoreRef.current._getAllFiles();
        return Object.keys(localFiles).includes(filename);
    };

    const files = getCurrentFiles();
    const filteredFiles = Object.keys(files).filter(key =>
        key.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Transfer functions
    const moveToLocal = async () => {
        const selectedFiles = getSelectedCloudFiles();
        if (selectedFiles.length === 0) {
            alert('No files selected for download');
            return;
        }

        // Check for conflicts
        const conflicts = selectedFiles.filter(filename => isFileExistsLocally(filename));
        if (conflicts.length > 0) {
            setConflictFiles(conflicts);
            setAlertMessage(`${conflicts.length} file(s) already exist locally. Overwrite existing files?`);
            setShowTransferAlert(true);
            return;
        }

        await executeLocalDownload(selectedFiles);
    };

    const executeLocalDownload = async (fileNames) => {
        setLoading(true);
        try {
            let successCount = 0;
            let errorCount = 0;

            for (const fileName of fileNames) {
                try {
                    const success = await downloadAndSaveFile(fileName);
                    if (success) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    console.error(`Error downloading ${fileName}:`, error);
                    errorCount++;
                }
            }

            // Clear selections
            setSelectedCloudFiles({});
            
            if (successCount > 0) {
                alert(`Successfully downloaded ${successCount} file(s) to local storage${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
            } else {
                alert('Failed to download any files');
            }

        } catch (error) {
            console.error('Batch download error:', error);
            alert('Error during batch download');
        } finally {
            setLoading(false);
        }
    };


    const downloadAndSaveFile = async (filename) => {
        try {
            const fileData = activeTab === 's3'
                ? await getFileFromS3(filename)
                : await getFileFromDropbox(filename);

            if (!fileData || !fileData.content) {
                return false;
            }

            // Create a new File object using the File class
            const newFile = new File(
                fileData.created || new Date().toString(),
                fileData.modified || new Date().toString(),
                encodeURIComponent(fileData.content),
                filename,
                1 // password/billType parameter
            );

            // Save to local storage using the Local class _saveFile method
            localStoreRef.current._saveFile(newFile);
            return true;
        } catch (error) {
            console.error(`Error downloading file ${filename}:`, error);
            return false;
        }
    };

    const fileList = filteredFiles.map(key => {
        return (
            <div key={key} className="file-item">
                <div className="file-info">
                    <input
                        type="checkbox"
                        checked={selectedCloudFiles[key] || false}
                        onChange={() => toggleCloudFileSelection(key)}
                        className="file-checkbox"
                    />
                    <div className="file-details">
                        <span className="file-name">{key}</span>
                        <span className="file-date">{formatDate(files[key])}</span>
                    </div>
                </div>
                <div className="file-actions">
                    <button
                        onClick={() => editFile(key)}
                        disabled={loading}
                        className="edit-btn"
                    >
                        {loading ? 'Loading...' : 'Edit'}
                    </button>
                    <button
                        onClick={(event) => deleteFile(key, event)}
                        disabled={loading}
                        className="delete-btn"
                    >
                        {loading ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        );
    });


    return (
        <div className="file">
            <div className="tab-navigation">
                <button
                    className={`tab-button ${activeTab === 's3' ? 'active' : ''}`}
                    onClick={() => switchTab('s3')}
                    disabled={loading}
                >
                    🗄️ S3
                </button>
                <button
                    className={`tab-button ${activeTab === 'dropbox' ? 'active' : ''}`}
                    onClick={() => switchTab('dropbox')}
                    disabled={loading}
                >
                    📦 Dropbox
                </button>
                <button
                    className="test-connection-btn"
                    onClick={testConnection}
                    disabled={loading}
                    title={`Test ${activeTab === 's3' ? 'S3' : 'Dropbox'} Connection`}
                >
                    🔧 Test Connection
                </button>
                <button
                    className="test-download-btn"
                    onClick={testFileDownload}
                    disabled={loading}
                    title="Test File Download"
                >
                    📥 Test Download
                </button>
            </div>

            <div className="search-container">
                <select
                    value={exportFormat}
                    onChange={handleExportChange}
                    className="export-select"
                    disabled={loading}
                >
                    <option value="">📤 Upload...</option>
                    <option value="this">💾 Upload Current Invoice</option>
                </select>

                <input
                    type="text"
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="search-input"
                />
                {searchTerm && (
                    <button
                        onClick={clearSearch}
                        className="clear-search-btn"
                        title="Clear search"
                    >
                        ×
                    </button>
                )}
            </div>

            {/* Transfer buttons for selected cloud files */}
            {hasSelectedCloudFiles() && (
                <div className="transfer-controls">
                    <button
                        onClick={moveToLocal}
                        disabled={loading}
                        className="transfer-btn download-btn"
                    >
                        📥 Store to Local ({getSelectedCloudFiles().length})
                    </button>
                </div>
            )}

            <div className="search-results">
                {loading && <div className="loading">Loading files from {activeTab === 's3' ? 'S3' : 'Dropbox'}...</div>}
                {!loading && filteredFiles.length === 0 && searchTerm ? (
                    <div className="no-results">No files found matching "{searchTerm}"</div>
                ) : (
                    <ul>
                        {fileList}
                    </ul>
                )}
                {!loading && Object.keys(files).length === 0 && !searchTerm && (
                    <div className="no-files">No files found in {activeTab === 's3' ? 'S3' : 'Dropbox'}</div>
                )}
            </div>

            {/* Conflict Resolution Alert */}
            {showTransferAlert && (
                <div className="alert-overlay">
                    <div className="alert-dialog">
                        <h4>File Conflicts</h4>
                        <p>{alertMessage}</p>
                        <div className="alert-buttons">
                            <button
                                onClick={() => {
                                    setShowTransferAlert(false);
                                    setConflictFiles([]);
                                }}
                                className="cancel-btn"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    const selectedFiles = getSelectedCloudFiles();
                                    const nonConflictFiles = selectedFiles.filter(filename => !conflictFiles.includes(filename));
                                    if (nonConflictFiles.length > 0) {
                                        executeLocalDownload(nonConflictFiles);
                                    }
                                    setShowTransferAlert(false);
                                    setConflictFiles([]);
                                }}
                                className="skip-btn"
                            >
                                Skip Conflicts
                            </button>
                            <button
                                onClick={() => {
                                    executeLocalDownload(getSelectedCloudFiles());
                                    setShowTransferAlert(false);
                                    setConflictFiles([]);
                                }}
                                className="overwrite-btn"
                            >
                                Overwrite All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cloud;