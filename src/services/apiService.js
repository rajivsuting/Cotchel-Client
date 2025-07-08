import axios from "axios";
import { API_BASE_URL } from "../config/api";

// Create axios instance with CSRF token handling
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookies
  timeout: 10000,
});

// Utility function to get CSRF token from cookies
function getCSRFToken() {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="))
    ?.split("=")[1];
}

// Initialize CSRF token on app startup
export const initializeCSRFToken = async () => {
  try {
    console.log("Initializing CSRF token...");
    const response = await api.get("health");
    const token = getCSRFToken();
    console.log("CSRF token initialized:", token ? "success" : "failed");
    return token;
  } catch (error) {
    console.error("Failed to initialize CSRF token:", error);
    // Try one more time with a different endpoint
    try {
      const response = await api.get("auth/me");
      const token = getCSRFToken();
      console.log(
        "CSRF token initialized (retry):",
        token ? "success" : "failed"
      );
      return token;
    } catch (retryError) {
      console.error("Failed to initialize CSRF token (retry):", retryError);
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

function isCsrfIgnored(url = "", method = "get") {
  if (method.toLowerCase() === "get") return true;
  // Normalize url to always start with a slash
  let cleanUrl = url.startsWith("/") ? url : "/" + url;
  // Remove /api prefix if present
  cleanUrl = cleanUrl.replace(/^\/api/, "");
  // Check if the path matches any ignored endpoint
  return CSRF_IGNORED_ENDPOINTS.some((ep) => cleanUrl.startsWith(ep));
}

// Request interceptor to add CSRF token
api.interceptors.request.use(
  async (config) => {
    let csrfToken = getCSRFToken();
    const method = config.method || "get";
    const url = config.url || "";

    // Only add CSRF token if not in ignore list
    if (!isCsrfIgnored(url, method)) {
      // Always ensure a valid CSRF token before any state-changing request
      if (!csrfToken) {
        try {
          await initializeCSRFToken();
          csrfToken = getCSRFToken();
        } catch (error) {
          // Ignore error, will fail gracefully
        }
      }
      if (csrfToken) {
        console.log("Setting X-CSRF-Token header:", csrfToken);
        config.headers["X-CSRF-Token"] = csrfToken;
      } else {
        console.warn("No CSRF token found, not setting X-CSRF-Token header");
      }
    }

    // Add request ID for tracking (only in development)
    if (import.meta.env.DEV || config.baseURL?.includes("localhost")) {
      config.headers["X-Request-ID"] = generateRequestId();
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle CSRF errors and rate limiting
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (
      error.response?.status === 403 &&
      error.response?.data?.error === "Invalid or missing CSRF token"
    ) {
      console.log("CSRF token error, attempting to refresh...");
      // Try to refresh CSRF token by making a GET request
      try {
        // Use a simple endpoint that doesn't require authentication
        await api.get("health");
        console.log("CSRF token refreshed successfully");
        // Retry the original request once with the new token
        const config = error.config;
        const csrfToken = getCSRFToken();
        if (csrfToken) {
          config.headers["X-CSRF-Token"] = csrfToken;
          console.log("Retrying request with new CSRF token");
          // Prevent infinite retry loop
          if (!config._retry) {
            config._retry = true;
            return api(config);
          }
        }
      } catch (e) {
        console.error("Failed to refresh CSRF token:", e);
        // Instead of reloading, just reject the error
        return Promise.reject(error);
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 429) {
      // Rate limiting error
      const retryAfter = error.response.headers.get("Retry-After");
      console.warn(`Rate limited. Retry after ${retryAfter} seconds`);

      // Show user-friendly message
      if (typeof window !== "undefined") {
        alert("Too many requests. Please wait a moment and try again.");
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// Generate unique request ID
function generateRequestId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// Enhanced error handling
export const handleApiError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
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
    // The request was made but no response was received
    return "No response from server. Please check your connection.";
  } else {
    // Something happened in setting up the request that triggered an Error
    return error.message || "An error occurred.";
  }
};

// API request wrapper with error handling
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

// Convenience methods for common HTTP methods
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

// Rate limit checking utility
export const checkRateLimit = (response) => {
  const remaining = response.headers.get("X-RateLimit-Remaining");
  const reset = response.headers.get("X-RateLimit-Reset");

  if (remaining !== null) {
    console.log(`Remaining requests: ${remaining}`);
    if (reset) {
      console.log(`Reset time: ${new Date(reset * 1000)}`);
    }
  }

  return { remaining, reset };
};

export default api;
