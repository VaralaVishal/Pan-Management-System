import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

function VerifyEmail() {
  const { token } = useParams();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:5000/api/auth/verify-email/${token}`);
        setVerified(true);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to verify email");
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [token]);

  if (verifying) {
    return (
      <div style={{ 
        maxWidth: "400px", 
        margin: "40px auto", 
        padding: "20px", 
        textAlign: "center" 
      }}>
        <h2>Verifying your email...</h2>
        <p>Please wait while we verify your email address.</p>
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
      backgroundColor: "white",
      textAlign: "center"
    }}>
      {verified ? (
        <>
          <h2 style={{ color: "#2e7d32" }}>Email Verified!</h2>
          <p>Your email has been successfully verified.</p>
          <p>You can now log in to your account.</p>
        </>
      ) : (
        <>
          <h2 style={{ color: "#c62828" }}>Verification Failed</h2>
          <p>{error}</p>
          <p>The verification link may be invalid or expired.</p>
        </>
      )}
      
      <div style={{ marginTop: "20px" }}>
        <Link 
          to="/login"
          style={{ 
            display: "inline-block",
            padding: "10px 20px",
            backgroundColor: "#2196F3",
            color: "white",
            textDecoration: "none",
            borderRadius: "4px"
          }}
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}

export default VerifyEmail; 