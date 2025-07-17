import React, { useState, useEffect } from 'react';
import './Login.css';
import ApiService from '../../services/ApiService';

const Login = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    checkAuthenticationStatus();
  }, []);

  const checkAuthenticationStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    try {
      const response = await ApiService.checkAuth();
      if (response.success && response.authenticated) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('email');
      setIsAuthenticated(false);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    if (value && !validateEmail(value)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    
    if (value && !validatePassword(value)) {
      setPasswordError('Password must be at least 6 characters long');
    } else {
      setPasswordError('');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    // Validate inputs
    let hasErrors = false;
    
    if (!email) {
      setEmailError('Email is required');
      hasErrors = true;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      hasErrors = true;
    }
    
    if (!password) {
      setPasswordError('Password is required');
      hasErrors = true;
    } else if (!validatePassword(password)) {
      setPasswordError('Password must be at least 6 characters long');
      hasErrors = true;
    }
    
    if (hasErrors) return;
    
    setIsLoading(true);
    
    try {
      const response = await ApiService.signin({ email, password });
      
      if (response.success && response.data && response.data.token) {
        setIsAuthenticated(true);
        setShowLoginPopup(false);
        setEmail('');
        setPassword('');
        setEmailError('');
        setPasswordError('');
        setAuthError('');
      } else {
        setAuthError(response.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await ApiService.logout();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Still logout locally even if API call fails
      setIsAuthenticated(false);
    }
  };

  const openLoginPopup = () => {
    setShowLoginPopup(true);
    setEmail('');
    setPassword('');
    setEmailError('');
    setPasswordError('');
    setAuthError('');
  };

  const closeLoginPopup = () => {
    setShowLoginPopup(false);
    setEmail('');
    setPassword('');
    setEmailError('');
    setPasswordError('');
    setAuthError('');
  };

  return (
    <>
      <button 
        className="auth-button" 
        onClick={isAuthenticated ? handleLogout : openLoginPopup}
      >
        {isAuthenticated ? 'Logout' : 'Login'}
      </button>

      {showLoginPopup && (
        <div className="login-overlay">
          <div className="login-popup">
            <div className="login-header">
              <h2>Login</h2>
              <button className="close-button" onClick={closeLoginPopup}>
                ×
              </button>
            </div>
            
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={handleEmailChange}
                  className={emailError ? 'error' : ''}
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
                {emailError && <span className="error-text">{emailError}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={handlePasswordChange}
                  className={passwordError ? 'error' : ''}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                {passwordError && <span className="error-text">{passwordError}</span>}
              </div>

              {authError && <div className="auth-error">{authError}</div>}

              <button 
                type="submit" 
                className="submit-button"
                disabled={isLoading || emailError || passwordError}
              >
                {isLoading ? 'Logging in...' : 'Login/Signup'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;