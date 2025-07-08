import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import SellerNavbar from "../components/SellerNavbar";
import SellerSidebar from "../components/SellerSidebar";

const SellerDashboardLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-[#0c0b45] transition-all duration-300 z-50 ${
          isSidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        <SellerSidebar
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={toggleSidebar}
        />
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          isSidebarCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        {/* Navbar */}
        <div className="fixed top-0 right-0 left-0 z-40">
          <SellerNavbar toggleSidebar={toggleSidebar} />
        </div>

        {/* Page Content */}
        <main className="pt-[90px] min-h-screen p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SellerDashboardLayout;
