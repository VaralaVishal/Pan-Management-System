import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import VerificationRequired from "./pages/VerificationRequired";
import AddBasketEntry from "./pages/AddBasketEntry";
import AddPaymentEntry from "./pages/AddPaymentEntry";
import ViewPayments from "./pages/ViewPayments";
import BalanceSummary from "./pages/BalanceSummary";
import TransactionHistory from "./pages/TransactionHistory";
import Dashboard from "./pages/Dashboard";
import OCRUpload from "./pages/OCRUpload";
import ManageRecords from "./pages/ManageRecords";
import AddParty from "./pages/AddParty";
import ViewParties from "./pages/ViewParties";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/verification-required" element={<VerificationRequired />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<><Navbar /><Dashboard /></>} />
            <Route path="/add-basket" element={<><Navbar /><AddBasketEntry /></>} />
            <Route path="/add-payment" element={<><Navbar /><AddPaymentEntry /></>} />
            <Route path="/view-payments" element={<><Navbar /><ViewPayments /></>} />
            <Route path="/balance-summary" element={<><Navbar /><BalanceSummary /></>} />
            <Route path="/transaction-history" element={<><Navbar /><TransactionHistory /></>} />
            <Route path="/ocr-upload" element={<><Navbar /><OCRUpload /></>} />
            <Route path="/manage-records" element={<><Navbar /><ManageRecords /></>} />
            <Route path="/add-party" element={<><Navbar /><AddParty /></>} />
            <Route path="/view-parties" element={<><Navbar /><ViewParties /></>} />
          </Route>

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;