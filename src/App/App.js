import React, { useState, useEffect } from "react";
import "./App.css";
import * as AppGeneral from "../socialcalc/AppGeneral";
import { DATA } from "../app-data.js";

import Menu from "../Menu/Menu";
import Files from "../Files/Files";
import { ConnectKitButton } from "connectkit";
import Cloud from "../Cloud/Cloud";
import LogoUpload from "../Logo/LogoUpload";
import ApiService from "../services/ApiService";

const App = () => {
  const [selectedFile, setSelectedFile] = useState("default");
  const [device] = useState(AppGeneral.getDeviceType());
  const [listFiles, setListFiles] = useState(false);
  const [cloud, setCloud] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [userLogo, setUserLogo] = useState(null);

  const updateSelectedFile = (selectedFile) => {
    setSelectedFile(selectedFile);
  };

  const toggleListFiles = () => {
    setListFiles(prev => !prev);
  };

  const toggleCloud = () => {
    setCloud(prev => !prev);
  };

  const toggleLogo = () => {
    setShowLogo(prev => !prev);
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
        <button className="App-list" onClick={toggleCloud}>
          Cloud
        </button>
        <button className="App-list" onClick={toggleListFiles}>
          List Files
        </button>
        <button className="App-list" onClick={toggleLogo}>
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
      {listFiles && (
        <div className="App-files">
          <Files
            file={selectedFile}
            updateSelectedFile={updateSelectedFile}
          />
        </div>
      )}
      {cloud && (
        <div className="App-cloud">
          <Cloud
            file={selectedFile}
            updateSelectedFile={updateSelectedFile}
          />
        </div>
      )}
      {showLogo && (
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

export default App;
