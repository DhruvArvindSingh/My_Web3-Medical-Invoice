import React, { useState, useEffect } from "react";
import "./App.css";
import * as AppGeneral from "../socialcalc/AppGeneral";
import { DATA } from "../app-data.js";

import Menu from "../Menu/Menu";
import Files from "../Files/Files";
import { ConnectKitButton } from "connectkit";
import Cloud from "../Cloud/Cloud";
import LogoUpload from "../Logo/LogoUpload";
import Login from "../components/Login/Login";
import ApiService from "../services/ApiService";
import { PopupProvider, usePopup } from "../context/PopupContext";
import { useAutosave } from "../hooks/useAutosave";
import AutosaveIndicator from "../components/AutosaveIndicator/AutosaveIndicator";
import AutosaveSettings from "../components/AutosaveSettings/AutosaveSettings";
import { Local } from "../storage/LocalStorage";

const AppContent = () => {
  const [selectedFile, setSelectedFile] = useState("default");
  const [device] = useState(AppGeneral.getDeviceType());
  const [userLogo, setUserLogo] = useState(null);
  const [showAutosaveSettings, setShowAutosaveSettings] = useState(false);
  const { togglePopup, isPopupActive } = usePopup();

  const updateSelectedFile = (selectedFile) => {
    setSelectedFile(selectedFile);
  };

  // Initialize autosave functionality
  const { saveNow, triggerAutoSave, saveToBackend } = useAutosave(selectedFile, updateSelectedFile);

  const handleToggleListFiles = () => {
    togglePopup('listFiles');
  };

  const handleToggleCloud = () => {
    togglePopup('cloud');
  };

  const handleToggleLogo = () => {
    togglePopup('logo');
  };

  const handleToggleAutosaveSettings = () => {
    setShowAutosaveSettings(true);
  };

  const handleCloseAutosaveSettings = () => {
    setShowAutosaveSettings(false);
  };

  const handleLogoChange = (logoData) => {
    setUserLogo(logoData);
  };

  // App initialization with proper default file handling
  useEffect(() => {
    const initializeAppWithData = () => {
      const storeRef = new Local();

      // Check if "default" file exists in storage
      const defaultFile = storeRef._getFile('default');

      if (defaultFile && defaultFile.content) {
        try {
          // Render the default file from storage
          console.log('Loading default file from storage');
          const content = decodeURIComponent(defaultFile.content);
          AppGeneral.initializeApp(content);
          setSelectedFile('default');

          // Delete the default file from storage after rendering
          storeRef._deleteFile('default');
          console.log('Deleted default file from storage after loading');
        } catch (error) {
          console.error('Error loading default file from storage:', error);
          // Fallback to app-data if default file is corrupted
          const data = DATA["home"][device]["msc"];
          AppGeneral.initializeApp(JSON.stringify(data));
          setSelectedFile('default');
        }
      } else {
        // No default file exists, use app-data
        console.log('No default file found, using app-data');
        const data = DATA["home"][device]["msc"];
        AppGeneral.initializeApp(JSON.stringify(data));
        setSelectedFile('default');
      }
    };

    initializeAppWithData();
  }, [device]);

  useEffect(() => {
    const loadUserLogo = async () => {
      try {
        const logoResponse = await ApiService.getUserLogo();
        if (logoResponse.success && logoResponse.data) {
          setUserLogo(logoResponse.data);
        }
      } catch (error) {
        console.log('No logo found or error loading logo:', error);
      }
    };

    loadUserLogo();
  }, []);

  // Implement autosave on app close/refresh
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      // Save current file to backend on app close/refresh
      // If current file is "default" or unnamed, save as "default"
      // If current file has a name, save by that name
      saveToBackend();

      // Note: In modern browsers, you can't customize the message
      event.preventDefault();
      event.returnValue = '';
    };

    const handleVisibilityChange = () => {
      // Save when tab becomes hidden (user switches tabs or minimizes browser)
      if (document.hidden) {
        saveToBackend();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // For mobile apps, also handle app state changes
    if (typeof window !== 'undefined' && 'cordova' in window) {
      document.addEventListener('pause', () => {
        saveToBackend();
      });
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (typeof window !== 'undefined' && 'cordova' in window) {
        document.removeEventListener('pause', () => {
          saveToBackend();
        });
      }
    };
  }, [saveToBackend]);

  const activateFooter = (footer) => {
    AppGeneral.activateFooterButton(footer);
  };

  const footers = DATA["home"][device]["footers"];

  const footersList = footers.map((footerArray, i) => {
    return (
      <button
        className="button button-outline"
        key={footerArray.index}
        onClick={() => activateFooter(footerArray.index)}
      >
        {footerArray.name}
      </button>
    );
  });

  return (
    <div className="App">
      <div className="App-header">
        <span>Editing: {selectedFile} </span>
        <AutosaveIndicator />
        <span className="Connect-list">
          <ConnectKitButton />
        </span>
        <Login />
        <button
          className={`App-list ${isPopupActive('cloud') ? 'active' : ''}`}
          onClick={handleToggleCloud}
        >
          Cloud
        </button>
        <button
          className={`App-list ${isPopupActive('listFiles') ? 'active' : ''}`}
          onClick={handleToggleListFiles}
        >
          List Files
        </button>
        <button
          className={`App-list ${isPopupActive('logo') ? 'active' : ''}`}
          onClick={handleToggleLogo}
        >
          Logo
        </button>
        <button
          className="App-list"
          onClick={handleToggleAutosaveSettings}
          title="Autosave Settings"
        >
          ⚙️
        </button>
      </div>
      <div className="App-menu">
        <Menu
          file={selectedFile}
          updateSelectedFile={updateSelectedFile}
          userLogo={userLogo}
        />
      </div>
      <ul className="App-footers"> {footersList} </ul>
      <div id="workbookControl"></div>
      <div id="tableeditor">editor goes here</div>
      <div id="msg"></div>
      {isPopupActive('listFiles') && (
        <div className="App-files">
          <Files
            file={selectedFile}
            updateSelectedFile={updateSelectedFile}
          />
        </div>
      )}
      {isPopupActive('cloud') && (
        <div className="App-cloud">
          <Cloud
            file={selectedFile}
            updateSelectedFile={updateSelectedFile}
          />
        </div>
      )}
      {isPopupActive('logo') && (
        <div className="App-logo">
          <LogoUpload
            userLogo={userLogo}
            setUserLogo={setUserLogo}
            onLogoChange={handleLogoChange}
          />
        </div>
      )}
      {showAutosaveSettings && (
        <AutosaveSettings onClose={handleCloseAutosaveSettings} />
      )}
    </div>
  );
};

const App = () => {
  return (
    <PopupProvider>
      <AppContent />
    </PopupProvider>
  );
};

export default App;
