import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post("http://127.0.0.1:5000/api/auth/forgot-password", {
        email,
      });

      setMessage(response.data.message || "If your email is registered, you will receive a password reset link");
    } catch (err) {
      setError(
        err.response?.data?.error || 
        "An error occurred. Please try again later."
      );
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
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Forgot Password</h2>
      
      {message && (
        <div style={{ 
          padding: "10px", 
          backgroundColor: "#e8f5e9", 
          color: "#2e7d32", 
          borderRadius: "4px", 
          marginBottom: "20px" 
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
          marginBottom: "20px" 
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          disabled={loading}
          style={{ 
            width: "100%", 
            padding: "10px", 
            backgroundColor: "#2196F3", 
            color: "white", 
            border: "none", 
            borderRadius: "4px", 
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Sending..." : "Send Reset Link"}
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

export default ForgotPassword; 