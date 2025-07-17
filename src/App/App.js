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

const AppContent = () => {
  const [selectedFile, setSelectedFile] = useState("default");
  const [device] = useState(AppGeneral.getDeviceType());
  const [userLogo, setUserLogo] = useState(null);
  const { togglePopup, isPopupActive } = usePopup();

  const updateSelectedFile = (selectedFile) => {
    setSelectedFile(selectedFile);
  };

  const handleToggleListFiles = () => {
    togglePopup('listFiles');
  };

  const handleToggleCloud = () => {
    togglePopup('cloud');
  };

  const handleToggleLogo = () => {
    togglePopup('logo');
  };

  const handleLogoChange = (logoData) => {
    setUserLogo(logoData);
  };

  useEffect(() => {
    let data = DATA["home"][device]["msc"];
    AppGeneral.initializeApp(JSON.stringify(data));
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
