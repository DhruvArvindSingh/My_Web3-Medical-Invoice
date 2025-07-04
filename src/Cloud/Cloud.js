import React, { Component, useState, useEffect } from "react";
import './Cloud.css';
import {
    S3Client,
    PutObjectCommand,
    ListObjectsV2Command,
    GetObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Dropbox } from 'dropbox';
import * as AppGeneral from '../socialcalc/AppGeneral';
import { Local } from '../storage/LocalStorage.js';
import { DATA } from '../app-data.js';

// ⚠️ NEVER put real secrets in frontend for production!
// Use React's built-in environment variables (must start with REACT_APP_)
const REGION = process.env.REACT_APP_REGION;
const BUCKET = process.env.REACT_APP_BUCKET;
const ACCESS_KEY = process.env.REACT_APP_ACCESS_KEY;
const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;
const DROPBOX_ACCESS_TOKEN = process.env.REACT_APP_DROPBOX_ACCESS_TOKEN;

const s3 = new S3Client({
    region: REGION,
    credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
    },
});

const dropbox = new Dropbox({
    accessToken: DROPBOX_ACCESS_TOKEN,
    fetch: fetch
});

class Cloud extends Component {
    constructor(props) {
        super(props);
        this.localStore = new Local();
        this.state = {
            activeTab: 's3', // 's3' or 'dropbox'
            s3Files: {},
            dropboxFiles: {},
            searchTerm: '',
            loading: false,
            uploadFile: null,
            exportFormat: ''
        }
    }

    componentDidMount() {
        this.loadFiles();
    }

    // Load files based on active tab
    loadFiles = async () => {
        if (this.state.activeTab === 's3') {
            await this.loadFilesFromS3();
        } else {
            await this.loadFilesFromDropbox();
        }
    };

    // Switch tab handler
    switchTab = async (tab) => {
        this.setState({ activeTab: tab });

        // Load files for the new tab if not already loaded
        if (tab === 's3' && Object.keys(this.state.s3Files).length === 0) {
            await this.loadFilesFromS3();
        } else if (tab === 'dropbox' && Object.keys(this.state.dropboxFiles).length === 0) {
            await this.loadFilesFromDropbox();
        }

        // Debug info for Dropbox
        if (tab === 'dropbox') {
            console.log("Dropbox access token configured:", !!DROPBOX_ACCESS_TOKEN);
            if (DROPBOX_ACCESS_TOKEN) {
                console.log("Dropbox access token length:", DROPBOX_ACCESS_TOKEN.length);
            }
        }
    };

    // Get current files based on active tab
    getCurrentFiles = () => {
        return this.state.activeTab === 's3' ? this.state.s3Files : this.state.dropboxFiles;
    };

    // Test Dropbox connection
    testDropboxConnection = async () => {
        if (!DROPBOX_ACCESS_TOKEN) {
            alert("Dropbox access token not configured");
            return false;
        }

        // Validate token format
        if (!this.validateDropboxToken(DROPBOX_ACCESS_TOKEN)) {
            alert("Dropbox access token format appears invalid. Please check your token.");
            return false;
        }

        try {
            const response = await dropbox.usersGetCurrentAccount();
            console.log("Dropbox connection successful:", response.result);
            alert(`Connected to Dropbox as: ${response.result.name.display_name}`);
            return true;
        } catch (err) {
            console.error("Dropbox connection failed:", err);
            console.error("Error details:", err.error);

            if (err.status === 401) {
                alert("Dropbox authentication failed (401). Your access token may be invalid or expired. Please check your token and app permissions.");
            } else if (err.status === 403) {
                alert("Dropbox permission denied (403). Your app may not have sufficient permissions.");
            } else {
                alert(`Dropbox connection failed with status ${err.status}. Please check your access token.`);
            }
            return false;
        }
    };

    // Validate Dropbox token format
    validateDropboxToken = (token) => {
        // Dropbox tokens are typically 64 characters long and contain alphanumeric characters
        if (!token || typeof token !== 'string') {
            return false;
        }

        // Check if token looks like a valid Dropbox token (basic validation)
        const tokenRegex = /^[A-Za-z0-9_-]{60,}$/;
        return tokenRegex.test(token);
    };

