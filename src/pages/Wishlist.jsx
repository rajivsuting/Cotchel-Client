import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaTrash, FaArrowLeft, FaShoppingCart } from "react-icons/fa";
import { API, handleApiError } from "../config/api";
import api from "../services/apiService";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { setCartCount } from "../redux/slices/cartSlice";
import { extractCartData } from "../utils/cartUtils";
import {
  setWishlistItems,
  setLoading,
  setError,
} from "../redux/slices/wishlistSlice";
import LoadingState from "../components/LoadingState";

const Wishlist = () => {
  const dispatch = useDispatch();
  const {
    items: wishlistItems,
    loading,
    error,
  } = useSelector((state) => state.wishlist);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const response = await api.get(API.WISHLIST.ALL);

      if (response.data.wishlist) {
        dispatch(setWishlistItems(response.data.wishlist));
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      const errorMessage = handleApiError(error);
      dispatch(setError(errorMessage));
      toast.error(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      setActionLoading(true);
      const response = await api.post(API.WISHLIST.REMOVE, { productId });

      if (response.data.message) {
        dispatch(
          setWishlistItems(
            wishlistItems.filter((item) => item.productId._id !== productId)
          )
        );
        toast.success("Item removed from wishlist");
      }
    } catch (error) {
      console.error("Error removing item from wishlist:", error);
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      setActionLoading(true);
      const response = await api.post(API.CART.ADD_ITEM, {
        productId,
        quantity: 1,
      });

      if (response.data.message) {
        // Fetch updated cart to get the new count
        const cartResponse = await api.get(API.CART.GET);

        const { count } = extractCartData(cartResponse);
        dispatch(setCartCount(count));
        toast.success("Item added to cart successfully");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const calculateDiscount = (price, comparePrice) => {
    if (!comparePrice || comparePrice <= price) return 0;
    return Math.round(((comparePrice - price) / comparePrice) * 100);
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="text-center py-8 px-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
          {error}
        </h2>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-[#0D0B46] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-[#23206a] transition-colors text-sm sm:text-base"
        >
          <FaArrowLeft className="w-4 h-4" />
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto bg-transparent p-0 mt-4 sm:mt-8 pb-20 px-4 sm:px-0">
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6 sm:mb-8 flex items-center gap-2">
        My Wishlist
      </h1>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaShoppingCart className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            Your wishlist is empty
          </h2>
          <p className="text-gray-500 mb-6 text-sm sm:text-base max-w-md mx-auto">
            Start adding items to your wishlist to see them here.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-[#0D0B46] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-[#23206a] transition-colors text-sm sm:text-base"
          >
            <FaArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {wishlistItems.map((item) => {
            const discount = calculateDiscount(
              item.productId.price,
              item.productId.compareAtPrice
            );

            return (
              <div
                key={item._id}
                className="border border-gray-200 rounded-xl bg-white p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Mobile Layout */}
                <div className="block sm:hidden">
                  <div className="flex items-start gap-3 mb-3">
                    <Link
                      to={`/product/${item.productId._id}`}
                      className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden"
                    >
                      <img
                        src={item.productId.featuredImage}
                        alt={item.productId.title}
                        className="w-full h-full object-cover"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/product/${item.productId._id}`}
                        className="block"
                      >
                        <h3 className="text-base font-semibold text-gray-900 hover:text-[#0D0B46] transition-colors line-clamp-2">
                          {item.productId.title}
                        </h3>
                      </Link>
                      <div className="mt-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-semibold text-gray-900">
                            ₹{item.productId.price.toFixed(2)}
                          </span>
                          {item.productId.compareAtPrice &&
                            item.productId.compareAtPrice >
                              item.productId.price && (
                              <span className="text-xs text-gray-500 line-through">
                                ₹{item.productId.compareAtPrice.toFixed(2)}
                              </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.productId.stock > 0
                            ? `${item.productId.stock} in stock`
                            : "Out of stock"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Lot Size: {item.productId.lotSize || 1}</p>
                      {item.productId.category && (
                        <p>Category: {item.productId.category}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAddToCart(item.productId._id)}
                        disabled={actionLoading}
                        className="p-2.5 text-[#0D0B46] hover:bg-[#0D0B46]/5 rounded-lg transition-colors disabled:opacity-50"
                        title="Add to Cart"
                      >
                        <FaShoppingCart className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        onClick={() => handleRemoveItem(item.productId._id)}
                        disabled={actionLoading}
                        title="Remove from Wishlist"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:flex items-start gap-6">
                  <Link
                    to={`/product/${item.productId._id}`}
                    className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden"
                  >
                    <img
                      src={item.productId.featuredImage}
                      alt={item.productId.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.productId._id}`}
                      className="block"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-[#0D0B46] transition-colors">
                        {item.productId.title}
                      </h3>
                    </Link>

                    <div className="mt-2 space-y-2">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {item.productId.description}
                      </p>

                      <div className="flex items-center gap-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-semibold text-gray-900">
                            ₹{item.productId.price.toFixed(2)}
                          </span>
                          {item.productId.compareAtPrice &&
                            item.productId.compareAtPrice >
                              item.productId.price && (
                              <span className="text-sm text-gray-500 line-through">
                                ₹{item.productId.compareAtPrice.toFixed(2)}
                              </span>
                            )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {item.productId.stock > 0
                            ? `${item.productId.stock} in stock`
                            : "Out of stock"}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Lot Size: {item.productId.lotSize || 1}</span>
                        {item.productId.category && (
                          <span>Category: {item.productId.category}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleAddToCart(item.productId._id)}
                      disabled={actionLoading}
                      className="p-2 text-[#0D0B46] hover:bg-[#0D0B46]/5 rounded-lg transition-colors disabled:opacity-50"
                      title="Add to Cart"
                    >
                      <FaShoppingCart className="w-5 h-5" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      onClick={() => handleRemoveItem(item.productId._id)}
                      disabled={actionLoading}
                      title="Remove from Wishlist"
                    >
                      <FaTrash className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
