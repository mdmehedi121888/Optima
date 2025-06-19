import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import HandleSidebar from "./HandleSidebar";
import SubSidebar from "./SubSidebar";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSubSidebarOpen, setIsSubSidebarOpen] = useState(true);

  return (
    <div className="flex">
      {isSidebarOpen && <HandleSidebar />}
      <div className="mt-5 pt-4 pr-4 transition-all duration-300">
        {isSubSidebarOpen && <SubSidebar />}
      </div>
      <div className="flex-1">
        <Outlet /> {/* This renders nested routes */}
      </div>
    </div>
  );
};

export default Layout;
