import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenExpiration, setTokenExpiration] = useState(null);

  useEffect(() => {
    // Check if user is logged in on initial load
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const user = localStorage.getItem("user") || sessionStorage.getItem("user");
    const expiration = localStorage.getItem("tokenExpiration") || sessionStorage.getItem("tokenExpiration");
    
    if (token && user) {
      setCurrentUser(JSON.parse(user));
      setIsAuthenticated(true);
      
      if (expiration) {
        setTokenExpiration(new Date(expiration));
      }
      
      // Set default Authorization header for all requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      
      const expirationDate = expiration ? new Date(expiration) : null;
      if (expirationDate && expirationDate > new Date()) {
        const timeUntilExpiration = expirationDate.getTime() - new Date().getTime();
        setTimeout(() => {
          logout();
        }, timeUntilExpiration);
      }
    }
    
    setLoading(false);
  }, []);

  const login = (token, user, rememberMe = false) => {
    // Store in either localStorage (remember me) or sessionStorage (session only)
    const storage = rememberMe ? localStorage : sessionStorage;
    
    storage.setItem("token", token);
    storage.setItem("user", JSON.stringify(user));
    
    // If we have expiration info, store it
    if (token) {
      try {
        // Decode token to get expiration
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        if (payload.exp) {
          const expDate = new Date(payload.exp * 1000);
          storage.setItem("tokenExpiration", expDate.toISOString());
          setTokenExpiration(expDate);
          const timeUntilExpiration = expDate.getTime() - new Date().getTime();
          setTimeout(() => {
            logout();
          }, timeUntilExpiration);
        }
      } catch (e) {
        console.error("Error decoding token:", e);
      }
    }
    
    setCurrentUser(user);
    setIsAuthenticated(true);
    
    // Set default Authorization header for all requests
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  const logout = () => {
    // Clear both storage types to be safe
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("tokenExpiration");
    
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("tokenExpiration");
    
    setCurrentUser(null);
    setIsAuthenticated(false);
    setTokenExpiration(null);
    
    // Remove Authorization header
    delete axios.defaults.headers.common["Authorization"];
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    tokenExpiration,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 