import { useNavigate } from "react-router-dom";
import {
  User,
  Users,
  AlertTriangle,
  Gauge,
  Trash2,
  Package,
  AlignJustify,
  LaptopMinimal,
  UsersRound,
  Calendar,
  MapPin,
} from "lucide-react";
import Sidebar from "../../components/common/Sidebar";
import { useState } from "react";

export interface SettingItem {
  icon: React.ReactNode;
  title: string;
  description?: string;
  link: string;
}

export const settings: SettingItem[] = [
  {
    icon: <User size={24} className="text-yellow-500" />, 
    title: "Hi, User",
    description: "Manage your basic information — name, profile picture.",
    link: "/settings/profile",
  },
  {
    icon: <Users size={24} className="text-green-500" />,
    title: "Users",
    description: "Control who has access to Evocon in your company and what rights they should have.",
    link: "/settings/users",
  },
  {
    icon: <UsersRound size={24} className="text-green-500" />,
    title: "Operators",
    description: "Manage the names of your operators and the stations where they are working.",
    link: "/settings/operators",
  },
  {
    icon: <AlertTriangle size={24} className="text-red-500" />,
    title: "Stop reasons",
    description: "Manage reasons that operators use to comment on production downtime.",
    link: "/settings/stop-reasons",
  },
  {
    icon: <Gauge size={24} className="text-yellow-500" />,
    title: "Speed loss reasons",
    description: "Manage reasons that operators use to comment on speed loss.",
    link: "/settings/speed-loss-reasons",
  },
  {
    icon: <Trash2 size={24} className="text-orange-500" />,
    title: "Scrap reasons",
    description: "Manage reasons that operators use to comment on quality loss.",
    link: "/settings/scrap-reasons",
  },
  {
    icon: <MapPin size={24} className="text-red-500" />,
    title: "Locations",
    description: "Use locations to get more insight into production downtime.",
    link: "/settings/locations",
  },
  {
    icon: <LaptopMinimal size={24} className="text-blue-500" />,
    title: "Stations",
    description: "Adjust station settings, like OEE targets, notification emails & empty shift reason.",
    link: "/settings/stations",
  },
  {
    icon: <Package size={24} className="text-black" />,
    title: "Products",
    description: "View and manage all the products and their settings produced in your company.",
    link: "/settings/products",
  },
  {
    icon: <Calendar size={24} className="text-black" />,
    title: "Shifts",
    description: "Define the work schedule of each station in your factory.",
    link: "/settings/shifts",
  },
];

export default function Settings() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#DEF1EF] p-6">
      {/* Sidebar Toggle */}
      {!sidebarOpen && (
        <AlignJustify
          className="cursor-pointer ml-2 mb-4 text-gray-700 hover:text-gray-900"
          onClick={() => setSidebarOpen(true)}
        />
      )}

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="absolute left-0 top-0 z-50">
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-16 max-w-[90rem]">
        {settings.map((setting, index) => (
          <div
            key={index}
            className="flex items-start p-5 w-full bg-white shadow-lg rounded-xl cursor-pointer border border-gray-200 
                      hover:shadow-xl hover:scale-105 transition transform duration-300 hover:bg-gray-50"
            onClick={() => navigate(setting.link)}
          >
            <div className="mr-4 p-3 bg-gray-100 rounded-full">{setting.icon}</div>
            <div>
              <h3 className="text-xl text-left font-bold text-gray-800">{setting.title} &gt;</h3>
              <p className="text-lg text-left text-gray-500 mt-1">{setting.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
