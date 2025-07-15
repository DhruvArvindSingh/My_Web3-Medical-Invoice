import React, { useState, useEffect } from "react";
import "./App.css";
import * as AppGeneral from "../socialcalc/AppGeneral";
import { DATA } from "../app-data.js";

import Menu from "../Menu/Menu";
import Files from "../Files/Files";
import { ConnectKitButton } from "connectkit";
import Cloud from "../Cloud/Cloud";

const App = () => {
  const [selectedFile, setSelectedFile] = useState("default");
  const [device] = useState(AppGeneral.getDeviceType());
  const [listFiles, setListFiles] = useState(false);
  const [cloud, setCloud] = useState(false);

  const updateSelectedFile = (selectedFile) => {
    setSelectedFile(selectedFile);
  };

  const toggleListFiles = () => {
    setListFiles(prev => !prev);
  };

  const toggleCloud = () => {
    setCloud(prev => !prev);
  };

  useEffect(() => {
    let data = DATA["home"][device]["msc"];
    AppGeneral.initializeApp(JSON.stringify(data));
  }, [device]);

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
      </div>
      <div className="App-menu">
        <Menu
          file={selectedFile}
          updateSelectedFile={updateSelectedFile}
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
    </div>
  );
};

export default App;
