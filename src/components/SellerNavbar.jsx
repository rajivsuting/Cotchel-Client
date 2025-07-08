import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMenu, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { AiOutlineUser } from "react-icons/ai";
import NotificationDropdown from "./NotificationDropdown";

const SellerNavbar = ({ toggleSidebar }) => {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleDropdownItemClick = () => {
    setIsProfileDropdownOpen(false);
  };

  const handleLogout = () => {
    // Implement logout logic or call context logout
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 w-full bg-[#0c0b45] border-b border-blue-100 flex items-center z-50 h-[70px] shadow-sm">
      <div className="flex items-center w-full px-6 justify-between">
        {/* Left Section - Toggle Button and Logo */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="text-white hover:text-blue-200 transition-colors"
          >
            <FiMenu className="text-2xl" />
          </button>
          <Link to="/seller/dashboard" className="flex items-center">
            <img src="/logo.png" alt="Logo" className="h-8" />
          </Link>
        </div>

        {/* Right Section - Notifications and Profile */}
        <div className="flex items-center space-x-6">
          {/* Notification Dropdown */}
          <div className="text-white">
            <NotificationDropdown />
          </div>

          {/* User Profile Icon */}
          <div className="relative">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center text-white hover:text-blue-200 transition-colors"
            >
              <AiOutlineUser className="text-2xl" />
              {isProfileDropdownOpen ? (
                <FiChevronUp className="ml-1" />
              ) : (
                <FiChevronDown className="ml-1" />
              )}
            </button>

            {/* Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div
                ref={dropdownRef}
                className="absolute right-0 mt-2 w-[200px] bg-white border border-blue-100 rounded-lg shadow-lg"
              >
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  onClick={handleDropdownItemClick}
                >
                  View Profile
                </Link>
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  onClick={handleDropdownItemClick}
                >
                  Settings
                </Link>
                <button
                  className="w-full text-left block px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default SellerNavbar;
