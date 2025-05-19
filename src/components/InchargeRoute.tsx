import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

const InchargeRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkIncharge = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/auth/check-incharge", {
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

    checkIncharge();
  }, []);

  // ✅ Show loading screen while checking session
  if (isAuthenticated === null) return <div>Loading...</div>;

  // ✅ Redirect to login if not authenticated
  return isAuthenticated ? <Outlet /> : <Navigate to="/not-authenticated" replace />;
};

export default InchargeRoute;
