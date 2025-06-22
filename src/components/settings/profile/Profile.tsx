import { useEffect, useState } from "react";
import { MapPin, Shield, IdCard, UsersRound } from "lucide-react";
import {UserType } from "../../../context/AuthContext";


export default function Profile() {
   const [user, setUser] = useState<UserType | null>(null);
  
    useEffect(() => {
      const fetchUser = async () => {
        try {
          const response = await fetch('http://localhost:5000/api/auth/check-session', {
            credentials: 'include',
          });
          const data = await response.json();
          if (data.isAuthenticated) {
            setUser(data.user as UserType);
          }
        } catch (error) {
          console.error('Error fetching user session:', error);
        }
      };
  
      fetchUser();
    }, []);


const creator =  user?.userId;
const userName = user?.userName;
const userId = user?.userId;
const userImage = user?.userImage;
const userRole = user?.role;
const userDefaultStation = user?.defaultStation;
const userStations = user?.stations;
 

  if (!creator) {
    return (
      <div className="flex items-center justify-center h-screen text-xl font-semibold">
        Loading Profile...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="flex flex-1 justify-center items-center p-6">
        {/* Profile Card */}
        <div className="relative w-full max-w-lg bg-gradient-to-br from-[#1e1e2e] to-[#28293d] backdrop-blur-md border border-white/20 shadow-2xl rounded-3xl p-8 text-white">
          {/* Profile Image */}
          <div className="flex justify-center -mt-16">
            <img
              src={`https://hrms.waltonbd.com/${userImage}`}
              alt="User"
              className="w-36 h-36 rounded-full border-4 border-purple-500 shadow-lg object-content"
            />
          </div>

          {/* User Info */}
          <div className="text-center mt-6">
            <h2 className="text-3xl font-bold tracking-wide">{userName}</h2>
            <p className="text-lg text-gray-300">{userId}</p>
          </div>

          {/* Details Section */}
          <div className="mt-6 space-y-5">
            <div className="flex items-center space-x-3 bg-gray-900/40 p-4 rounded-lg shadow-md">
              <Shield className="text-yellow-400" size={26} />
              <span className="text-xl font-semibold">{userRole}</span>
            </div>

            <div className="flex items-center space-x-3 bg-gray-900/40 p-4 rounded-lg shadow-md">
              <IdCard className="text-blue-400" size={26} />
              <span className="text-xl font-semibold">ID: {userId}</span>
            </div>

            <div className="flex items-center space-x-3 bg-gray-900/40 p-4 rounded-lg shadow-md">
              <MapPin className="text-green-400" size={26} />
              <span className="text-xl font-semibold">
                Default Station: {userDefaultStation || "N/A"}
              </span>
            </div>

            <div className="flex items-center space-x-3 bg-gray-900/40 p-4 rounded-lg shadow-md">
              <UsersRound className="text-red-400" size={26} />
              <span className="text-xl font-semibold">
                Stations: { userStations|| "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
