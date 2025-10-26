import { Link, useLocation } from "react-router-dom";
import { FaUser, FaShoppingBag, FaHeart, FaHome } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import api from "../services/apiService";
import { API, handleApiError } from "../config/api";
import { useState } from "react";

const navItems = [
  { label: "Home", icon: <FaHome />, path: "/" },
  { label: "Orders", icon: <FaShoppingBag />, path: "/buyer/orders" },
  { label: "Wishlist", icon: <FaHeart />, path: "/buyer/wishlist" },
  { label: "Profile", icon: <FaUser />, path: "/buyer/profile" },
];

const BuyerBottomNav = () => {
  const location = useLocation();

  // Safety check for useAuth
  const authContext = useAuth();
  if (!authContext) {
    return null; // Don't render if context is not available
  }

  const { user, checkAuth } = authContext;
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState("");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg md:hidden">
      <div className="flex justify-around items-center py-1.5 px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center px-2 py-1 rounded-lg transition-all duration-200 relative ${
                isActive
                  ? "text-[#0D0B46] bg-[#0D0B46]/5"
                  : "text-gray-500 hover:text-[#0D0B46] hover:bg-gray-50"
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#0D0B46] rounded-full"></div>
              )}

              <span
                className={`text-lg mb-0.5 transition-all duration-200 ${
                  isActive ? "scale-110" : "scale-100"
                }`}
              >
                {item.icon}
              </span>
              <span
                className={`text-[11px] font-medium transition-all duration-200 ${
                  isActive ? "font-semibold" : "font-medium"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BuyerBottomNav;