    // Debug Dropbox configuration
    debugDropboxConfig = () => {
        console.log("=== Dropbox Configuration Debug ===");
        console.log("Access token configured:", !!DROPBOX_ACCESS_TOKEN);
        console.log("Access token length:", DROPBOX_ACCESS_TOKEN ? DROPBOX_ACCESS_TOKEN.length : 0);
        console.log("Token format valid:", this.validateDropboxToken(DROPBOX_ACCESS_TOKEN));
        console.log("Token preview:", DROPBOX_ACCESS_TOKEN ? `${DROPBOX_ACCESS_TOKEN.substring(0, 10)}...` : "Not set");
        console.log("Dropbox client initialized:", !!dropbox);
        console.log("Available files:", Object.keys(this.state.dropboxFiles));
        console.log("================================");
    };

    // Test file download from Dropbox
    testDropboxFileDownload = async () => {
        const files = Object.keys(this.state.dropboxFiles);
        if (files.length === 0) {
            alert("No files available in Dropbox to test download.");
            return;
        }

        const testFileName = files[0];
        console.log("Testing download of file:", testFileName);

        try {
            const fileData = await this.getFileFromDropbox(testFileName);
            if (fileData && fileData.content) {
                alert(`Successfully downloaded "${testFileName}" (${fileData.content.length} characters)`);
            } else {
                alert(`Failed to download "${testFileName}" - no content received`);
            }
        } catch (err) {
            alert(`Failed to download "${testFileName}": ${err.message}`);
        }
    };

    // Test raw Dropbox API response
    testRawDropboxResponse = async () => {
        const files = Object.keys(this.state.dropboxFiles);
        if (files.length === 0) {
            alert("No files available in Dropbox to test.");
            return;
        }

        const testFileName = files[0];
        console.log("=== RAW DROPBOX API TEST ===");
        console.log("Testing raw API call for file:", testFileName);

        try {
            // Test the raw API call
            const response = await dropbox.filesDownload({ path: `/${testFileName}` });
            console.log("Raw API response:", response);
            console.log("Response type:", typeof response);
            console.log("Response keys:", Object.keys(response));
            console.log("Result type:", typeof response.result);
            console.log("Result keys:", Object.keys(response.result));

            if (response.result.fileBinary) {
                console.log("fileBinary exists");
                console.log("fileBinary type:", typeof response.result.fileBinary);
                console.log("fileBinary constructor:", response.result.fileBinary.constructor.name);
                console.log("fileBinary size:", response.result.fileBinary.size || response.result.fileBinary.byteLength || 'unknown');
            } else if (response.result.fileBlob) {
                console.log("fileBlob exists");
                console.log("fileBlob type:", typeof response.result.fileBlob);
                console.log("fileBlob constructor:", response.result.fileBlob.constructor.name);
                console.log("fileBlob size:", response.result.fileBlob.size || 'unknown');
            } else {
                console.log("Neither fileBinary nor fileBlob exists");
                console.log("Available properties:", Object.keys(response.result));
            }

            console.log("=== END RAW DROPBOX API TEST ===");
            alert("Raw API test completed. Check console for details.");
        } catch (err) {
            console.error("Raw API test failed:", err);
            alert(`Raw API test failed: ${err.message}`);
        }
    };

