import React, { createContext, useContext, useState, useEffect } from "react";
import io from "socket.io-client";
import { API, API_BASE_URL } from "../config/api";
import { useAuth } from "./AuthContext";
import api from "../services/apiService";

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use BASE_URL for socket connection
  const socket = io(API_BASE_URL.replace(/\/api$/, ""), {
    withCredentials: true,
  });

  // Socket connection status logging
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
    };
  }, []);

  const fetchNotifications = async (page = 1) => {
    if (!user || user.role !== "Seller") return;

    setLoading(true);
    setError(null);
    try {
      console.log("Fetching notifications for user:", user._id, "page:", page);
      const response = await api.get(
        `${API.NOTIFICATIONS.SELLER}?page=${page}&limit=10`
      );

      console.log("Notifications response:", response.data);

      if (response.data.success && response.data.data) {
        const { notifications: fetchedNotifications } = response.data.data;
        console.log("Fetched notifications:", fetchedNotifications);

        if (Array.isArray(fetchedNotifications)) {
          if (page === 1) {
            // Set all notifications from the server for first page
            setNotifications(fetchedNotifications);
          } else {
            // Append new notifications to existing list
            setNotifications((prev) => [...prev, ...fetchedNotifications]);
          }
          // Update unread count only for first page
          if (page === 1) {
            const unread = fetchedNotifications.filter((n) => !n.read).length;
            setUnreadCount(unread);
          }
          return response.data.data;
        } else {
          console.error(
            "Fetched notifications is not an array:",
            fetchedNotifications
          );
          setError("Invalid notifications data received from server");
        }
      } else {
        console.error("Invalid response structure:", response.data);
        setError("Invalid response from server");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    if (!user) return;

    try {
      console.log("Marking notification as read:", notificationId);
      console.log(
        "API endpoint:",
        API.NOTIFICATIONS.MARK_AS_READ(notificationId)
      );

      const response = await api.patch(
        API.NOTIFICATIONS.MARK_AS_READ(notificationId),
        {}
      );

      console.log("Mark as read response:", response);

      if (response.data.success) {
        console.log(
          "Successfully marked notification as read, updating local state"
        );
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) =>
            notification._id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        console.log("Local state updated successfully");
      } else {
        console.error("Mark as read failed:", response.data);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      console.error("Error details:", error.response?.data);
      setError(error.message);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      console.log("Marking all notifications as read");
      console.log("API endpoint:", API.NOTIFICATIONS.MARK_ALL_AS_READ);

      const response = await api.patch(API.NOTIFICATIONS.MARK_ALL_AS_READ, {});

      console.log("Mark all as read response:", response);

      if (response.data.success) {
        console.log(
          "Successfully marked all notifications as read, updating local state"
        );
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) => ({
            ...notification,
            read: true,
          }))
        );
        setUnreadCount(0);
        console.log("Local state updated successfully");
      } else {
        console.error("Mark all as read failed:", response.data);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      console.error("Error details:", error.response?.data);
      setError(error.message);
    }
  };

  useEffect(() => {
    if (user) {
      console.log("User authenticated, setting up notifications:", user._id);

      // Initial fetch
      fetchNotifications();

      // Join seller room
      socket.emit("joinSellerRoom", user._id);
      console.log("Joined seller room:", user._id);

      // Listen for new notifications
      socket.on("newNotification", (notification) => {
        console.log("Received new notification:", notification);
        setNotifications((prev) => {
          // Check if notification already exists
          const exists = prev.some((n) => n._id === notification._id);
          if (exists) return prev;
          // Add new notification at the beginning
          return [notification, ...prev];
        });
        setUnreadCount((prev) => prev + 1);
      });

      // Cleanup
      return () => {
        console.log("Cleaning up socket listeners");
        socket.off("newNotification");
      };
    }
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
