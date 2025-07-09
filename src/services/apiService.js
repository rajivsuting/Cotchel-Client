import axios from "axios";
import { API_BASE_URL } from "../config/api";

// Create axios instance (no CSRF handling)
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Necessary for cross-origin cookies
  timeout: 10000,
});

// Utility: Generate unique request ID
function generateRequestId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// Attach request ID for debugging in local/dev
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV || config.baseURL?.includes("localhost")) {
      config.headers["X-Request-ID"] = generateRequestId();
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for rate limit awareness
api.interceptors.response.use(
  (response) => {
    checkRateLimit(response);
    return response;
  },
  async (error) => {
    const { response } = error;
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
