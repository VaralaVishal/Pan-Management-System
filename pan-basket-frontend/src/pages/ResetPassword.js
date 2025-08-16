import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    // Validate token when component mounts
    const validateToken = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:5000/api/auth/verify-reset-token/${token}`);
        setTokenValid(response.data.valid);
      } catch (err) {
        setTokenValid(false);
        setError("Invalid or expired token");
      } finally {
        setValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    // Validate password strength
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    setLoading(true);

    try {
      const response = await axios.post(`http://127.0.0.1:5000/api/auth/reset-password/${token}`, {
        password,
      });

      setMessage(response.data.message || "Password has been reset successfully");
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.error || 
        "An error occurred. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div style={{ 
        maxWidth: "400px", 
        margin: "40px auto", 
        padding: "20px", 
        textAlign: "center" 
      }}>
        <p>Validating reset token...</p>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div style={{ 
        maxWidth: "400px", 
        margin: "40px auto", 
        padding: "20px", 
        boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        borderRadius: "8px",
        backgroundColor: "white",
        textAlign: "center"
      }}>
        <h2 style={{ marginBottom: "20px" }}>Invalid Reset Link</h2>
        <p>The password reset link is invalid or has expired.</p>
        <div style={{ marginTop: "20px" }}>
          <Link 
            to="/forgot-password"
            style={{ 
              color: "#2196F3", 
              textDecoration: "none"
            }}
          >
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: "400px", 
      margin: "40px auto", 
      padding: "20px", 
      boxShadow: "0 0 10px rgba(0,0,0,0.1)",
      borderRadius: "8px",
      backgroundColor: "white"
    }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Reset Password</h2>
      
      {message && (
        <div style={{ 
          padding: "10px", 
          backgroundColor: "#e8f5e9", 
          color: "#2e7d32", 
          borderRadius: "4px", 
          marginBottom: "20px" 
        }}>
          {message}
          <p>Redirecting to login page...</p>
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
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>New Password:</label>
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
            minLength={6}
          />
          <small style={{ color: "#666", fontSize: "12px" }}>
            Password must be at least 6 characters long
          </small>
        </div>
        
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Confirm Password:</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ 
              width: "100%", 
              padding: "8px", 
              borderRadius: "4px", 
              border: "1px solid #ddd" 
            }}
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || message}
          style={{ 
            width: "100%", 
            padding: "10px", 
            backgroundColor: "#2196F3", 
            color: "white", 
            border: "none", 
            borderRadius: "4px", 
            cursor: (loading || message) ? "default" : "pointer",
            opacity: (loading || message) ? 0.7 : 1
          }}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
      
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <Link 
          to="/login"
          style={{ 
            color: "#2196F3", 
            textDecoration: "none"
          }}
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default ResetPassword; 