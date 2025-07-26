import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiShoppingBag, FiShield, FiTruck, FiClock } from "react-icons/fi";
import api from "../services/apiService";
import { API } from "../config/api";
import DeliveryInfo from "../components/DeliveryInfo";
import LoadingState from "../components/LoadingState";
import ErrorBoundary from "../components/ErrorBoundary";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { setCartItems, setCartCount } from "../redux/slices/cartSlice";
import { FaTrash } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { extractCartData } from "../utils/cartUtils";

// Cart Skeleton Component
const CartSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm">
    <div className="p-6 border-b">
      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
    </div>
    <div className="divide-y">
      {[1, 2, 3].map((index) => (
        <div key={index} className="p-6">
          <div className="flex gap-4">
            <div className="w-24 h-24 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="flex-1">
              <div className="flex justify-between">
                <div>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-48 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Cart = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.cart);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);

  // Add scroll to top effect
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchCart = async () => {
    try {
      const response = await api.get(API.CART.GET, {
        withCredentials: true,
      });

      const { items, count } = extractCartData(response);
      dispatch(setCartItems(items));
      dispatch(setCartCount(count));
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated()) {
      fetchCart();
    } else {
      navigate("/login", { state: { from: "/cart" } });
    }
  }, [isAuthenticated, navigate]);

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      setIsUpdating(true);
      setUpdatingItemId(productId);

      const response = await api.put(
        `${API.CART.UPDATE_ITEM}/${productId}`,
        { quantity: newQuantity },
        { withCredentials: true }
      );

      if (response.data && response.data.data) {
        const { items, count } = extractCartData(response);
        dispatch(setCartItems(items));
        dispatch(setCartCount(count));
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      toast.error(error.response?.data?.message || "Failed to update cart");
    } finally {
      setIsUpdating(false);
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      setIsUpdating(true);
      setUpdatingItemId(productId);

      await api.delete(`${API.CART.REMOVE_ITEM}/${productId}`, {
        withCredentials: true,
      });

      await fetchCart();
      // fetchCart already updates cart count
      toast.success("Item removed successfully");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error(error.response?.data?.message || "Failed to remove item");
    } finally {
      setIsUpdating(false);
      setUpdatingItemId(null);
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-6xl 2xl:max-w-7xl mx-auto px-4 py-8">
          <DeliveryInfo />

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-8/12">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {items.length > 0 ? (
                  <>
                    <div className="bg-gray-50 p-4 hidden sm:block">
                      <div className="grid grid-cols-[3fr_1fr_1fr_1fr] gap-4">
                        <div className="text-sm text-center font-semibold text-gray-600">
                          PRODUCT DETAILS
                        </div>
                        <div className="text-sm font-semibold text-gray-600">
                          UNIT PRICE
                        </div>
                        <div className="text-sm font-semibold text-gray-600">
                          QUANTITY
                        </div>
                        <div className="text-sm font-semibold text-gray-600 text-right">
                          SUBTOTAL
                        </div>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {items.map((item) => (
                        <div
                          key={item._id}
                          className="p-4 sm:p-6 hover:bg-gray-50 transition-all duration-300 group"
                        >
                          <div className="hidden sm:grid sm:grid-cols-[3fr_1fr_1fr_1fr] sm:gap-4 sm:items-center">
                            <div className="flex items-center gap-6">
                              <div className="relative group">
                                <img
                                  src={
                                    item.productId?.featuredImage ||
                                    "/placeholder.png"
                                  }
                                  alt={item.productId?.title}
                                  className="w-24 h-24 object-cover rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300"
                                  loading="lazy"
                                />
                                <button
                                  onClick={() =>
                                    handleRemoveItem(item.productId._id)
                                  }
                                  className="absolute -top-2 -right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-50"
                                >
                                  <FaTrash className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                              <div>
                                <h3 className="text-gray-800 font-medium">
                                  <Link
                                    to={`/product/${item.productId?._id}`}
                                    className="hover:text-[#0D0B46]"
                                  >
                                    {item.productId?.title}
                                  </Link>
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  Lot Size: {item.lotSize} units
                                </p>
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-800 font-medium">
                                ₹{item.price}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.productId._id,
                                      item.quantity - 1
                                    )
                                  }
                                  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:border-gray-300 transition-colors"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.productId._id,
                                      item.quantity + 1
                                    )
                                  }
                                  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:border-gray-300 transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-gray-800 font-semibold">
                                ₹{(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="sm:hidden">
                            <div className="flex gap-4">
                              <div className="relative">
                                <img
                                  src={
                                    item.productId?.featuredImage ||
                                    "/placeholder.png"
                                  }
                                  alt={item.productId?.title}
                                  className="w-20 h-20 object-cover rounded-lg"
                                  loading="lazy"
                                />
                                <button
                                  onClick={() =>
                                    handleRemoveItem(item.productId._id)
                                  }
                                  className="absolute -top-2 -right-2 p-1.5 bg-white rounded-full shadow-sm"
                                >
                                  <FaTrash className="w-3 h-3 text-red-500" />
                                </button>
                              </div>
                              <div className="flex-1">
                                <h3 className="text-gray-800 font-medium">
                                  <Link
                                    to={`/product/${item.productId?._id}`}
                                    className="hover:text-[#0D0B46]"
                                  >
                                    {item.productId?.title}
                                  </Link>
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  Lot Size: {item.lotSize} units
                                </p>
                                <div className="mt-2 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() =>
                                        handleQuantityChange(
                                          item.productId._id,
                                          item.quantity - 1
                                        )
                                      }
                                      className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-200 hover:border-gray-300 transition-colors"
                                    >
                                      -
                                    </button>
                                    <span className="w-6 text-center">
                                      {item.quantity}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleQuantityChange(
                                          item.productId._id,
                                          item.quantity + 1
                                        )
                                      }
                                      className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-200 hover:border-gray-300 transition-colors"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <span className="text-gray-800 font-semibold">
                                    ₹{(item.price * item.quantity).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                      <FiShoppingBag className="w-full h-full" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Your cart is empty
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Looks like you haven't added any items to your cart yet.
                    </p>
                    <Link
                      to="/"
                      className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#0D0B46] hover:bg-[#23206a] transition-colors"
                    >
                      Start Shopping
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {items.length > 0 && (
              <div className="lg:w-4/12 mt-6 lg:mt-0">
                <div className="lg:sticky lg:top-8 space-y-6">
                  <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 sm:mb-6">
                      Order Summary
                    </h2>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal ({items.length} items)</span>
                        <span>₹{calculateSubtotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Shipping Fee</span>
                        <span>
                          {calculateSubtotal() > 999 ? "₹999" : "Free"}
                        </span>
                      </div>
                      <div className="border-t border-dashed border-gray-200 pt-4 mt-4">
                        <div className="flex justify-between text-lg sm:text-xl font-medium text-gray-800">
                          <span>Total</span>
                          <span>₹{calculateSubtotal().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate("/address-selection")}
                      className="w-full mt-5 sm:mt-6 px-6 py-2.5 bg-[#0c0b45] text-white rounded-lg hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 text-base sm:text-lg"
                    >
                      Proceed to Checkout
                    </button>
                    <div className="mt-5 sm:mt-6 space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <FiShield className="w-5 h-5 text-[#0c0b45]" />
                        <span>Secure Checkout</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <FiClock className="w-5 h-5 text-[#0c0b45]" />
                        <span>Easy Returns within 7 days</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      <div className="text-center p-2">
                        <FiShield className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-[#0c0b45] mb-1 sm:mb-2" />
                        <span className="text-xs text-gray-500">
                          Secure Payment
                        </span>
                      </div>
                      <div className="text-center p-2 border-x border-gray-100">
                        <FiTruck className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-[#0c0b45] mb-1 sm:mb-2" />
                        <span className="text-xs text-gray-500">
                          Fast Delivery
                        </span>
                      </div>
                      <div className="text-center p-2">
                        <FiClock className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-[#0c0b45] mb-1 sm:mb-2" />
                        <span className="text-xs text-gray-500">
                          24/7 Support
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Cart;
