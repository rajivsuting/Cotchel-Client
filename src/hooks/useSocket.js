/**
 * React Hook for Socket.IO Real-time Updates
 *
 * Replaces polling with WebSocket push updates
 */

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_API_URL ||
  "https://starfish-app-6q6ot.ondigitalocean.app";

let socket = null;

/**
 * Get or create socket instance
 */
function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  }
  return socket;
}

/**
 * Hook to listen for order updates (for OrderDetails page)
 */
export function useOrderSocket(orderId, onUpdate) {
  const socket = getSocket();
  const orderIdRef = useRef(orderId);

  useEffect(() => {
    if (!orderId) return;

    // Join order room
    socket.emit("joinOrderRoom", orderId);
    console.log(`🔌 Joined order room: ${orderId}`);

    // Listen for updates
    socket.on("orderUpdated", onUpdate);

    // Cleanup
    return () => {
      socket.emit("leaveOrderRoom", orderId);
      socket.off("orderUpdated", onUpdate);
      console.log(`🔌 Left order room: ${orderId}`);
    };
  }, [orderId, onUpdate]);
}

/**
 * Hook to listen for orders list updates (for OrderHistory/Orders page)
 */
export function useOrdersListSocket(userId, userType, onUpdate) {
  const socket = getSocket();

  useEffect(() => {
    if (!userId || !userType) return;

    // Join orders list room
    socket.emit("joinOrdersListRoom", userId, userType);
    console.log(`🔌 Joined ${userType} orders list room: ${userId}`);

    // Listen for updates
    socket.on("ordersListUpdated", onUpdate);

    // Cleanup
    return () => {
      socket.off("ordersListUpdated", onUpdate);
      console.log(`🔌 Left ${userType} orders list room`);
    };
  }, [userId, userType, onUpdate]);
}

/**
 * Hook to listen for user notifications
 */
export function useNotificationSocket(userId, onNotification) {
  const socket = getSocket();

  useEffect(() => {
    if (!userId) return;

    // Join user room
    socket.emit("joinUserRoom", userId);
    console.log(`🔌 Joined user notification room: ${userId}`);

    // Listen for notifications
    socket.on("notification", onNotification);

    // Cleanup
    return () => {
      socket.off("notification", onNotification);
      console.log(`🔌 Left user notification room`);
    };
  }, [userId, onNotification]);
}

/**
 * Disconnect socket (call on logout)
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default {
  useOrderSocket,
  useOrdersListSocket,
  useNotificationSocket,
  disconnectSocket,
};
