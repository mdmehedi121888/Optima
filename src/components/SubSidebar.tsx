import { AlignLeft, User, UsersRound, AlertTriangle, Gauge, Trash2, MapPin, LaptopMinimal, Package, Calendar } from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router-dom";

interface SettingItem {
  icon: React.ReactNode;
  title: string;
  link: string;
}

const settings: SettingItem[] = [
  { icon: <User size={24} className="text-yellow-500" />, title: "Profile", link: "/settings/profile" },
  { icon: <UsersRound size={24} className="text-yellow-500" />, title: "Users", link: "/settings/users" },
  { icon: <UsersRound size={24} className="text-green-500" />, title: "Operators", link: "/settings/operators" },
  { icon: <AlertTriangle size={24} className="text-red-500" />, title: "Stop Reasons", link: "/settings/stop-reasons" },
  { icon: <Gauge size={24} className="text-yellow-500" />, title: "Speed Loss Reasons", link: "/settings/speed-loss-reasons" },
  { icon: <Trash2 size={24} className="text-orange-500" />, title: "Scrap Reasons", link: "/settings/scrap-reasons" },
  { icon: <MapPin size={24} className="text-red-500" />, title: "Locations", link: "/settings/locations" },
  { icon: <LaptopMinimal size={24} className="text-blue-500" />, title: "Stations", link: "/settings/stations" },
  { icon: <Package size={24} className="text-black" />, title: "Products", link: "/settings/products" },
  { icon: <Calendar size={24} className="text-black" />, title: "Shifts", link: "/settings/shifts" },
];

export default function SubSidebar() {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  return (
    <div className={`bg-white shadow-md h-full  rounded-lg p-4 transition-all duration-300 ${isOpen ? "w-64" : "w-16"}`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className={`text-2xl font-bold ${!isOpen && "hidden"}`}>Settings</h1>
        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700 hover:text-gray-900">
          <AlignLeft size={24} />
        </button>
      </div>

      <ul className="space-y-2">
        {settings.map((setting, index) => (
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
