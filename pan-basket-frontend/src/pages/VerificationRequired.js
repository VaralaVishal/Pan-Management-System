import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

function VerificationRequired() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId } = location.state || {};
  
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResendVerification = async () => {
    if (!userId) {
      setError("User ID not found. Please try logging in again.");
      return;
    }
    
    setSending(true);
    setMessage("");
    setError("");
    
    try {
      const response = await axios.post("http://127.0.0.1:5000/api/auth/resend-verification", {
        user_id: userId
      });
      
      setMessage(response.data.message || "Verification email sent successfully");
    } catch (err) {
      setError(
        err.response?.data?.error || 
        "Failed to send verification email. Please try again later."
      );
    } finally {
      setSending(false);
    }
  };

  const handleContinueWithoutVerification = () => {
    // Try to login with ignore_verification flag
    navigate("/login", { state: { ignoreVerification: true } });
  };

  return (
    <div style={{ 
      maxWidth: "500px", 
      margin: "40px auto", 
      padding: "20px", 
      boxShadow: "0 0 10px rgba(0,0,0,0.1)",
      borderRadius: "8px",
      backgroundColor: "white",
      textAlign: "center"
    }}>
      <h2>Email Verification Required</h2>
      
      <div style={{ marginBottom: "20px", textAlign: "left" }}>
        <p>Your email address has not been verified yet. Please check your inbox for a verification email.</p>
        <p>If you didn't receive the email, you can request a new one by clicking the button below.</p>
      </div>
      
      {message && (
        <div style={{ 
          padding: "10px", 
          backgroundColor: "#e8f5e9", 
          color: "#2e7d32", 
          borderRadius: "4px", 
          marginBottom: "20px",
          textAlign: "left"
        }}>
          {message}
        </div>
      )}
      
      {error && (
        <div style={{ 
          padding: "10px", 
          backgroundColor: "#ffebee", 
          color: "#c62828", 
          borderRadius: "4px", 
          marginBottom: "20px",
          textAlign: "left"
        }}>
          {error}
        </div>
      )}
      
      <div style={{ marginTop: "20px" }}>
        <button
          onClick={handleResendVerification}
          disabled={sending}
          style={{ 
            padding: "10px 20px", 
            backgroundColor: "#2196F3", 
            color: "white", 
            border: "none", 
            borderRadius: "4px", 
            cursor: sending ? "default" : "pointer",
            opacity: sending ? 0.7 : 1,
            marginRight: "10px"
          }}
        >
          {sending ? "Sending..." : "Resend Verification Email"}
        </button>
        
        <button
          onClick={() => navigate("/login")}
          style={{ 
            padding: "10px 20px", 
            backgroundColor: "#6c757d", 
            color: "white", 
            border: "none", 
            borderRadius: "4px", 
            cursor: "pointer"
          }}
        >
          Back to Login
        </button>
      </div>
      
      <div style={{ marginTop: "20px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
        <button
          onClick={handleContinueWithoutVerification}
          style={{ 
            padding: "10px 20px", 
            backgroundColor: "transparent", 
            color: "#2196F3", 
            border: "1px solid #2196F3", 
            borderRadius: "4px", 
            cursor: "pointer"
          }}
        >
          Continue without verification
        </button>
        <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
          Note: Some features may be limited without email verification.
        </p>
      </div>
    </div>
  );
}

export default VerificationRequired; 