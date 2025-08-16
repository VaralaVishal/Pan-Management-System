import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
    
    // Check for success message from registration or password reset
    if (location.state?.message) {
      setError("");
      // Use location state message as success message
    }
  }, [navigate, location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Check if we should ignore email verification
      const ignoreVerification = location.state?.ignoreVerification;
      
      const response = await axios.post("http://127.0.0.1:5000/api/auth/login", {
        username,
        password,
        ignore_verification: ignoreVerification,
        remember_me: rememberMe
      });

      // Store token and user info in localStorage
      login(response.data.token, response.data.user, rememberMe);

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.data?.requires_verification) {
        // Redirect to verification required page
        navigate("/verification-required", { 
          state: { userId: err.response.data.user_id } 
        });
      } else {
        setError(
          err.response?.data?.error || 
          "Login failed. Please check your credentials and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: "400px", 
      margin: "40px auto", 
      padding: "20px", 
      boxShadow: "0 0 10px rgba(0,0,0,0.1)",
      borderRadius: "8px",
      backgroundColor: "white"
    }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Login</h2>
      
      {location.state?.message && (
        <div style={{ 
          padding: "10px", 
          backgroundColor: "#e8f5e9", 
          color: "#2e7d32", 
          borderRadius: "4px", 
          marginBottom: "20px" 
        }}>
          {location.state.message}
        </div>
      )}
      
      {error && (
        <div style={{ 
          padding: "10px", 
          backgroundColor: "#ffebee", 
          color: "#c62828", 
          borderRadius: "4px", 
          marginBottom: "20px" 
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ 
              width: "100%", 
              padding: "8px", 
              borderRadius: "4px", 
              border: "1px solid #ddd" 
            }}
            required
          />
        </div>
        
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ 
              width: "100%", 
              padding: "8px", 
              borderRadius: "4px", 
              border: "1px solid #ddd" 
            }}
            required
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px" }}>
            <label style={{ display: "flex", alignItems: "center", fontSize: "14px" }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ marginRight: "5px" }}
              />
              Remember me
            </label>
            <Link 
              to="/forgot-password"
              style={{ 
                color: "#2196F3", 
                fontSize: "14px",
                textDecoration: "none"
              }}
            >
              Forgot Password?
            </Link>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          style={{ 
            width: "100%", 
            padding: "10px", 
            backgroundColor: "#4CAF50", 
            color: "white", 
            border: "none", 
            borderRadius: "4px", 
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <p>
          Don't have an account?{" "}
          <span 
            onClick={() => navigate("/register")}
            style={{ 
              color: "#2196F3", 
              cursor: "pointer",
              textDecoration: "underline"
            }}
          >
            Register here
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login; 