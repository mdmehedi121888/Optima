import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { AlignJustify } from "lucide-react";

export default function HandleSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  return (
    <div className="bg-black text-white pr-5">
      {/* Sidebar Toggle */}
      {!sidebarOpen && (
        <AlignJustify
          className="cursor-pointer ml-4 mt-5 mb-4 text-white hover:text-gray-500"
          onClick={() => setSidebarOpen(true)}
        />
      )}

      {/* Sidebar with animation */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-gray-900 shadow-lg transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
    </div>
  );
}
