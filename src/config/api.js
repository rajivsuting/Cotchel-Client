export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  // "https://starfish-app-6q6ot.ondigitalocean.app/api";
  "https://starfish-app-6q6ot.ondigitalocean.app/api";

export const API = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    VERIFY_EMAIL: `${API_BASE_URL}/auth/verify-email`,
    RESEND_OTP: `${API_BASE_URL}/auth/resend-otp`,
    REQUEST_RESET: `${API_BASE_URL}/auth/request-reset`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
    REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh-token`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    GOOGLE_SIGNIN: `${API_BASE_URL}/auth/google-signin`,
  },
  // User endpoints
  USER: {
    PROFILE: `${API_BASE_URL}/auth/profile`,
    ME: `${API_BASE_URL}/auth/me`,
    UPDATE_DETAILS: `${API_BASE_URL}/auth/update-details`,
    EDIT: `${API_BASE_URL}/auth/edit`,
    UPDATE_ROLE: `${API_BASE_URL}/auth/update-last-active-role`,
    SELLER_DETAILS: `${API_BASE_URL}/auth/seller-details`,
    SELLER_DASHBOARD: `${API_BASE_URL}/seller/dashboard`,
    SELLER_EARNINGS_STATS: `${API_BASE_URL}/seller/earnings/stats`,
    SELLER_EARNINGS_TRANSACTIONS: `${API_BASE_URL}/seller/earnings/transactions`,
  },
  // Product endpoints
  PRODUCTS: {
    ALL: `${API_BASE_URL}/products`,
    FEATURED: `${API_BASE_URL}/products/featured`,
    DETAILS: (id) => `${API_BASE_URL}/products/get/${id}`,
    CATEGORY: (category) => `${API_BASE_URL}/products/category/${category}`,
    SEARCH: `${API_BASE_URL}/products/search`,
    SUGGESTIONS: `${API_BASE_URL}/products/suggestions`,
    ENHANCED_SUGGESTIONS: `${API_BASE_URL}/products/enhanced-suggestions`,
  },
  // Banner endpoints
  BANNERS: {
    ALL: `${API_BASE_URL}/banners`,
    FEATURED: `${API_BASE_URL}/banners/featured`,
    PROMOTIONAL: `${API_BASE_URL}/promotional-banners`,
  },
  // Cart endpoints
  CART: {
    GET: `${API_BASE_URL}/cart/items`,
    ADD_ITEM: `${API_BASE_URL}/cart/add-item`,
    REMOVE_ITEM: `${API_BASE_URL}/cart/remove-item`,
    UPDATE_ITEM: `${API_BASE_URL}/cart/update-item`,
    CLEAR: (userId) => `${API_BASE_URL}/cart/${userId}/clear`,
    APPLY_COUPON: `${API_BASE_URL}/cart/apply-coupon`,
    ITEM_COUNT: `${API_BASE_URL}/cart/item-count`,
  },
  // Wishlist endpoints
  WISHLIST: {
    ALL: `${API_BASE_URL}/wishlist/all`,
    ADD: `${API_BASE_URL}/wishlist/add`,
    REMOVE: `${API_BASE_URL}/wishlist/remove`,
  },
  CATEGORIES: {
    ALL: `${API_BASE_URL}/categories/all`,
    FEATURED: `${API_BASE_URL}/categories/featured`,
  },
  ORDERS: {
    CART_CHECKOUT: `${API_BASE_URL}/orders/cart-checkout`,
    BUY_NOW: `${API_BASE_URL}/orders/buy-now`,
    VERIFY_PAYMENT: `${API_BASE_URL}/orders/razorpay-webhook`,
    ALL: `${API_BASE_URL}/orders`,
    GET: (id) => `${API_BASE_URL}/orders/${id}`,
    GET_BY_PAYMENT: (paymentTransactionId) =>
      `${API_BASE_URL}/orders/payment/${paymentTransactionId}`,
    CANCEL: (id) => `${API_BASE_URL}/orders/${id}/cancel`,
  },
  // Address endpoints
  ADDRESS: {
    BASE: `${API_BASE_URL}/address`,
    ALL: `${API_BASE_URL}/address`,
    CREATE: `${API_BASE_URL}/address`,
    UPDATE: (id) => `${API_BASE_URL}/address/${id}`,
    DELETE: (id) => `${API_BASE_URL}/address/${id}`,
    SET_DEFAULT: (id) => `${API_BASE_URL}/address/${id}/default`,
  },
  // Notification endpoints
  NOTIFICATIONS: {
    SELLER: `${API_BASE_URL}/notifications/seller`,
    MARK_AS_READ: (id) => `${API_BASE_URL}/notifications/${id}/read`,
    MARK_ALL_AS_READ: `${API_BASE_URL}/notifications/seller/read-all`,
  },
  // Image upload endpoints
  IMAGE: {
    UPLOAD: `${API_BASE_URL}/image/upload`,
    UPLOAD_FILE: `${API_BASE_URL}/image/upload-file`,
  },
  // Inquiry endpoints
  INQUIRY: {
    ALL: `${API_BASE_URL}/inquiries`,
    USER: `${API_BASE_URL}/inquiries/user`,
    CREATE: `${API_BASE_URL}/inquiries`,
  },
  REVIEWS: {
    ADD: (id) => `${API_BASE_URL}/reviews/${id}`,
    GET: (id) => `${API_BASE_URL}/reviews/${id}`,
    UPDATE: (reviewId) => `${API_BASE_URL}/reviews/${reviewId}`,
    DELETE: (reviewId) => `${API_BASE_URL}/reviews/${reviewId}`,
  },
};

export const API_CONFIG = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

export const handleApiError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    return error.response.data.message || "An error occurred";
  } else if (error.request) {
    // The request was made but no response was received
    return "No response from server";
  } else {
    // Something happened in setting up the request that triggered an Error
    return error.message || "An error occurred";
  }
};
