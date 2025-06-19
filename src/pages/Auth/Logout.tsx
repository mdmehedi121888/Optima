import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bounce, toast } from "react-toastify";

const Logout = () => {
  const navigate = useNavigate();
  const hasLoggedOut = useRef(false);

  useEffect(() => {
    if (hasLoggedOut.current) return;
    hasLoggedOut.current = true;

    const handleLogout = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });

        if (response.ok) {
          toast.success("Log Out Successfully!", {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
            transition: Bounce,
          });
          navigate("/login");
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
