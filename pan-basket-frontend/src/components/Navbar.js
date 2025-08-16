import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav style={{ 
      padding: "10px 20px", 
      background: "#e0e0e0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <Link to="/" style={{ marginRight: "15px" }}>Home</Link>
        <Link to="/add-party" style={{ marginRight: "15px" }}>Add Party</Link>
        <Link to="/view-parties" style={{ marginRight: "15px" }}>View Parties</Link>
        <Link to="/add-basket" style={{ marginRight: "15px" }}>Add Basket</Link>
        <Link to="/add-payment" style={{ marginRight: "15px" }}>Add Payment</Link>
        <Link to="/view-payments" style={{ marginRight: "15px" }}>View Payments</Link>
        <Link to="/balance-summary" style={{ marginRight: "15px" }}>Balance Summary</Link>
        <Link to="/transaction-history" style={{ marginRight: "15px" }}>Transaction History</Link>
        <Link to="/ocr-upload" style={{ marginRight: "15px" }}>OCR Upload</Link>
        <Link to="/manage-records" style={{ marginRight: "15px" }}>Manage Records</Link>
      </div>
      
      <div style={{ display: "flex", alignItems: "center" }}>
        {currentUser && (
          <>
            <span style={{ marginRight: "15px" }}>
              Welcome, {currentUser.username}
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: "5px 10px",
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
