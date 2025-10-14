import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/check-session`, {
          method: "GET",
          credentials: "include", // ✅ Important for session cookies
        });

        const data = await response.json();
        setIsAuthenticated(data.isAuthenticated);
      } catch (error) {
        console.error("Session check failed:", error);
        setIsAuthenticated(false);
      }
    };

    checkSession();
  }, []);

  // ✅ Show loading screen while checking session
  if (isAuthenticated === null) return <div>Loading...</div>;

  // ✅ Redirect to login if not authenticated
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
