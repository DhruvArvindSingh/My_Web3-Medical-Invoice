import React from "react";
import "./Header.css";
import { ConnectKitButton } from "connectkit";
import Login from "../Login/Login";
import { usePopup } from "../../context/PopupContext";
import { FaCloud, FaFolderOpen, FaImage } from "react-icons/fa";
import { MdUndo, MdRedo } from "react-icons/md";

const Header = ({ selectedFile, onToggleCloud, onToggleListFiles, onToggleLogo, onUndo, onRedo }) => {
    const { isPopupActive } = usePopup();

    return (
        <div className="App-header">
            <span>Editing: {selectedFile} </span>
            <span className="Connect-list">
                <ConnectKitButton />
            </span>
            <Login />
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
                onClick={onUndo}
                title="Undo"
            >
                <span className="button-text">Undo</span>
                <MdUndo className="button-icon" />
            </button>
            <button
                className="App-list"
                onClick={onRedo}
                title="Redo"
            >
                <span className="button-text">Redo</span>
                <MdRedo className="button-icon" />
            </button>
        </div>
    );
};

export default Header;
