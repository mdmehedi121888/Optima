import { LayoutDashboard, FileText, Factory, LogOut, Clock, X, Settings } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface SidebarProps {
  onClose: () => void;
}

interface User {
  id: number;
  userName: string;
  userImage: string;
  role: string;
  userId: string;
  password: string;
  defaultStation: string;
  stations: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const [user, setUser] = useState<User | null>(null); 
  const [userRole, setUserRole] = useState<String | null>(null); 

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/auth/check-session", {
          credentials: "include",
        });
        const data = await response.json();
        if (data.isAuthenticated) {
          setUser(data.user);
          setUserRole(data.user.role);
        }
      } catch (error) {
        console.error("Error fetching user session:", error);
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="absolute left-0 top-0 h-screen w-56 bg-gray-900 text-white shadow-lg">
      {/* Header with Close Button */}
      <div className="p-4 flex justify-between items-center border-b border-gray-700">
        <span className="text-lg font-bold">Menu</span>
        <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
          <X size={20} />
        </button>
      </div>

      {/* Menu Items */}
      <ul className="space-y-4 px-6 mt-4">
        
        <Link to={"/"}>
          <li className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded cursor-pointer">
            <Clock size={20} /> Shift View
          </li>
        </Link>
        
        {userRole !== 'Operator' && <>

       

        <Link to={"/factory-overview"}>
          <li className="flex items-center gap-3 p-2 mt-3 hover:bg-gray-700 rounded cursor-pointer">
            <Factory size={20} /> Factory Overview
          </li>
        </Link>

        <Link to={"/dashboards"}>
          <li className="flex items-center gap-3 p-2 mt-3 hover:bg-gray-700 rounded cursor-pointer">
            <LayoutDashboard size={20} /> Dashboards
          </li>
        </Link>

        <Link to={"/reports"}>
          <li className="flex items-center gap-3 p-2 mt-3 hover:bg-gray-700 rounded cursor-pointer">
            <FileText size={20} /> Reports
          </li>
        </Link>
  
          <Link to={"/settings"}>
          <li className="flex items-center gap-3 p-2 mt-3 hover:bg-gray-700 rounded cursor-pointer">
            <Settings size={20} /> Settings
          </li>
        </Link>
  </>
}

        
       
        <Link to={"/logout"}>
          <li className="flex items-center gap-3 p-2 mt-3 hover:bg-red-700 rounded cursor-pointer">
            <LogOut size={20} /> Log Out
          </li>
        </Link>

        {/* User Profile */}
        <Link to={"/settings/profile"}>
          <li className="flex items-center gap-3 p-2 mt-10 hover:bg-green-700 rounded cursor-pointer">
            {user?.userImage ? (
              <img
                src={`https://hrms.waltonbd.com/${user.userImage}`}
                alt="User"
                className="w-10 h-10 rounded-full object-contain border-2 border-white"
              />
            ) : (
              <span className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-700">
                ?
              </span>
            )}
            <span className="font-semibold">{user?.userName || "Profile"}</span>
          </li>
        </Link>


      </ul>
    </div>
  );
};

export default Sidebar;
