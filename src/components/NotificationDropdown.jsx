import React, { useState, useRef, useEffect } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { formatDistanceToNow } from "date-fns";

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "new_order":
        return "🛍️";
      case "payment_received":
        return "💰";
      case "product_out_of_stock":
        return "⚠️";
      case "low_inventory":
        return "📉";
      case "account_verification":
        return "✅";
      default:
        return "📢";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-white/10 relative"
      >
        <Bell size={20} className="text-blue-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <Loader2 className="animate-spin mx-auto h-6 w-6 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Loading notifications...
                </p>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">
                <p className="text-sm">Failed to load notifications</p>
              </div>
            ) : notifications.filter((n) => !n.read).length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No unread notifications
              </div>
            ) : (
              notifications
                .filter((notification) => !notification.read)
                .map((notification) => (
                  <div
                    key={notification._id}
                    className="p-4 border-b border-gray-100 hover:bg-gray-50 bg-blue-50"
                  >
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(
                            new Date(notification.timestamp),
                            {
                              addSuffix: true,
                            }
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
