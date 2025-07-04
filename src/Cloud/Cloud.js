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
import * as AppGeneral from '../socialcalc/AppGeneral';
import { Local } from '../storage/LocalStorage.js';
import { DATA } from '../app-data.js';

// ⚠️ NEVER put real secrets in frontend for production!
// Use React's built-in environment variables (must start with REACT_APP_)
const REGION = process.env.REACT_APP_REGION;
const BUCKET = process.env.REACT_APP_BUCKET;
const ACCESS_KEY = process.env.REACT_APP_ACCESS_KEY;
const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;

const s3 = new S3Client({
    region: REGION,
    credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
    },
});

class Cloud extends Component {
    constructor(props) {
        super(props);
        this.localStore = new Local();
        this.state = {
            files: {},
            searchTerm: '',
            loading: false,
            uploadFile: null,
            exportFormat: ''
        }
    }

    componentDidMount() {
        this.loadFilesFromS3();
    }

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

            this.setState({ files: filesObj, loading: false });
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
                modified: this.state.files[key] || Date.now(),
                created: this.state.files[key] || Date.now()
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
            await this.loadFilesFromS3();
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
            await this.loadFilesFromS3();
            return true;
        } catch (err) {
            console.error("Failed to delete file from S3", err);
            return false;
        }
    };

    // Upload current invoice data to S3
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

            // Save to S3
            const success = await this.saveFileToS3(fullFileName, currentData);

            if (success) {
                alert(`Current invoice saved successfully as "${fullFileName}"`);
            } else {
                alert("Failed to save current invoice to cloud storage");
            }
        } catch (err) {
            console.error("Failed to get current invoice data", err);
            alert("Failed to get current invoice data");
        }

        this.setState({ loading: false });
    };



    // Edit file - now loads from S3
    editFile = async (key) => {
        this.setState({ loading: true });

        try {
            const fileData = await this.getFileFromS3(key);

            if (fileData && fileData.content) {
                // Don't use decodeURIComponent as S3 content is already in plain text
                AppGeneral.viewFile(key, fileData.content);
                this.props.updateSelectedFile(key);
            } else {
                alert("Failed to load file from cloud storage");
            }
        } catch (err) {
            console.error("Error loading file:", err);
            alert("Failed to load file from cloud storage");
        }

        this.setState({ loading: false });
    };

    // Delete file - now deletes from S3
    deleteFile = async (key) => {
        event.preventDefault();
        const result = window.confirm(`Do you want to delete the ${key} file from cloud storage?`);

        if (result) {
            this.setState({ loading: true });
            const success = await this.deleteFileFromS3(key);

            if (success) {
                this.loadDefault();
                alert("File deleted successfully from cloud storage");
            } else {
                alert("Failed to delete file from cloud storage");
            }

            this.setState({ loading: false });
        }
    };

    // Upload new file to S3
    uploadFile = async () => {
        const { uploadFile } = this.state;
        if (!uploadFile) return alert("Select a file first");

        this.setState({ loading: true });

        try {
            const content = await uploadFile.text();
            const success = await this.saveFileToS3(uploadFile.name, content);

            if (success) {
                alert("File uploaded successfully to cloud storage");
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
        const { files, searchTerm, loading, uploadFile, exportFormat } = this.state;

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
                    {loading && <div className="loading">Loading files from cloud...</div>}
                    {!loading && filteredFiles.length === 0 && searchTerm ? (
                        <div className="no-results">No files found matching "{searchTerm}"</div>
                    ) : (
                        <ul>
                            {fileList}
                        </ul>
                    )}
                    {!loading && Object.keys(files).length === 0 && !searchTerm && (
                        <div className="no-files">No files found in cloud storage</div>
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