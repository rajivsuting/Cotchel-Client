/**
 * Utility functions for consistent cart operations across the application
 */

import api from "../services/apiService";
import { API } from "../config/api";
import { setCartItems, setCartCount } from "../redux/slices/cartSlice";

/**
 * Calculate total cart count from cart items
 * @param {Array} items - Array of cart items
 * @returns {number} - Total quantity across all items
 */
export const calculateCartCount = (items) => {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
};

/**
 * Extract cart data from API response and calculate count
 * @param {Object} response - API response object
 * @returns {Object} - { items: Array, count: number }
 */
export const extractCartData = (response) => {
  if (!response || !response.data) {
    return { items: [], count: 0 };
  }

  // Handle different response structures
  const cartData = response.data.data || response.data;
  const items = cartData?.items || [];

  return {
    items,
    count: calculateCartCount(items),
  };
};

/**
 * Validate cart item structure
 * @param {Object} item - Cart item object
 * @returns {boolean} - Whether item is valid
 */
export const isValidCartItem = (item) => {
  return (
    item &&
    typeof item === "object" &&
    item.productId &&
    typeof item.quantity === "number" &&
    item.quantity > 0
  );
};

/**
 * Fetch the cart from the server and update Redux state
 * @param {function} dispatch - Redux dispatch function
 * @returns {Promise<void>}
 */
export const fetchAndSyncCart = async (dispatch) => {
  try {
    const response = await api.get(API.CART.GET, { withCredentials: true });
    const { items, count } = extractCartData(response);
    dispatch(setCartItems(items));
    dispatch(setCartCount(count));
  } catch (error) {
    dispatch(setCartItems([]));
    dispatch(setCartCount(0));
  }
};
