import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaCircleUser, FaChevronRight } from "react-icons/fa6";
import {
  AiOutlineDashboard,
  AiOutlineOrderedList,
  AiOutlineShop,
  AiOutlineDollar,
  AiOutlineSetting,
  AiOutlineLogout,
  AiOutlineBell,
} from "react-icons/ai";
import { BsChevronDown, BsChevronUp } from "react-icons/bs";
import { MdOutlineSupportAgent } from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import api from "../services/apiService";
import { API, API_CONFIG, handleApiError } from "../config/api";

const SellerSidebar = ({ isCollapsed, toggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, checkAuth } = useAuth();
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState([]);

  const isActive = (path) => location.pathname === path;

  const switchToBuyerHandler = async () => {
    setSwitching(true);
    setError("");
    try {
      console.log("Switching to buyer role...");
      console.log("Current user:", user);

      const response = await api.put(API.USER.UPDATE_ROLE, { role: "Buyer" });
      console.log("Role update response:", response.data);

      // Refresh auth context to get updated user data
      await checkAuth();

      console.log("Navigating to buyer profile...");
      navigate("/buyer/profile");
    } catch (err) {
      console.error("Error switching to buyer:", err);
      setError(handleApiError(err));
    } finally {
      setSwitching(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get(API.NOTIFICATIONS.SELLER);
        // Robustly extract notifications from various possible response structures
        const notificationsData =
          response.data?.notifications ||
          response.data?.data?.notifications ||
          response.data?.data ||
          response.data ||
          [];
        console.log("Fetched notifications:", notificationsData);
        setNotifications(
          Array.isArray(notificationsData) ? notificationsData : []
        );
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        setNotifications([]); // Set empty array on error
      }
    };
    fetchNotifications();
  }, []);

  // Calculate unread count from notifications
  const unreadCount = notifications.filter(
    (notification) =>
      notification && typeof notification === "object" && !notification.read
  ).length;
  console.log("Unread count:", unreadCount);

  return (
    <div
      className={`fixed left-0 top-0 h-screen z-20 ${
        isCollapsed ? "w-16" : "w-64"
      } bg-[#0c0b45] text-gray-300 flex flex-col transition-all duration-300`}
    >
      {/* Fixed Profile Section */}
      <div className="flex-none">
        <div className="w-[85.76%] mx-auto py-4 flex items-center relative">
          {!isCollapsed && (
            <div className="w-12 h-12 rounded-full bg-[#1d1c5e] flex items-center justify-center">
              <FaCircleUser className="text-2xl text-white" />
            </div>
          )}

          {user && !isCollapsed && (
            <div className="ml-3">
              <h2 className="text-xs text-gray-400 font-medium">
                Welcome back,
              </h2>
              <p className="text-sm text-white font-semibold truncate max-w-[140px]">
                {user.fullName || user.name || "Seller"}
              </p>
            </div>
          )}
        </div>

        {/* Fixed Switch Button */}
        <div className="w-[85.76%] mx-auto mb-4">
          <button
            onClick={switchToBuyerHandler}
            className="w-full rounded-[5px] px-4 py-2 text-center text-white bg-[#1d1c5e] hover:bg-[#2a2970] transition-colors duration-200 text-sm font-medium disabled:opacity-60"
            disabled={switching}
          >
            {switching ? "Switching..." : "Switch to Buyer"}
          </button>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>
        <hr className="border-[#1d1c5e]" />
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        <nav className="text-sm mt-4 w-[85.76%] mx-auto">
          {/* Dashboard */}
          <Link
            to="/seller/dashboard"
            className={`flex items-center gap-2 px-3 h-10 hover:bg-[#1d1c5e] rounded-md ${
              isActive("/seller/dashboard")
                ? "bg-[#1d1c5e] text-white"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <AiOutlineDashboard className="text-xl" />
            {!isCollapsed && "Dashboard"}
          </Link>

          {/* Orders Section */}
          <div className="mt-4">
            <h3
              className={`px-3 text-xs font-semibold text-gray-400 ${
                isCollapsed ? "hidden" : ""
              }`}
            >
              ORDERS
            </h3>
            <Link
              to="/seller/dashboard/orders"
              className={`flex items-center gap-2 px-3 h-10 mt-2 hover:bg-[#1d1c5e] rounded-md ${
                isActive("/seller/dashboard/orders")
                  ? "bg-[#1d1c5e] text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              <AiOutlineOrderedList className="text-xl" />
              {!isCollapsed && "All Orders"}
            </Link>
          </div>

          {/* Products Section */}
          <div className="mt-4">
            <h3
              className={`px-3 text-xs font-semibold text-gray-400 ${
                isCollapsed ? "hidden" : ""
              }`}
            >
              PRODUCTS
            </h3>
            <div>
              <button
                className={`w-full flex items-center justify-between gap-2 px-3 h-10 mt-2 hover:bg-[#1d1c5e] rounded-md focus:outline-none ${
                  isAccordionOpen
                    ? "bg-[#1d1c5e] text-white"
                    : "text-gray-300 hover:text-white"
                }`}
                onClick={() => setIsAccordionOpen(!isAccordionOpen)}
              >
                <div className="flex items-center gap-2">
                  <AiOutlineShop className="text-xl" />
                  {!isCollapsed && "Manage Products"}
                </div>
                {!isCollapsed && (
                  <span>
                    {isAccordionOpen ? (
                      <BsChevronUp className="text-sm" />
                    ) : (
                      <BsChevronDown className="text-sm" />
                    )}
                  </span>
                )}
              </button>
              {isAccordionOpen && !isCollapsed && (
                <div className="pl-6">
                  <Link
                    to="/seller/dashboard/products"
                    className={`flex items-center gap-2 px-3 h-10 mt-2 hover:bg-[#1d1c5e] rounded-md ${
                      isActive("/seller/dashboard/products")
                        ? "text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <FaChevronRight /> All Products
                  </Link>
                  <Link
                    to="/seller/dashboard/products/add"
                    className={`flex items-center gap-2 px-3 h-10 mt-2 hover:bg-[#1d1c5e] rounded-md ${
                      isActive("/seller/dashboard/products/add")
                        ? "text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <FaChevronRight /> Add Product
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Analytics Section */}
          <div className="mt-4">
            <h3
              className={`px-3 text-xs font-semibold text-gray-400 ${
                isCollapsed ? "hidden" : ""
              }`}
            >
              ANALYTICS
            </h3>
            <Link
              to="/seller/dashboard/earnings"
              className={`flex items-center gap-2 px-3 h-10 mt-2 hover:bg-[#1d1c5e] rounded-md ${
                isActive("/seller/dashboard/earnings")
                  ? "bg-[#1d1c5e] text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              <AiOutlineDollar className="text-xl" />
              {!isCollapsed && "Earnings"}
            </Link>
          </div>

          {/* Support Section */}
          <div className="mt-4">
            <h3
              className={`px-3 text-xs font-semibold text-gray-400 ${
                isCollapsed ? "hidden" : ""
              }`}
            >
              SUPPORT
            </h3>
            <Link
              to="/seller/dashboard/customer-support"
              className={`flex items-center gap-2 px-3 h-10 mt-2 hover:bg-[#1d1c5e] rounded-md ${
                isActive("/seller/dashboard/customer-support")
                  ? "bg-[#1d1c5e] text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              <MdOutlineSupportAgent className="text-xl" />
              {!isCollapsed && "Customer Support"}
            </Link>
            <Link
              to="/seller/dashboard/notifications"
              className={`flex items-center gap-2 px-3 h-10 mt-2 hover:bg-[#1d1c5e] rounded-md ${
                isActive("/seller/dashboard/notifications")
                  ? "bg-[#1d1c5e] text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              <div className="relative">
                <AiOutlineBell className="text-xl" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
              )}
            </Link>
          </div>
        </nav>
      </div>

      {/* Fixed Bottom Section */}
      <div className="flex-none">
        {/* Settings */}
        <div className="px-2">
          <Link
            to="/seller/dashboard/settings"
            className={`flex items-center gap-2 px-3 h-10 hover:bg-[#1d1c5e] rounded-md ${
              isActive("/seller/dashboard/settings")
                ? "bg-[#1d1c5e] text-white"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <AiOutlineSetting className="text-xl" />
            {!isCollapsed && "Settings"}
          </Link>
        </div>

        {/* Logout */}
        <div className="p-2 border-t border-[#1d1c5e]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center text-left gap-2 px-3 py-2 text-red-400 hover:bg-[#1d1c5e] hover:text-red-300 rounded-md transition-colors duration-200"
          >
            <AiOutlineLogout className="text-xl" />
            {!isCollapsed && "Logout"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellerSidebar;
