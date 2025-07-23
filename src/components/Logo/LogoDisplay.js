import React from 'react';
import './LogoDisplay.css';

const LogoDisplay = ({ 
    logoUrl, 
    alt = "Company Logo", 
    className = "", 
    maxWidth = "150px", 
    maxHeight = "75px",
    style = {},
    onError = null 
}) => {
    if (!logoUrl) {
        return null;
    }

    const handleImageError = (e) => {
        if (onError) {
            onError(e);
        } else {
            // Hide the image if it fails to load
            e.currentTarget.style.display = 'none';
        }
    };

    const logoStyle = {
        maxWidth,
        maxHeight,
        objectFit: 'contain',
        ...style
    };

    return (
        <div className={`logo-display ${className}`}>
            <img 
                src={logoUrl} 
                alt={alt}
                className="logo-display-image"
                style={logoStyle}
                onError={handleImageError}
            />
        </div>
    );
};

export default LogoDisplay;