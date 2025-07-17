import React, { createContext, useState, useContext } from 'react';

const PopupContext = createContext();

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopup must be used within a PopupProvider');
  }
  return context;
};

export const PopupProvider = ({ children }) => {
  const [activePopup, setActivePopup] = useState(null);

  const openPopup = (popupName) => {
    setActivePopup(popupName);
  };

  const closePopup = () => {
    setActivePopup(null);
  };

  const togglePopup = (popupName) => {
    if (activePopup === popupName) {
      closePopup();
    } else {
      openPopup(popupName);
    }
  };

  const isPopupActive = (popupName) => {
    return activePopup === popupName;
  };

  return (
    <PopupContext.Provider
      value={{
        activePopup,
        openPopup,
        closePopup,
        togglePopup,
        isPopupActive,
      }}
    >
      {children}
    </PopupContext.Provider>
  );
};