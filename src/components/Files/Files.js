import React, { useState, useRef, useEffect } from 'react';
import './Files.css';
import * as AppGeneral from '../../socialcalc/AppGeneral.js';
import { Local } from '../storage/LocalStorage.js';
import { DATA } from '../../app-data.js';
import ApiService from '../../services/ApiService.js';

const Files = ({ file, updateSelectedFile }) => {
	const storeRef = useRef(new Local(file));
	const [files, setFiles] = useState(storeRef.current._getAllFiles());
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedFiles, setSelectedFiles] = useState({});
	const [loading, setLoading] = useState(false);
	const [showUploadAlert, setShowUploadAlert] = useState(false);
	const [uploadTarget, setUploadTarget] = useState('');
	const [conflictFiles, setConflictFiles] = useState([]);
	const [alertMessage, setAlertMessage] = useState('');

	const editFile = (key) => {
		const data = storeRef.current._getFile(key);

		// Check if file is password protected
		if (data.password && typeof data.password === 'string' && data.password.trim() !== '') {
			const userPassword = window.prompt(`File "${key}" is password protected. Enter password:`);

			if (!userPassword) {
				// User cancelled password prompt
				return;
			}

			if (userPassword.trim() !== data.password.trim()) {
				window.alert('Incorrect password! Access denied.');
				return;
			}
		}

		// Password is correct or file is not password protected
		AppGeneral.viewFile(key, decodeURIComponent(data.content));
		updateSelectedFile(key);
	};

	const deleteFile = (key, event) => {
		event.preventDefault();
		const result = window.confirm(`Do you want to delete the ${key} file?`);
		if (result) {
			storeRef.current._deleteFile(key);
			setFiles(storeRef.current._getAllFiles());
			loadDefault();
		}
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

	const formatDate = (date) => {
		return new Date(date).toLocaleString();
	};

	// File selection management
	const toggleFileSelection = (key) => {
		setSelectedFiles(prev => ({
			...prev,
			[key]: !prev[key]
		}));
	};

	const getSelectedFiles = () => {
		return Object.keys(selectedFiles).filter(key => selectedFiles[key]);
	};

	const hasSelectedFiles = () => {
		return getSelectedFiles().length > 0;
	};

	// Check if file exists in cloud storage
	const isFileExistsInCloud = async (filename, provider) => {
		try {
			const response = provider === 's3'
				? await ApiService.listAllS3()
				: await ApiService.listAllDropbox();

			const cloudFiles = provider === 's3' ? response.s3Files : response.dropboxFiles;
			return Object.keys(cloudFiles || {}).includes(filename);
		} catch (error) {
			console.error(`Error checking ${provider} files:`, error);
			return false;
		}
	};

	// Upload functions
	const uploadToS3 = async () => {
		const selectedFileNames = getSelectedFiles();
		if (selectedFileNames.length === 0) {
			alert('No files selected for upload');
			return;
		}

		// Check for conflicts
		const conflicts = [];
		for (const fileName of selectedFileNames) {
			const exists = await isFileExistsInCloud(fileName, 's3');
			if (exists) {
				conflicts.push(fileName);
			}
		}

		if (conflicts.length > 0) {
			setConflictFiles(conflicts);
			setUploadTarget('s3');
			setAlertMessage(`${conflicts.length} file(s) already exist in S3. Overwrite existing files?`);
			setShowUploadAlert(true);
			return;
		}

		await executeUpload(selectedFileNames, 's3');
	};

	const uploadToDropbox = async () => {
		const selectedFileNames = getSelectedFiles();
		if (selectedFileNames.length === 0) {
			alert('No files selected for upload');
			return;
		}

		// Check for conflicts
		const conflicts = [];
		for (const fileName of selectedFileNames) {
			const exists = await isFileExistsInCloud(fileName, 'dropbox');
			if (exists) {
				conflicts.push(fileName);
			}
		}

		if (conflicts.length > 0) {
			setConflictFiles(conflicts);
			setUploadTarget('dropbox');
			setAlertMessage(`${conflicts.length} file(s) already exist in Dropbox. Overwrite existing files?`);
			setShowUploadAlert(true);
			return;
		}

		await executeUpload(selectedFileNames, 'dropbox');
	};

	const executeUpload = async (fileNames, provider) => {
		setLoading(true);
		try {
			let successCount = 0;
			let errorCount = 0;

			for (const fileName of fileNames) {
				try {
					const fileData = storeRef.current._getFile(fileName);
					if (!fileData) {
						errorCount++;
						continue;
					}

					const content = decodeURIComponent(fileData.content);
					const success = provider === 's3'
						? await ApiService.uploadFileS3(fileName, content)
						: await ApiService.uploadFileDropbox(fileName, content);

					if (success) {
						successCount++;
					} else {
						errorCount++;
					}
				} catch (error) {
					console.error(`Error uploading ${fileName} to ${provider}:`, error);
					errorCount++;
				}
			}

			// Clear selections and show results
			setSelectedFiles({});

			if (successCount > 0) {
				alert(`Successfully uploaded ${successCount} file(s) to ${provider.toUpperCase()}${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
			} else {
				alert(`Failed to upload any files to ${provider.toUpperCase()}`);
			}

		} catch (error) {
			console.error(`Batch upload to ${provider} error:`, error);
			alert(`Error during batch upload to ${provider.toUpperCase()}`);
		} finally {
			setLoading(false);
		}
	};

	// Filter files based on search term
	const filteredFiles = Object.keys(files).filter(key =>
		key !== 'default' && key.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const fileList = filteredFiles.map(key => {
		const fileData = storeRef.current._getFile(key);
		const isPasswordProtected = fileData && fileData.password && typeof fileData.password === 'string' && fileData.password.trim() !== '';

		return (
			<div key={key} className="file-item">
				<div className="file-info">
					<input
						type="checkbox"
						checked={selectedFiles[key] || false}
						onChange={() => toggleFileSelection(key)}
						className="file-checkbox"
					/>
					<div className="file-details">
						<span className="file-name">
							{isPasswordProtected && <span className="password-icon">🔒 </span>}
							{key}
						</span>
						<span className="file-date">{formatDate(files[key])}</span>
					</div>
				</div>
				<div className="file-actions">
					<button onClick={() => editFile(key)} className="edit-btn" disabled={loading}>Edit</button>
					<button onClick={(event) => deleteFile(key, event)} className="delete-btn" disabled={loading}>Delete</button>
				</div>
			</div>
		);
	});

	return (
		<div className="file">
			<div className="search-container">
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

			{/* Upload buttons for selected files */}
			{hasSelectedFiles() && (
				<div className="upload-controls">
					<button
						onClick={uploadToS3}
						disabled={loading}
						className="upload-btn s3-btn"
					>
						🗄️ Upload to S3 ({getSelectedFiles().length})
					</button>
					<button
						onClick={uploadToDropbox}
						disabled={loading}
						className="upload-btn dropbox-btn"
					>
						📦 Upload to Dropbox ({getSelectedFiles().length})
					</button>
				</div>
			)}

			<div className="search-results">
				{loading && <div className="loading">Uploading files...</div>}
				{!loading && filteredFiles.length === 0 && searchTerm ? (
					<div className="no-results">No files found matching "{searchTerm}"</div>
				) : !loading && filteredFiles.length > 0 ? (
					<div className="file-grid">
						{fileList}
					</div>
				) : !loading && Object.keys(files).length <= 1 ? (
					<div className="no-files">No local files found</div>
				) : null}
			</div>

			{/* Upload Conflict Alert */}
			{showUploadAlert && (
				<div className="alert-overlay">
					<div className="alert-dialog">
						<h4>File Conflicts</h4>
						<p>{alertMessage}</p>
						<div className="alert-buttons">
							<button
								onClick={() => {
									setShowUploadAlert(false);
									setConflictFiles([]);
									setUploadTarget('');
								}}
								className="cancel-btn"
							>
								Cancel
							</button>
							<button
								onClick={() => {
									const selectedFileNames = getSelectedFiles();
									const nonConflictFiles = selectedFileNames.filter(filename => !conflictFiles.includes(filename));
									if (nonConflictFiles.length > 0) {
										executeUpload(nonConflictFiles, uploadTarget);
									}
									setShowUploadAlert(false);
									setConflictFiles([]);
									setUploadTarget('');
								}}
								className="skip-btn"
							>
								Skip Conflicts
							</button>
							<button
								onClick={() => {
									executeUpload(getSelectedFiles(), uploadTarget);
									setShowUploadAlert(false);
									setConflictFiles([]);
									setUploadTarget('');
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

export default Files;