import React from "react";
import "./Header.css";
import { ConnectKitButton } from "connectkit";
import Login from "../Login/Login";
import AutosaveIndicator from "../AutosaveIndicator/AutosaveIndicator";
import { usePopup } from "../../context/PopupContext";
import { FaCloud, FaFolderOpen, FaImage, FaCog } from "react-icons/fa";

const Header = ({ selectedFile, onToggleCloud, onToggleListFiles, onToggleLogo, onToggleAutosaveSettings }) => {
    const { isPopupActive } = usePopup();

    return (
        <div className="App-header">
            <span>Editing: {selectedFile} </span>
            <span className="Connect-list">
                <ConnectKitButton />
            </span>
            <Login />
            <AutosaveIndicator />
            <button
                className={`App-list ${isPopupActive('cloud') ? 'active' : ''}`}
                onClick={onToggleCloud}
            >
                <span className="button-text">Cloud</span>
                <FaCloud className="button-icon" />
            </button>
            <button
                className={`App-list ${isPopupActive('listFiles') ? 'active' : ''}`}
                onClick={onToggleListFiles}
            >
                <span className="button-text">List Files</span>
                <FaFolderOpen className="button-icon" />
            </button>
            <button
                className={`App-list ${isPopupActive('logo') ? 'active' : ''}`}
                onClick={onToggleLogo}
            >
                <span className="button-text">Logo</span>
                <FaImage className="button-icon" />
            </button>
            <button
                className="App-list"
                onClick={onToggleAutosaveSettings}
                title="Autosave Settings"
            >
                <span className="button-text">Settings</span>
                <FaCog className="button-icon" />
            </button>
        </div>
    );
};

export default Header;
