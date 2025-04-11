import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });

        if (response.ok) {
          Swal.fire({
            icon: "success",
            title: "Logged Out",
            position: "center",
            text: "You have been successfully logged out.",
            timer: 2000,
            showConfirmButton: false,
          }).then(() => {
            navigate("/login");
          });
        }
      } catch (error) {
        console.error("Logout error:", error);
      }
    };

    handleLogout(); 
  }, [navigate]);

  return null; 
};

export default Logout;
