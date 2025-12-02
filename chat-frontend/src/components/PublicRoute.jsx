// PublicRoute.jsx
// This prevents logged-in users from seeing login/signup again.

import { Navigate } from "react-router-dom";

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (token) {
    return <Navigate to="/channels" replace />;
  }

  return children;
};

export default PublicRoute;
