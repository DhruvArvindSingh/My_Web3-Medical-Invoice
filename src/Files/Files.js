import React, { useState, useRef, useEffect } from 'react';
import './Files.css';
import * as AppGeneral from '../socialcalc/AppGeneral';
import { Local } from '../storage/LocalStorage.js';
import { DATA } from '../app-data.js';

const Files = ({ file, updateSelectedFile }) => {
	const storeRef = useRef(new Local(file));
	const [files, setFiles] = useState(storeRef.current._getAllFiles());
	const [searchTerm, setSearchTerm] = useState('');

	const editFile = (key) => {
		const data = storeRef.current._getFile(key);
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

	// Filter files based on search term
	const filteredFiles = Object.keys(files).filter(key =>
		key.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const fileList = filteredFiles.map(key => {
		return (
			<div key={key}>
				<li>{key} <span>{formatDate(files[key])}</span></li>
				<button onClick={() => editFile(key)}>Edit</button>
				<button onClick={(event) => deleteFile(key, event)}>Delete</button>
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
			<div className="search-results">
				{filteredFiles.length === 0 && searchTerm ? (
					<div className="no-results">No files found matching "{searchTerm}"</div>
				) : (
					<ul>
						{fileList}
					</ul>
				)}
			</div>
		</div>
	);

};

export default Files;