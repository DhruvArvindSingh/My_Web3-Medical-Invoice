import React, { Component, useState, useEffect } from "react";
import './Cloud.css';
import * as AppGeneral from '../socialcalc/AppGeneral';
import { Local } from '../storage/LocalStorage.js';
import { DATA } from '../app-data.js';
import ApiService from '../services/ApiService';

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
    };

    // Get current files based on active tab
    getCurrentFiles = () => {
        return this.state.activeTab === 's3' ? this.state.s3Files : this.state.dropboxFiles;
    };

    // Test API connection
    testConnection = async () => {
        try {
            if (this.state.activeTab === 's3') {
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
                const provider = this.state.activeTab === 's3' ? 'S3' : 'Dropbox';
                alert(`${provider} connection failed. Please check your configuration.`);
            }
            return false;
        }
    };

    // Test file download
    testFileDownload = async () => {
        const files = Object.keys(this.getCurrentFiles());
        if (files.length === 0) {
            const provider = this.state.activeTab === 's3' ? 'S3' : 'Dropbox';
            alert(`No files available in ${provider} to test download.`);
            return;
        }

        const testFileName = files[0];
        console.log("Testing download of file:", testFileName);

        try {
            const fileData = this.state.activeTab === 's3'
                ? await this.getFileFromS3(testFileName)
                : await this.getFileFromDropbox(testFileName);

            if (fileData && fileData.content) {
                alert(`Successfully downloaded "${testFileName}" (${fileData.content.length} characters)`);
            } else {
                alert(`Failed to download "${testFileName}" - no content received`);
            }
        } catch (err) {
            alert(`Failed to download "${testFileName}": ${err.message}`);
        }
    };

    // Load all files from S3 bucket
    loadFilesFromS3 = async () => {
        this.setState({ loading: true });
        try {
            const response = await ApiService.listAllS3();



            this.setState({ s3Files: response.s3Files, loading: false });
        } catch (err) {
            console.error("Failed to load files from S3", err);
            alert("Failed to load files from S3. Please check your authentication and try again.");
            this.setState({ loading: false });
        }
    };

    // Get file content from S3
    getFileFromS3 = async (key) => {
        try {
            console.log("Getting file from S3 via API:", key);
            const response = await ApiService.getFileS3(key);
            console.log("S3 API response:", response);
            console.log("Response type:", typeof response);
            console.log("Response keys:", Object.keys(response));

            // Check if we have content in the response
            if (!response) {
                console.error("No response received from S3 API");
                throw new Error("No response received from S3 API");
            }

            // Handle different possible response formats
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
                modified: this.state.s3Files[key] || Date.now(),
                created: this.state.s3Files[key] || Date.now()
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

    // Save file to S3
    saveFileToS3 = async (fileName, content) => {
        console.log("fileName", fileName);
        console.log("content", content);
        try {
            const response = await ApiService.uploadFileS3(fileName, content);
            console.log("response", response);

            // Refresh file list after successful upload
            await this.loadFiles();
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

    // Delete file from S3
    deleteFileFromS3 = async (key) => {
        try {
            await ApiService.deleteFileS3(key);

            // Refresh file list after successful deletion
            await this.loadFiles();
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

    // Load all files from Dropbox
    loadFilesFromDropbox = async () => {
        this.setState({ loading: true });
        try {
            const response = await ApiService.listAllDropbox();
            console.log("response", response);


            this.setState({ dropboxFiles: response.dropboxFiles, loading: false });
        } catch (err) {
            console.error("Failed to load files from Dropbox", err);
            if (err.response?.status === 401) {
                alert("Authentication failed. Please login and try again.");
            } else {
                alert("Failed to load files from Dropbox. Please check your authentication and try again.");
            }
            this.setState({ loading: false });
        }
    };

    // Get file content from Dropbox
    getFileFromDropbox = async (fileName) => {
        try {
            console.log("Getting file from Dropbox via API:", fileName);
            const response = await ApiService.getFileDropbox(fileName);
            console.log("Dropbox API response:", response);
            console.log("Response type:", typeof response);
            console.log("Response keys:", Object.keys(response));

            // Check if we have content in the response
            if (!response) {
                console.error("No response received from Dropbox API");
                throw new Error("No response received from Dropbox API");
            }

            // Handle different possible response formats
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
                modified: this.state.dropboxFiles[fileName] || Date.now(),
                created: this.state.dropboxFiles[fileName] || Date.now()
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

    // Save file to Dropbox
    saveFileToDropbox = async (fileName, content) => {
        console.log("fileName", fileName);
        console.log("content", content);

        try {
            await ApiService.uploadFileDropbox(fileName, content);

            // Refresh file list after successful upload
            await this.loadFiles();
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

    // Delete file from Dropbox
    deleteFileFromDropbox = async (fileName) => {
        try {
            await ApiService.deleteFileDropbox(fileName);

            // Refresh file list after successful deletion
            await this.loadFiles();
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
                    <button
                        className="test-connection-btn"
                        onClick={this.testConnection}
                        disabled={loading}
                        title={`Test ${activeTab === 's3' ? 'S3' : 'Dropbox'} Connection`}
                    >
                        🔧 Test Connection
                    </button>
                    <button
                        className="test-download-btn"
                        onClick={this.testFileDownload}
                        disabled={loading}
                        title="Test File Download"
                    >
                        📥 Test Download
                    </button>
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