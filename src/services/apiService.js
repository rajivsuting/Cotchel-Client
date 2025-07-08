import axios from "axios";
import { API_BASE_URL } from "../config/api";

// Create axios instance with CSRF token handling
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cross-origin cookies
  timeout: 10000,
});

// Utility: Get CSRF token from cookies
function getCSRFToken() {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="))
    ?.split("=")[1];
}

// Initialize CSRF token on app startup or post-login
export const initializeCSRFToken = async () => {
  try {
    console.log("[CSRF] Initializing...");
    await api.get("/health");
    const token = getCSRFToken();
    console.log("[CSRF] Initialized:", token ? "success" : "failed");
    return token;
  } catch (error) {
    console.error("[CSRF] Init failed on /health, retrying on /auth/me...");
    try {
      await api.get("/auth/me");
      const token = getCSRFToken();
      console.log("[CSRF] Initialized (retry):", token ? "success" : "failed");
      return token;
    } catch (retryError) {
      console.error("[CSRF] Init failed (retry):", retryError);
      return null;
    }
  }
};

// List of endpoints that should NOT have CSRF token attached
const CSRF_IGNORED_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/verify-email",
  "/auth/resend-otp",
  "/auth/request-reset",
  "/auth/reset-password",
  "/razorpay/webhook",
  "/shiprocket/webhook",
  "/health",
  "/image/upload",
  "/image/upload-file",
];

// Utility: Check if CSRF should be ignored
function isCsrfIgnored(url = "", method = "get") {
  if (method.toLowerCase() === "get") return true;
  let cleanUrl = url.startsWith("/") ? url : "/" + url;
  cleanUrl = cleanUrl.replace(/^\/api/, "");
  return CSRF_IGNORED_ENDPOINTS.some((ep) => cleanUrl.startsWith(ep));
}

// Generate unique request ID for tracking
function generateRequestId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// Request interceptor to attach CSRF token and tracking headers
api.interceptors.request.use(
  async (config) => {
    const method = config.method || "get";
    const url = config.url || "";

    if (!isCsrfIgnored(url, method)) {
      let csrfToken = getCSRFToken();
      if (csrfToken) {
        config.headers["X-XSRF-TOKEN"] = csrfToken;
        console.log("[CSRF] Token added:", csrfToken);
      } else {
        console.warn(
          "[CSRF] No token found, calling /health to reinitialize..."
        );
        await api.get("/health");
        const newToken = getCSRFToken();
        if (newToken) {
          config.headers["X-XSRF-TOKEN"] = newToken;
          console.log("[CSRF] Token added after refresh:", newToken);
        } else {
          console.error("[CSRF] Token still missing after refresh.");
        }
      }
    }

    // Attach request ID for tracking
    if (import.meta.env.DEV || config.baseURL?.includes("localhost")) {
      config.headers["X-Request-ID"] = generateRequestId();
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for CSRF error handling and rate limit awareness
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response } = error;

    if (
      response?.status === 403 &&
      response?.data?.error === "Invalid or missing CSRF token"
    ) {
      console.log("[CSRF] Invalid token detected, refreshing...");
      try {
        await api.get("/health");
        const csrfToken = getCSRFToken();
        if (csrfToken && !error.config._retry) {
          error.config._retry = true;
          error.config.headers["X-XSRF-TOKEN"] = csrfToken;
          console.log("[CSRF] Retrying request with refreshed token");
          return api(error.config);
        }
      } catch (refreshError) {
        console.error("[CSRF] Refresh failed:", refreshError);
      }
      return Promise.reject(error);
    }

    if (response?.status === 429) {
      const retryAfter = response.headers["retry-after"];
      console.warn(`[Rate Limit] Hit. Retry after ${retryAfter} seconds.`);
      if (typeof window !== "undefined") {
        alert("Too many requests. Please wait a moment and try again.");
      }
    }

    return Promise.reject(error);
  }
);

// Enhanced error handler for UI-friendly error messages
export const handleApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    switch (status) {
      case 400:
        return data.message || "Bad request. Please check your input.";
      case 401:
        return "Authentication required. Please log in.";
      case 403:
        if (data.error === "Invalid or missing CSRF token") {
          return "Session expired. Please refresh the page.";
        }
        return data.message || "Access denied.";
      case 404:
        return data.message || "Resource not found.";
      case 429:
        return "Too many requests. Please wait a moment and try again.";
      case 500:
        return "Server error. Please try again later.";
      default:
        return data.message || "An error occurred.";
    }
  } else if (error.request) {
    return "No response from server. Please check your connection.";
  } else {
    return error.message || "An error occurred.";
  }
};

// Generalized request wrapper with consistent response
export const apiRequest = async (config) => {
  try {
    const response = await api(config);
    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = handleApiError(error);
    return {
      success: false,
      error: errorMessage,
      status: error.response?.status,
    };
  }
};

// Convenience HTTP methods
export const apiGet = (url, config = {}) =>
  apiRequest({ method: "GET", url, ...config });
export const apiPost = (url, data = {}, config = {}) =>
  apiRequest({ method: "POST", url, data, ...config });
export const apiPut = (url, data = {}, config = {}) =>
  apiRequest({ method: "PUT", url, data, ...config });
export const apiDelete = (url, config = {}) =>
  apiRequest({ method: "DELETE", url, ...config });
export const apiPatch = (url, data = {}, config = {}) =>
  apiRequest({ method: "PATCH", url, data, ...config });

// Health check utility
export const checkServerHealth = async () => {
  try {
    const response = await api.get("/health");
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

// Rate limit header utility for monitoring
export const checkRateLimit = (response) => {
  const remaining = response.headers["x-ratelimit-remaining"];
  const reset = response.headers["x-ratelimit-reset"];
  if (remaining !== undefined) {
    console.log(`[Rate Limit] Remaining: ${remaining}`);
    if (reset) {
      console.log(`[Rate Limit] Reset at: ${new Date(reset * 1000)}`);
    }
  }
  return { remaining, reset };
};

export default api;
