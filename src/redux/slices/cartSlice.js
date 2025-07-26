import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  count: 0,
  loading: false,
  error: null,
};

// Helper function to calculate cart count
const calculateCartCount = (items) => {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setCartItems: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.items = action.payload;
        state.count = calculateCartCount(action.payload);
      }
    },
    setCartCount: (state, action) => {
      state.count = action.payload;
    },
    addToCart: (state, action) => {
      if (Array.isArray(state.items)) {
        const existingItem = state.items.find(
          (item) => item.productId?._id === action.payload.productId?._id
        );
        if (existingItem) {
          existingItem.quantity += action.payload.quantity;
        } else {
          state.items.push(action.payload);
        }
        state.count = calculateCartCount(state.items);
      }
    },
    removeFromCart: (state, action) => {
      if (Array.isArray(state.items)) {
        state.items = state.items.filter(
          (item) => item.productId._id !== action.payload
        );
        state.count = calculateCartCount(state.items);
      }
    },
    updateCartItem: (state, action) => {
      if (Array.isArray(state.items)) {
        const item = state.items.find(
          (item) => item.productId._id === action.payload.productId
        );
        if (item) {
          item.quantity = action.payload.quantity;
          item.totalPrice = item.price * item.quantity;
        }
        state.count = calculateCartCount(state.items);
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.count = 0;
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setCartItems,
  setCartCount,
  addToCart,
  removeFromCart,
  updateCartItem,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