    // Load all files from S3 bucket
    loadFilesFromS3 = async () => {
        this.setState({ loading: true });
        try {
            const data = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET }));
            const contents = data.Contents || [];

            // Convert S3 objects to the expected format
            const filesObj = {};
            contents.forEach(file => {
                if (file.Key && file.LastModified) {
                    filesObj[file.Key] = file.LastModified.getTime();
                }
            });

            this.setState({ s3Files: filesObj, loading: false });
        } catch (err) {
            console.error("Failed to load files from S3", err);
            this.setState({ loading: false });
        }
    };

    // Get file content from S3
    getFileFromS3 = async (key) => {
        try {
            const command = new GetObjectCommand({
                Bucket: BUCKET,
                Key: key,
            });

            const response = await s3.send(command);
            const content = await response.Body.transformToString();

            return {
                content: content,
                modified: this.state.s3Files[key] || Date.now(),
                created: this.state.s3Files[key] || Date.now()
            };
        } catch (err) {
            console.error("Failed to get file from S3", err);
            return null;
        }
    };

    // Save file to S3
    saveFileToS3 = async (fileName, content) => {
        console.log("fileName", fileName);
        console.log("content", content);
        try {
            const params = {
                Bucket: BUCKET,
                Key: fileName,
                Body: content,
                ContentType: 'text/plain'
            };

            await s3.send(new PutObjectCommand(params));

            // Refresh file list after successful upload
            await this.loadFiles();
            return true;
        } catch (err) {
            console.error("Failed to save file to S3", err);
            return false;
        }
    };

    // Delete file from S3
    deleteFileFromS3 = async (key) => {
        try {
            await s3.send(new DeleteObjectCommand({
                Bucket: BUCKET,
                Key: key
            }));

            // Refresh file list after successful deletion
            await this.loadFiles();
            return true;
        } catch (err) {
            console.error("Failed to delete file from S3", err);
            return false;
        }
    };

    // Load all files from Dropbox
    loadFilesFromDropbox = async () => {
        this.setState({ loading: true });
        try {
            // Check if access token is configured
            if (!DROPBOX_ACCESS_TOKEN) {
                console.error("Dropbox access token not configured");
                alert("Dropbox access token not configured. Please set REACT_APP_DROPBOX_ACCESS_TOKEN in your environment variables.");
                this.setState({ loading: false });
                return;
            }

            const response = await dropbox.filesListFolder({ path: '' });
            const files = response.result.entries || [];

            // Convert Dropbox files to the expected format
            const filesObj = {};
            files.forEach(file => {
                if (file['.tag'] === 'file') {
                    filesObj[file.name] = new Date(file.client_modified).getTime();
                }
            });

            this.setState({ dropboxFiles: filesObj, loading: false });
        } catch (err) {
            console.error("Failed to load files from Dropbox", err);
            console.error("Error details:", err.error);
            this.setState({ loading: false });
        }
    };

    // Get file content from Dropbox
    getFileFromDropbox = async (fileName) => {
        try {
            console.log("=== DROPBOX DOWNLOAD DEBUG ===");
            console.log("Attempting to download file:", fileName);

            const response = await dropbox.filesDownload({ path: `/${fileName}` });
            console.log("Full Dropbox response:", response);
            console.log("Response result:", response.result);
            console.log("Response result keys:", Object.keys(response.result));

            // Check if fileBinary or fileBlob exists
            let fileBinary = response.result.fileBinary || response.result.fileBlob;
            if (!fileBinary) {
                console.error("No fileBinary or fileBlob in response");
                console.log("Available properties:", Object.keys(response.result));
                throw new Error("No file content received from Dropbox");
            }

            console.log("Using file content from:", response.result.fileBinary ? "fileBinary" : "fileBlob");
            console.log("File binary type:", typeof fileBinary);
            console.log("File binary constructor:", fileBinary.constructor.name);
            console.log("File binary properties:", Object.getOwnPropertyNames(fileBinary));

            let content;

            if (fileBinary instanceof ArrayBuffer) {
                console.log("Processing as ArrayBuffer");
                const decoder = new TextDecoder();
                content = decoder.decode(fileBinary);
            } else if (fileBinary instanceof Blob) {
                console.log("Processing as Blob");
                content = await fileBinary.text();
            } else if (typeof fileBinary === 'string') {
                console.log("Processing as string");
                content = fileBinary;
            } else if (fileBinary && typeof fileBinary.arrayBuffer === 'function') {
                console.log("Processing as File-like object with arrayBuffer method");
                const arrayBuffer = await fileBinary.arrayBuffer();
                const decoder = new TextDecoder();
                content = decoder.decode(arrayBuffer);
            } else if (fileBinary && fileBinary.buffer) {
                console.log("Processing as object with buffer property");
                const decoder = new TextDecoder();
                content = decoder.decode(fileBinary.buffer);
            } else {
                console.error("Unexpected file binary format:", fileBinary);
                console.error("File binary toString():", fileBinary.toString());
                console.error("File binary JSON:", JSON.stringify(fileBinary, null, 2));
                throw new Error("Unexpected file format received from Dropbox");
            }

            console.log("Successfully extracted content");
            console.log("Content length:", content.length);
            console.log("Content preview (first 200 chars):", content.substring(0, 200));
            console.log("Content preview (last 200 chars):", content.substring(content.length - 200));
            console.log("=== END DROPBOX DOWNLOAD DEBUG ===");

            return {
                content: content,
                modified: this.state.dropboxFiles[fileName] || Date.now(),
                created: this.state.dropboxFiles[fileName] || Date.now()
            };
        } catch (err) {
            console.error("=== DROPBOX DOWNLOAD ERROR ===");
            console.error("Failed to get file from Dropbox", err);
            console.error("Error name:", err.name);
            console.error("Error message:", err.message);
            console.error("Error stack:", err.stack);

            if (err.error) {
                console.error("Error details:", err.error);
            }
            if (err.status) {
                console.error("Error status:", err.status);
            }
            if (err.response) {
                console.error("Error response:", err.response);
            }

            console.error("=== END DROPBOX DOWNLOAD ERROR ===");

            if (err.status === 401) {
                alert("Dropbox authentication failed (401). Please check your access token.");
            } else if (err.status === 404) {
                alert("File not found in Dropbox. The file may have been moved or deleted.");
            } else if (err.status === 403) {
                alert("Permission denied. Your app may not have read access to this file.");
            } else {
                alert(`Failed to load file from Dropbox (Status: ${err.status || 'Unknown'}). Please check the console for details.`);
            }
            return null;
        }
    };

    // Save file to Dropbox
    saveFileToDropbox = async (fileName, content) => {
        console.log("fileName", fileName);
        console.log("content", content);

        // Check if access token is configured
        if (!DROPBOX_ACCESS_TOKEN) {
            console.error("Dropbox access token not configured");
            alert("Dropbox access token not configured. Please set REACT_APP_DROPBOX_ACCESS_TOKEN in your environment variables.");
            return false;
        }

        try {
            // Convert string content to ArrayBuffer for Dropbox API
            const encoder = new TextEncoder();
            const contentBuffer = encoder.encode(content);

            await dropbox.filesUpload({
                path: `/${fileName}`,
                contents: contentBuffer,
                mode: { '.tag': 'overwrite' },
                autorename: true
            });

            // Refresh file list after successful upload
            await this.loadFiles();
            return true;
        } catch (err) {
            console.error("Failed to save file to Dropbox", err);
            console.error("Error details:", err.error);

            if (err.status === 401) {
                alert("Dropbox authentication failed (401). Your access token may be invalid or expired. Please check your token and app permissions.");
            } else if (err.status === 403) {
                alert("Dropbox permission denied (403). Your app may not have sufficient permissions.");
            } else if (err.status === 400) {
                alert("Dropbox request failed (400). Please check the file name and content.");
            } else {
                alert(`Dropbox upload failed with status ${err.status}. Please check your configuration.`);
            }
            return false;
        }
    };

    // Delete file from Dropbox
    deleteFileFromDropbox = async (fileName) => {
        try {
            await dropbox.filesDeleteV2({ path: `/${fileName}` });

            // Refresh file list after successful deletion
            await this.loadFiles();
            return true;
        } catch (err) {
            console.error("Failed to delete file from Dropbox", err);
            return false;
        }
    };

    // Upload current invoice data to active cloud provider
    uploadCurrentInvoice = async () => {
        const fileName = prompt("Enter filename for the current invoice (without extension):");

        if (!fileName) {
            return; // User cancelled
        }

        if (fileName.trim() === '') {
            alert("Please enter a valid filename");
            return;
        }

        this.setState({ loading: true });

        try {
            // Get current spreadsheet content
            const currentData = AppGeneral.getSpreadsheetContent();

            // Create filename with .txt extension
            const fullFileName = `${fileName.trim()}.txt`;

            // Save to active cloud provider
            const success = this.state.activeTab === 's3'
                ? await this.saveFileToS3(fullFileName, currentData)
                : await this.saveFileToDropbox(fullFileName, currentData);

            if (success) {
                const provider = this.state.activeTab === 's3' ? 'S3' : 'Dropbox';
                alert(`Current invoice saved successfully to ${provider} as "${fullFileName}"`);
            } else {
                alert("Failed to save current invoice to cloud storage");
            }
        } catch (err) {
            console.error("Failed to get current invoice data", err);
            alert("Failed to get current invoice data");
        }

        this.setState({ loading: false });
    };

    // Edit file - loads from active cloud provider
    editFile = async (key) => {
        this.setState({ loading: true });

        try {
            console.log("Editing file:", key, "from provider:", this.state.activeTab);

            const fileData = this.state.activeTab === 's3'
                ? await this.getFileFromS3(key)
                : await this.getFileFromDropbox(key);

            if (fileData && fileData.content) {
                console.log("File loaded successfully, content length:", fileData.content.length);
                AppGeneral.viewFile(key, fileData.content);
                this.props.updateSelectedFile(key);
            } else {
                const provider = this.state.activeTab === 's3' ? 'S3' : 'Dropbox';
                alert(`Failed to load file from ${provider}. The file may be empty or corrupted.`);
            }
        } catch (err) {
            console.error("Error loading file:", err);
            const provider = this.state.activeTab === 's3' ? 'S3' : 'Dropbox';
            alert(`Failed to load file from ${provider}. Please check the console for details.`);
        }

        this.setState({ loading: false });
    };

    // Delete file - deletes from active cloud provider
    deleteFile = async (key) => {
        event.preventDefault();
        const provider = this.state.activeTab === 's3' ? 'S3' : 'Dropbox';
        const result = window.confirm(`Do you want to delete the ${key} file from ${provider}?`);

        if (result) {
            this.setState({ loading: true });
            const success = this.state.activeTab === 's3'
                ? await this.deleteFileFromS3(key)
                : await this.deleteFileFromDropbox(key);

            if (success) {
                this.loadDefault();
                alert(`File deleted successfully from ${provider}`);
            } else {
                alert(`Failed to delete file from ${provider}`);
            }

            this.setState({ loading: false });
        }
    };

    // Upload new file to active cloud provider
    uploadFile = async () => {
        const { uploadFile } = this.state;
        if (!uploadFile) return alert("Select a file first");

        this.setState({ loading: true });

        try {
            const content = await uploadFile.text();
            const success = this.state.activeTab === 's3'
                ? await this.saveFileToS3(uploadFile.name, content)
                : await this.saveFileToDropbox(uploadFile.name, content);

            if (success) {
                const provider = this.state.activeTab === 's3' ? 'S3' : 'Dropbox';
                alert(`File uploaded successfully to ${provider}`);
                this.setState({ uploadFile: null });
            } else {
                alert("Failed to upload file to cloud storage");
            }
        } catch (err) {
            console.error("Failed to read file", err);
            alert("Failed to read file");
        }

        this.setState({ loading: false });
    };

    loadDefault() {
        const msc = DATA['home'][AppGeneral.getDeviceType()]['msc'];
        AppGeneral.viewFile('default', JSON.stringify(msc));
        this.props.updateSelectedFile('default');
    }

    handleSearchChange = (event) => {
        this.setState({ searchTerm: event.target.value });
    }

    clearSearch = () => {
        this.setState({ searchTerm: '' });
    }

    handleExportChange = (event) => {
        const format = event.target.value;
        this.setState({ exportFormat: '' }); // Reset the select

        if (format === 'this') {
            this.uploadCurrentInvoice();
        }
    }

    render() {
        const { activeTab, searchTerm, loading, uploadFile, exportFormat } = this.state;
        const files = this.getCurrentFiles();

        // Filter files based on search term
        const filteredFiles = Object.keys(files).filter(key =>
            key.toLowerCase().includes(searchTerm.toLowerCase())
        );

        let fileList = filteredFiles.map(key => {
            return (
                <div key={key}>
                    <li>{key} <span>{this._formatDate(files[key])}</span></li>
                    <button
                        onClick={() => { this.editFile(key) }}
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'Edit'}
                    </button>
                    <button
                        onClick={() => { this.deleteFile(key) }}
                        disabled={loading}
                    >
                        {loading ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            );
        });

        return (
            <div className="file">
                {/* Tab Navigation */}
                <div className="tab-navigation">
                    <button
                        className={`tab-button ${activeTab === 's3' ? 'active' : ''}`}
                        onClick={() => this.switchTab('s3')}
                        disabled={loading}
                    >
                        🗄️ S3
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'dropbox' ? 'active' : ''}`}
                        onClick={() => this.switchTab('dropbox')}
                        disabled={loading}
                    >
                        📦 Dropbox
                    </button>
                    {activeTab === 'dropbox' && (
                        <>
                            <button
                                className="test-dropbox-btn"
                                onClick={this.testDropboxConnection}
                                disabled={loading}
                                title="Test Dropbox Connection"
                            >
                                🔧 Test
                            </button>
                            <button
                                className="debug-dropbox-btn"
                                onClick={this.debugDropboxConfig}
                                title="Debug Dropbox Configuration"
                            >
                                🐛 Debug
                            </button>
                            <button
                                className="test-download-btn"
                                onClick={this.testDropboxFileDownload}
                                disabled={loading}
                                title="Test File Download"
                            >
                                📥 Test Download
                            </button>
                            <button
                                className="raw-api-btn"
                                onClick={this.testRawDropboxResponse}
                                disabled={loading}
                                title="Test Raw API Response"
                            >
                                🔍 Raw API
                            </button>
                        </>
                    )}
                </div>

                <div className="search-container">
                    <select
                        value={exportFormat}
                        onChange={this.handleExportChange}
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
                        onChange={this.handleSearchChange}
                        className="search-input"
                    />
                    {searchTerm && (
                        <button
                            onClick={this.clearSearch}
                            className="clear-search-btn"
                            title="Clear search"
                        >
                            ×
                        </button>
                    )}
                </div>

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
            </div>
        );
    }

    _formatDate(timestamp) {
        return new Date(timestamp).toLocaleString();
    }
}

export default Cloud;