import { AlignLeft } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {  settings } from "../../pages/Settings/Settings";



export default function SubSidebar() {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/check-session`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch session: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.isAuthenticated) {
          setUserRole(data.user.role);
        } else {
          console.warn("User is not authenticated");
        }
      } catch (error) {
        console.error("Error fetching user session:", error);
      }
    };

    fetchUser();
  }, []);

  // Filter settings based on user role
  const visibleSettings = userRole === "Operator" ? settings.filter((setting) => setting.title === "Profile") : settings;

  return (
    <div className={`bg-white shadow-md h-full rounded-lg p-4 transition-all duration-300 ${isOpen ? "w-64" : "w-16"}`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className={`text-2xl font-bold ${!isOpen && "hidden"}`}>Settings</h1>
        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700 hover:text-gray-900">
          <AlignLeft size={24} />
        </button>
      </div>

      <ul className="space-y-2">
        {visibleSettings.map((setting, index) => (
          <li key={index}>
            <Link to={setting.link} className="flex items-center gap-3 p-2 hover:bg-gray-200 rounded-lg transition">
              {setting.icon}
              <span className={`${!isOpen && "hidden"}`}>{setting.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}