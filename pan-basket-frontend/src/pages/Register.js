import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    
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
      await axios.post("http://127.0.0.1:5000/api/auth/register", {
        username,
        email,
        password,
      });

      // Redirect to login page after successful registration
      navigate("/login", { state: { message: "Registration successful! Please log in." } });
    } catch (err) {
      setError(
        err.response?.data?.error || 
        "Registration failed. Please try again."
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
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Register</h2>
      
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
      
      <form onSubmit={handleRegister}>
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
        
        <div style={{ marginBottom: "15px" }}>
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
        
        <div style={{ marginBottom: "15px" }}>
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
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <p>
          Already have an account?{" "}
          <span 
            onClick={() => navigate("/login")}
            style={{ 
              color: "#2196F3", 
              cursor: "pointer",
              textDecoration: "underline"
            }}
          >
            Login here
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register; 