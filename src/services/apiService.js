import axios from "axios";
import { API_BASE_URL } from "../config/api";

// ✅ Create axios instance with automatic CSRF handling
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Necessary for cross-origin cookies
  timeout: 10000,
  xsrfCookieName: "XSRF-TOKEN", // Automatically reads this cookie
  xsrfHeaderName: "X-CSRF-Token", // Changed to match backend expectation
});

// Custom CSRF token getter that checks both cookies and localStorage
const getCSRFToken = () => {
  // Try cookies first
  let token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="))
    ?.split("=")[1];

  // If not in cookies, try localStorage
  if (!token) {
    token = localStorage.getItem("XSRF-TOKEN");
  }

  return token;
};

// Utility: Generate unique request ID
function generateRequestId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// 🚩 CSRF initialization on app start/post-login
export const initializeCSRFToken = async () => {
  try {
    console.log("[CSRF] Initializing...");
    const response = await api.get("/health");
    console.log("[CSRF] Health response:", response.status);

    // Give the browser a moment to commit the Set-Cookie header
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check if CSRF token is now available in cookies
    let token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("XSRF-TOKEN="))
      ?.split("=")[1];

    // If not in cookies, try to get from response body
    if (!token && response.data?.csrfToken) {
      token = response.data.csrfToken;
      console.log("[CSRF] Using token from response body");

      // Store in localStorage as fallback
      localStorage.setItem("XSRF-TOKEN", token);
    }

    console.log(
      "[CSRF] Token after initialization:",
      token ? "Present" : "Missing"
    );
    console.log("[CSRF] All cookies:", document.cookie);

    console.log("[CSRF] Initialized successfully.");
    return true;
  } catch (error) {
    console.error("[CSRF] Initialization failed:", error);
    return false;
  }
};

// Attach request ID for debugging in local/dev
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV || config.baseURL?.includes("localhost")) {
      config.headers["X-Request-ID"] = generateRequestId();
    }

    // Debug CSRF token for state-changing requests
    if (
      ["POST", "PUT", "PATCH", "DELETE"].includes(config.method?.toUpperCase())
    ) {
      const token = getCSRFToken();

      // Manually set CSRF header if token is available
      if (token) {
        config.headers["X-CSRF-Token"] = token;
      }

      console.log(
        `[CSRF] ${config.method} ${config.url} - Token:`,
        token ? "Present" : "Missing"
      );
      if (!token) {
        console.warn(`[CSRF] Missing token for ${config.method} ${config.url}`);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for CSRF & rate limit awareness
api.interceptors.response.use(
  (response) => {
    checkRateLimit(response);
    return response;
  },
  async (error) => {
    const { response } = error;

    // Handle CSRF errors
    if (
      response?.status === 403 &&
      response?.data?.error === "Invalid or missing CSRF token"
    ) {
      console.error("[CSRF] Token validation failed for:", error.config?.url);
      console.error("[CSRF] Request headers:", error.config?.headers);
      console.error("[CSRF] Available cookies:", document.cookie);

      // Try to reinitialize CSRF token
      try {
        console.log("[CSRF] Attempting to reinitialize token...");
        await initializeCSRFToken();
      } catch (reinitError) {
        console.error("[CSRF] Failed to reinitialize:", reinitError);
      }
    }

    // Handle rate limit alerts
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

// Handle API errors for UI-friendly messages
export const handleApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    switch (status) {
      case 400:
        return data.message || "Bad request. Please check your input.";
      case 401:
        return "Authentication required. Please log in.";
      case 403:
        if (data.error?.toLowerCase().includes("csrf")) {
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

// Generalized request wrapper with consistent structure
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

// Health check utility for UI or CI
export const checkServerHealth = async () => {
  try {
    const response = await api.get("/health");
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export default api;
