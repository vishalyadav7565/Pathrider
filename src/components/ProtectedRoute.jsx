import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem("accessToken");
  const role = localStorage.getItem("role");

  // If not logged in → go to proper login page
  if (!token) {
    return <Navigate to={`/login/${allowedRole}`} replace />;
  }

  // If wrong role → redirect to their own dashboard
  if (role !== allowedRole) {
    return <Navigate to={`/${role}-dashboard`} replace />;
  }

  // Everything OK → show page
  return children;
};

export default ProtectedRoute;
