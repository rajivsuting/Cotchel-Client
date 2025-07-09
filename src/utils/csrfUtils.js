// CSRF Token Management Utilities

/**
 * Get CSRF token from cookies or localStorage
 * @returns {string|null} CSRF token or null if not found
 */
export function getCSRFToken() {
  if (typeof document === "undefined") return null;
  let token =
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("XSRF-TOKEN="))
      ?.split("=")[1] || null;
  if (!token) {
    token = localStorage.getItem("XSRF-TOKEN");
  }
  return token;
}

/**
 * Check if CSRF token exists
 * @returns {boolean} True if CSRF token exists
 */
export function hasCSRFToken() {
  return getCSRFToken() !== null;
}

/**
 * Refresh CSRF token by reloading the page
 */
export function refreshCSRFToken() {
  if (typeof window !== "undefined") {
    console.warn("Refreshing CSRF token...");
    window.location.reload();
  }
}

/**
 * Handle CSRF token errors
 * @param {Error} error - The error object
 * @returns {boolean} True if it was a CSRF error and was handled
 */
export function handleCSRFError(error) {
  if (
    error.response?.status === 403 &&
    error.response?.data?.error === "Invalid or missing CSRF token"
  ) {
    // Do not reload the page
    return true;
  }
  return false;
}

/**
 * Create headers with CSRF token
 * @param {Object} additionalHeaders - Additional headers to include
 * @returns {Object} Headers object with CSRF token
 */
export function createHeadersWithCSRF(additionalHeaders = {}) {
  const csrfToken = getCSRFToken();

  return {
    "Content-Type": "application/json",
    ...(csrfToken && { "X-CSRF-Token": csrfToken }),
    ...additionalHeaders,
  };
}

/**
 * Create fetch options with CSRF protection
 * @param {Object} options - Fetch options
 * @returns {Object} Fetch options with CSRF protection
 */
export function createFetchOptionsWithCSRF(options = {}) {
  return {
    credentials: "include",
    headers: createHeadersWithCSRF(options.headers),
    ...options,
  };
}

/**
 * Monitor CSRF token and refresh if needed
 * @param {Function} onTokenRefresh - Callback when token is refreshed
 */
export function monitorCSRFToken(onTokenRefresh = null) {
  let currentToken = getCSRFToken();

  // Check token every 30 seconds
  const interval = setInterval(() => {
    const newToken = getCSRFToken();

    if (newToken !== currentToken) {
      currentToken = newToken;
      if (onTokenRefresh) {
        onTokenRefresh(newToken);
      }
    }
  }, 30000);

  // Return cleanup function
  return () => clearInterval(interval);
}

/**
 * Validate CSRF token format
 * @param {string} token - CSRF token to validate
 * @returns {boolean} True if token format is valid
 */
export function validateCSRFToken(token) {
  if (!token || typeof token !== "string") return false;

  // Basic validation - CSRF tokens are typically alphanumeric
  return /^[a-zA-Z0-9]+$/.test(token);
}

/**
 * Get CSRF token info for debugging
 * @returns {Object} CSRF token information
 */
export function getCSRFTokenInfo() {
  const token = getCSRFToken();

  return {
    exists: !!token,
    valid: token ? validateCSRFToken(token) : false,
    length: token ? token.length : 0,
    timestamp: new Date().toISOString(),
  };
}
