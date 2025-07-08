import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiUser,
  FiShoppingBag,
  FiHeart,
  FiMapPin,
  FiSettings,
  FiLogOut,
  FiUserPlus,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { API, API_CONFIG, handleApiError } from "../config/api";
import api from "../services/apiService";

const BuyerSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, checkAuth } = useAuth();
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState([]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSwitchToSeller = async () => {
    setSwitching(true);
    setError("");
    try {
      // Check if user is verified as seller
      if (!user?.isVerifiedSeller) {
        setError(
          "You need to be verified as a seller first. Please contact support."
        );
        setSwitching(false);
        return;
      }
      // Make the PUT request - CSRF token will be handled by interceptor
      const response = await api.put(API.USER.UPDATE_ROLE, { role: "Seller" });
      // Refresh auth context to get updated user data
      await checkAuth();
      // Only navigate after everything is done
      navigate("/seller/dashboard");
    } catch (err) {
      console.error("Role switch error:", err);
      if (err.response?.status === 403) {
        setError(
          "Authentication issue. Please refresh the page and try again."
        );
      } else {
        setError(handleApiError(err));
      }
    } finally {
      setSwitching(false);
    }
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      const response = await api.get(API.NOTIFICATIONS.SELLER);
      setNotifications(response.data.notifications);
    };
    fetchNotifications();
  }, []);

  const menuItems = [
    {
      title: "Profile",
      icon: <FiUser className="w-5 h-5" />,
      path: "/buyer/profile",
    },
    {
      title: "Order History",
      icon: <FiShoppingBag className="w-5 h-5" />,
      path: "/buyer/orders",
    },
    {
      title: "Wishlist",
      icon: <FiHeart className="w-5 h-5" />,
      path: "/buyer/wishlist",
    },
    {
      title: "Manage Address",
      icon: <FiMapPin className="w-5 h-5" />,
      path: "/buyer/manage-address",
    },
    // {
    //   title: "Settings",
    //   icon: <FiSettings className="w-5 h-5" />,
    //   path: "/buyer/settings",
    // },
  ];

  return (
    <div className="hidden md:flex bg-white rounded-xl shadow-sm h-[calc(100vh-200px)] overflow-y-auto sticky top-40 flex-col">
      {/* User Welcome Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[#0D0B46]/10 rounded-full flex items-center justify-center flex-shrink-0">
            <FiUser className="w-6 h-6 text-[#0D0B46]" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">Welcome</p>
            <h2 className="text-lg font-semibold text-gray-800">
              {user?.fullName || user?.name || "User"}
            </h2>
          </div>
        </div>
      </div>

      {/* Switch to Seller Section */}
      {user?.isVerifiedSeller && (
        <div className="px-6 py-4 border-b border-gray-100">
          <button
            onClick={handleSwitchToSeller}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0D0B46] text-white rounded-lg hover:bg-[#0D0B46]/90 transition-colors disabled:opacity-60"
            disabled={switching}
          >
            <FiUserPlus className="w-4 h-4" />
            <span className="text-sm font-medium">
              {switching ? "Switching..." : "Switch to Seller"}
            </span>
          </button>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>
      )}

      {/* Menu Items */}
      <div className="flex-1 p-4">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-[#0D0B46] hover:bg-[#0D0B46]/5 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? "bg-[#0D0B46]/5 text-[#0D0B46] font-medium"
                  : ""
              }`}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.title}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-100 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <FiLogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default BuyerSidebar;
