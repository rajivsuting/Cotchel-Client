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

// Cart Item Skeleton Component
const CartItemSkeleton = () => (
  <div className="p-4 sm:p-6 animate-pulse">
    <div className="hidden sm:grid sm:grid-cols-[3fr_1fr_1fr_1fr] sm:gap-4 sm:items-center">
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 bg-gray-200 rounded-xl"></div>
        <div className="flex-1">
          <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div className="h-4 w-16 bg-gray-200 rounded"></div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        <div className="w-8 h-4 bg-gray-200 rounded"></div>
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
      </div>
      <div className="h-4 w-20 bg-gray-200 rounded"></div>
    </div>

    {/* Mobile skeleton */}
    <div className="sm:hidden">
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
        <div className="flex-1">
          <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 w-24 bg-gray-200 rounded mb-3"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
              <div className="w-6 h-4 bg-gray-200 rounded"></div>
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
            </div>
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Order Summary Skeleton Component
const OrderSummarySkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6 animate-pulse">
    <div className="h-6 w-32 bg-gray-200 rounded mb-4 sm:mb-6"></div>
    <div className="space-y-3 sm:space-y-4">
      <div className="flex justify-between">
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
        <div className="h-4 w-16 bg-gray-200 rounded"></div>
      </div>
      <div className="flex justify-between">
        <div className="h-4 w-20 bg-gray-200 rounded"></div>
        <div className="h-4 w-8 bg-gray-200 rounded"></div>
      </div>
      <div className="border-t border-dashed border-gray-200 pt-4 mt-4">
        <div className="flex justify-between">
          <div className="h-5 w-12 bg-gray-200 rounded"></div>
          <div className="h-5 w-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
    <div className="h-12 w-full bg-gray-200 rounded-lg mt-5 sm:mt-6"></div>
    <div className="mt-5 sm:mt-6 space-y-3 sm:space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-gray-200 rounded"></div>
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

// Cart Skeleton Component
const CartSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-6xl 2xl:max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-8/12">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-4 hidden sm:block">
              <div className="grid grid-cols-[3fr_1fr_1fr_1fr] gap-4">
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {[1, 2, 3].map((index) => (
                <CartItemSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>

        <div className="lg:w-4/12 mt-6 lg:mt-0">
          <div className="lg:sticky lg:top-8 space-y-6">
            <OrderSummarySkeleton />

            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="text-center p-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 mx-auto bg-gray-200 rounded mb-1 sm:mb-2"></div>
                    <div className="h-3 w-16 bg-gray-200 rounded mx-auto"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
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
      console.log(items);

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
    console.log("Quantity change attempt:", {
      productId,
      newQuantity,
      currentQuantity: items.find((item) => item.productId._id === productId)
        ?.quantity,
    });
    if (newQuantity < 1) {
      console.log("Blocked: newQuantity < 1");
      return;
    }

    // Find the current item to get product details
    const currentItem = items.find((item) => item.productId._id === productId);
    if (!currentItem) return;

    // Calculate maximum available lots
    const maxLots = Math.floor(
      currentItem.productId.quantityAvailable / currentItem.lotSize
    );

    // Check if new quantity exceeds maximum available lots
    if (newQuantity > maxLots) {
      toast.error(`Only ${maxLots} lots available for this product.`);
      return;
    }

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
      // Only include items that are in stock
      if (item.productId.quantityAvailable >= item.quantity * item.lotSize) {
        return total + item.price * item.quantity * item.lotSize;
      }
      return total;
    }, 0);
  };

  const getInStockItems = () => {
    return items.filter(
      (item) => item.productId.quantityAvailable >= item.quantity * item.lotSize
    );
  };

  const getOutOfStockItems = () => {
    return items.filter(
      (item) => item.productId.quantityAvailable < item.quantity * item.lotSize
    );
  };

  if (loading) {
    return <CartSkeleton />;
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
                          className="p-4 sm:p-6 hover:bg-gray-50 transition-all duration-300"
                        >
                          <div className="hidden sm:grid sm:grid-cols-[3fr_1fr_1fr_1fr] sm:gap-4 sm:items-center">
                            <div className="flex items-center gap-6">
                              <div className="relative">
                                <button
                                  onClick={() =>
                                    handleRemoveItem(item.productId._id)
                                  }
                                  disabled={
                                    isUpdating &&
                                    updatingItemId === item.productId._id
                                  }
                                  className="absolute -top-2 -left-2 p-2 text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-md"
                                  title="Remove item"
                                >
                                  <FaTrash className="w-4 h-4" />
                                </button>
                                <img
                                  src={
                                    item.productId?.featuredImage ||
                                    "/placeholder.png"
                                  }
                                  alt={item.productId?.title}
                                  className="w-24 h-24 object-cover rounded-xl shadow-sm transition-all duration-300"
                                  loading="lazy"
                                />
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
                                {item.productId.quantityAvailable <
                                  item.quantity * item.lotSize && (
                                  <p className="text-xs text-red-500 font-medium mt-1">
                                    Out of stock
                                  </p>
                                )}
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
                                  disabled={
                                    isUpdating &&
                                    updatingItemId === item.productId._id
                                  }
                                  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                  disabled={
                                    (isUpdating &&
                                      updatingItemId === item.productId._id) ||
                                    item.quantity >=
                                      Math.floor(
                                        item.productId.quantityAvailable /
                                          item.lotSize
                                      )
                                  }
                                  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={
                                    item.quantity >=
                                    Math.floor(
                                      item.productId.quantityAvailable /
                                        item.lotSize
                                    )
                                      ? `Maximum ${Math.floor(
                                          item.productId.quantityAvailable /
                                            item.lotSize
                                        )} lots available`
                                      : "Increase quantity"
                                  }
                                >
                                  +
                                </button>
                              </div>
                              {item.quantity >=
                                Math.floor(
                                  item.productId.quantityAvailable /
                                    item.lotSize
                                ) &&
                                item.productId.quantityAvailable >=
                                  item.lotSize && (
                                  <p className="text-xs text-orange-600 mt-1">
                                    Max{" "}
                                    {Math.floor(
                                      item.productId.quantityAvailable /
                                        item.lotSize
                                    )}{" "}
                                    lots
                                  </p>
                                )}
                            </div>
                            <div className="text-right">
                              <span className="text-gray-800 font-semibold">
                                ₹
                                {(
                                  item.price *
                                  item.quantity *
                                  item.lotSize
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="sm:hidden">
                            <div className="flex gap-4">
                              <div className="relative">
                                <button
                                  onClick={() =>
                                    handleRemoveItem(item.productId._id)
                                  }
                                  disabled={
                                    isUpdating &&
                                    updatingItemId === item.productId._id
                                  }
                                  className="absolute -top-2 -left-2 p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-md"
                                  title="Remove item"
                                >
                                  <FaTrash className="w-3 h-3" />
                                </button>
                                <img
                                  src={
                                    item.productId?.featuredImage ||
                                    "/placeholder.png"
                                  }
                                  alt={item.productId?.title}
                                  className="w-20 h-20 object-cover rounded-lg"
                                  loading="lazy"
                                />
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
                                {item.productId.quantityAvailable <
                                  item.quantity * item.lotSize && (
                                  <p className="text-xs text-red-500 font-medium mt-1">
                                    Out of stock
                                  </p>
                                )}
                                <div className="mt-2 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() =>
                                        handleQuantityChange(
                                          item.productId._id,
                                          item.quantity - 1
                                        )
                                      }
                                      disabled={
                                        isUpdating &&
                                        updatingItemId === item.productId._id
                                      }
                                      className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                      disabled={
                                        (isUpdating &&
                                          updatingItemId ===
                                            item.productId._id) ||
                                        item.quantity >=
                                          Math.floor(
                                            item.productId.quantityAvailable /
                                              item.lotSize
                                          )
                                      }
                                      className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      title={
                                        item.quantity >=
                                        Math.floor(
                                          item.productId.quantityAvailable /
                                            item.lotSize
                                        )
                                          ? `Maximum ${Math.floor(
                                              item.productId.quantityAvailable /
                                                item.lotSize
                                            )} lots available`
                                          : "Increase quantity"
                                      }
                                    >
                                      +
                                    </button>
                                  </div>
                                  <span className="text-gray-800 font-semibold">
                                    ₹
                                    {(
                                      item.price *
                                      item.quantity *
                                      item.lotSize
                                    ).toFixed(2)}
                                  </span>
                                </div>
                                {item.quantity >=
                                  Math.floor(
                                    item.productId.quantityAvailable /
                                      item.lotSize
                                  ) &&
                                  item.productId.quantityAvailable >=
                                    item.lotSize && (
                                    <p className="text-xs text-orange-600 mt-1">
                                      Max{" "}
                                      {Math.floor(
                                        item.productId.quantityAvailable /
                                          item.lotSize
                                      )}{" "}
                                      lots
                                    </p>
                                  )}
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
                {/* Out of Stock Warning */}
                {getOutOfStockItems().length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                    <h3 className="text-red-800 font-medium mb-2">
                      ⚠️ Out of Stock Items
                    </h3>
                    <p className="text-red-700 text-sm mb-3">
                      The following items are out of stock and will not be
                      included in your order. Please remove them to proceed with
                      checkout:
                    </p>
                    <div className="space-y-2">
                      {getOutOfStockItems().map((item) => (
                        <div
                          key={item._id}
                          className="flex items-center gap-3 text-sm"
                        >
                          <img
                            src={
                              item.productId?.featuredImage ||
                              "/placeholder.png"
                            }
                            alt={item.productId?.title}
                            className="w-8 h-8 object-cover rounded"
                          />
                          <span className="text-red-700 flex-1">
                            {item.productId?.title}
                          </span>
                          <button
                            onClick={() => handleRemoveItem(item.productId._id)}
                            className="text-red-500 hover:text-red-700 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-red-100 rounded-lg">
                      <p className="text-red-800 text-sm font-medium">
                        💡 Remove all out-of-stock items to enable checkout
                      </p>
                    </div>
                  </div>
                )}
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
                        <span>₹0</span>
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
                      disabled={
                        getInStockItems().length === 0 ||
                        getOutOfStockItems().length > 0
                      }
                      className="w-full mt-5 sm:mt-6 px-6 py-2.5 bg-[#0c0b45] text-white rounded-lg hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {getInStockItems().length === 0
                        ? "No items available for checkout"
                        : getOutOfStockItems().length > 0
                        ? "Remove out-of-stock items to proceed"
                        : "Proceed to Checkout"}
                    </button>
                    <div className="mt-5 sm:mt-6 space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <FiShield className="w-5 h-5 text-[#0c0b45]" />
                        <span>Secure Checkout</span>
                      </div>
                      {/* <div className="flex items-center gap-3 text-sm text-gray-500">
                        <FiClock className="w-5 h-5 text-[#0c0b45]" />
                        <span>Easy Returns within 7 days</span>
                      </div> */}
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
