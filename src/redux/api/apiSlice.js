import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./axiosBaseQuery";

// Utility function to get CSRF token from cookies
function getCSRFToken() {
  if (typeof document === "undefined") return null;
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="))
    ?.split("=")[1];
}

// Generate unique request ID
function generateRequestId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

const baseQuery = axiosBaseQuery({
  baseUrl:
    import.meta.env.VITE_API_URL ||
    "https://starfish-app-6q6ot.ondigitalocean.app/",
  credentials: "include",
  prepareHeaders: (headers) => {
    // Add CSRF token if available
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }

    // Add request ID for tracking (only in development)
    if (import.meta.env.DEV) {
      headers.set("X-Request-ID", generateRequestId());
    }

    return headers;
  },
});

// Enhanced base query with error handling
const baseQueryWithErrorHandling = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  // Handle CSRF token errors
  if (
    result.error?.status === 403 &&
    result.error?.data?.error === "Invalid or missing CSRF token"
  ) {
    // Instead of refreshing, just log the error or dispatch a logout
    console.warn("CSRF token expired, please log in again.");
    // Optionally, dispatch a logout action here
  }

  // Handle rate limiting
  if (result.error?.status === 429) {
    console.warn("Rate limited. Please wait a moment and try again.");
  }

  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: ["Product", "Cart", "Wishlist", "Order"],
  endpoints: (builder) => ({}),
});
