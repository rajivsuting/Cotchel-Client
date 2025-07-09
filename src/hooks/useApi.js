import { useState, useEffect } from "react";
import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  apiPatch,
  handleApiError,
} from "../services/apiService";

// Utility function to get CSRF token from cookies or localStorage
function getCSRFToken() {
  if (typeof document === "undefined") return null;
  let token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="))
    ?.split("=")[1];
  if (!token) {
    token = localStorage.getItem("XSRF-TOKEN");
  }
  return token;
}

// Custom hook for API calls with CSRF token handling
export function useApi() {
  const [csrfToken, setCsrfToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get CSRF token on component mount
    setCsrfToken(getCSRFToken());
  }, []);

  const apiCall = async (url, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const token = getCSRFToken();
      const response = await fetch(url, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "X-CSRF-Token": token }),
          ...options.headers,
        },
        ...options,
      });

      if (response.status === 403) {
        const errorData = await response.json();
        if (errorData.error === "Invalid or missing CSRF token") {
          // Instead of refreshing, just set error state
          setError("Session expired. Please log in again.");
          return;
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      return { success: true, data };
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const get = (url, config = {}) => apiGet(url, config);
  const post = (url, data = {}, config = {}) => apiPost(url, data, config);
  const put = (url, data = {}, config = {}) => apiPut(url, data, config);
  const del = (url, config = {}) => apiDelete(url, config);
  const patch = (url, data = {}, config = {}) => apiPatch(url, data, config);

  return {
    apiCall,
    get,
    post,
    put,
    delete: del,
    patch,
    loading,
    error,
    csrfToken,
  };
}

// Hook for handling rate limiting
export function useRateLimit() {
  const [rateLimitInfo, setRateLimitInfo] = useState({
    remaining: null,
    reset: null,
    limited: false,
  });

  const checkRateLimit = (response) => {
    const remaining = response.headers.get("X-RateLimit-Remaining");
    const reset = response.headers.get("X-RateLimit-Reset");

    setRateLimitInfo({
      remaining: remaining ? parseInt(remaining) : null,
      reset: reset ? new Date(reset * 1000) : null,
      limited: response.status === 429,
    });

    return { remaining, reset, limited: response.status === 429 };
  };

  return { rateLimitInfo, checkRateLimit };
}

// Hook for health monitoring
export function useHealthCheck() {
  const [healthStatus, setHealthStatus] = useState({
    status: "unknown",
    lastCheck: null,
    error: null,
  });

  const checkHealth = async () => {
    try {
      const response = await fetch("/api/health", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setHealthStatus({
          status: data.status,
          lastCheck: new Date(),
          error: null,
        });
        return { success: true, data };
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      setHealthStatus({
        status: "error",
        lastCheck: new Date(),
        error: error.message,
      });
      return { success: false, error: error.message };
    }
  };

  return { healthStatus, checkHealth };
}
