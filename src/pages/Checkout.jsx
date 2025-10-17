import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { API, handleApiError } from "../config/api";
import api from "../services/apiService";
import LoadingState from "../components/LoadingState";
import ErrorBoundary from "../components/ErrorBoundary";
import { useSelector, useDispatch } from "react-redux";
import {
  FiCreditCard,
  FiLock,
  FiTruck,
  FiShield,
  FiClock,
  FiCheckCircle,
} from "react-icons/fi";
import { setCartItems, setCartCount } from "../redux/slices/cartSlice";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [cart, setCart] = useState({
    items: [],
    subtotal: 0,
    totalPrice: 0,
    shippingFee: 0,
    discount: 0,
  });
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Get cart from Redux state
  const reduxCartItems = useSelector((state) => state.cart.items);

  // Helper function to filter in-stock items and validate cart
  const processCartItems = (items) => {
    const inStockItems = items.filter(
      (item) => item.productId.quantityAvailable >= item.quantity * item.lotSize
    );

    if (inStockItems.length === 0) {
      toast.error("All items in your cart are out of stock");
      navigate("/cart");
      return null;
    }

    return inStockItems;
  };

  useEffect(() => {
    const addressId = location.state?.addressId;
    const from = location.state?.from;

    if (!addressId) {
      toast.error("Please select a delivery address");
      navigate("/address-selection");
      return;
    }

    // If coming from address selection, fetch data
    if (from === "address-selection") {
      fetchCartAndAddress(addressId);
    } else {
      // If directly accessing checkout, verify cart has items
      verifyCartAndFetchAddress(addressId);
    }
  }, [location.state]);

  const verifyCartAndFetchAddress = async (addressId) => {
    try {
      setLoading(true);
      console.log("Verifying cart and fetching address...");

      // First check Redux state
      if (reduxCartItems && reduxCartItems.length > 0) {
        console.log("Using cart data from Redux:", reduxCartItems);
        // Use Redux cart data and just fetch address
        const addressResponse = await api.get(
          `${API.ADDRESS.BASE}/${addressId}`
        );
        console.log("Address verification response:", addressResponse.data);

        if (addressResponse.data?.data) {
          setSelectedAddress(addressResponse.data.data);
          // Filter out out-of-stock items and create cart object from Redux data
          const inStockItems = reduxCartItems.filter(
            (item) => item.productId.quantityAvailable >= item.lotSize
          );

          const cartData = {
            items: inStockItems,
            subtotal: inStockItems.reduce(
              (sum, item) => sum + item.price * item.quantity * item.lotSize,
              0
            ),
            totalPrice: inStockItems.reduce(
              (sum, item) => sum + item.price * item.quantity * item.lotSize,
              0
            ),
            shippingFee: 0,
            discount: 0,
          };
          setCart(cartData);
        } else {
          toast.error("Address not found");
          navigate("/address-selection", {
            state: { from: "checkout" },
          });
        }
      } else {
        // Fallback to API call if Redux is empty
        console.log("Redux cart is empty, fetching from API...");
        const cartResponse = await api.get(API.CART.GET);
        console.log("Cart verification response:", cartResponse.data);

        if (!cartResponse.data?.data?.items?.length) {
          console.log("Cart is empty during verification, redirecting to cart");
          toast.error("Your cart is empty");
          navigate("/cart");
          return;
        }

        // Process cart items to filter out out-of-stock items
        const processedItems = processCartItems(cartResponse.data.data.items);
        if (!processedItems) return; // processCartItems handles navigation

        const processedCartData = {
          ...cartResponse.data.data,
          items: processedItems,
          subtotal: processedItems.reduce(
            (sum, item) => sum + item.price * item.quantity * item.lotSize,
            0
          ),
          totalPrice: processedItems.reduce(
            (sum, item) => sum + item.price * item.quantity * item.lotSize,
            0
          ),
        };
        setCart(processedCartData);

        // Fetch address after verifying cart
        const addressResponse = await api.get(
          `${API.ADDRESS.BASE}/${addressId}`
        );
        console.log("Address verification response:", addressResponse.data);
        if (addressResponse.data?.data) {
          setSelectedAddress(addressResponse.data.data);
        } else {
          toast.error("Address not found");
          navigate("/address-selection", {
            state: { from: "checkout" },
          });
        }
      }
    } catch (error) {
      console.error("Error verifying checkout data:", error);
      toast.error(handleApiError(error));
      if (error.response?.status === 401) {
        navigate("/login", { state: { from: "/checkout" } });
      } else {
        navigate("/cart");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCartAndAddress = async (addressId) => {
    try {
      setLoading(true);
      console.log("Fetching cart and address data...");

      // First check Redux state
      if (reduxCartItems && reduxCartItems.length > 0) {
        console.log("Using cart data from Redux:", reduxCartItems);
        // Use Redux cart data and just fetch address
        const addressResponse = await api.get(
          `${API.ADDRESS.BASE}/${addressId}`
        );
        console.log("Address response:", addressResponse.data);

        if (addressResponse.data?.data) {
          setSelectedAddress(addressResponse.data.data);
          // Filter out out-of-stock items and create cart object from Redux data
          const inStockItems = reduxCartItems.filter(
            (item) => item.productId.quantityAvailable >= item.lotSize
          );

          const cartData = {
            items: inStockItems,
            subtotal: inStockItems.reduce(
              (sum, item) => sum + item.price * item.quantity * item.lotSize,
              0
            ),
            totalPrice: inStockItems.reduce(
              (sum, item) => sum + item.price * item.quantity * item.lotSize,
              0
            ),
            shippingFee: 0,
            discount: 0,
          };
          setCart(cartData);
        } else {
          toast.error("Address not found");
          navigate("/address-selection", {
            state: { from: "checkout" },
          });
        }
      } else {
        // Fallback to API call if Redux is empty
        console.log("Redux cart is empty, fetching from API...");
        const [cartResponse, addressResponse] = await Promise.all([
          api.get(API.CART.GET),
          api.get(`${API.ADDRESS.BASE}/${addressId}`),
        ]);

        console.log("Cart response:", cartResponse.data);
        console.log("Address response:", addressResponse.data);

        if (!cartResponse.data?.data?.items?.length) {
          console.log("Cart is empty, redirecting to cart");
          toast.error("Your cart is empty");
          navigate("/cart");
          return;
        }

        setCart(cartResponse.data.data);

        if (addressResponse.data?.data) {
          setSelectedAddress(addressResponse.data.data);
        } else {
          toast.error("Address not found");
          navigate("/address-selection", {
            state: { from: "checkout" },
          });
        }
      }
    } catch (error) {
      console.error("Error fetching checkout data:", error);
      toast.error(handleApiError(error));
      if (error.response?.status === 401) {
        navigate("/login", { state: { from: "/checkout" } });
      } else {
        navigate("/cart");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    try {
      setPlacingOrder(true);

      // Create order from cart
      const response = await api.post(API.ORDERS.CART_CHECKOUT, {
        addressId: selectedAddress._id,
      });

      if (response.data?.orders) {
        const orderData = response.data.orders[0]; // Store order data in a variable

        // Initialize Razorpay
        const options = {
          key: "rzp_test_JuxnZBxv767oxR",
          amount: orderData.amount * 100, // Convert to paise
          currency: "INR",
          name: "Cotchel",
          description: "Payment for your order",
          order_id: orderData.paymentOrderId,
          handler: async function (razorpayResponse) {
            try {
              // Verify payment
              await api.post(API.ORDERS.VERIFY_PAYMENT, {
                order_id: orderData.paymentOrderId,
                payment_id: razorpayResponse.razorpay_payment_id,
                signature: razorpayResponse.razorpay_signature,
              });

              // Clear cart from frontend Redux state after successful payment
              dispatch(setCartItems([]));
              dispatch(setCartCount(0));

              toast.success("Payment successful!");
              navigate(`/order-confirmation/${orderData.orderId}`);
            } catch (error) {
              console.error("Payment verification failed:", error);
              toast.error(handleApiError(error));

              // Handle payment failure - restore cart and redirect
              try {
                await api.post(API.ORDERS.CANCEL_PAYMENT, {
                  orderId: orderData.orderId,
                  reason: "Payment verification failed",
                });
                toast.info("Order cancelled, items returned to cart");
                navigate("/cart");
              } catch (cancelError) {
                console.error("Error cancelling order:", cancelError);
                toast.error("Failed to cancel order. Please contact support.");
              }
            }
          },
          prefill: {
            name: selectedAddress.name,
            email: "", // Will be filled from user data
            contact: selectedAddress.phone,
          },
          theme: {
            color: "#0c0b45",
          },
          modal: {
            ondismiss: async function () {
              // Handle when user closes the payment modal
              console.log("Payment modal dismissed by user");
              try {
                await api.post(API.ORDERS.CANCEL_PAYMENT, {
                  orderId: orderData.orderId,
                  reason: "Payment modal closed by user",
                });
                toast.info(
                  "Payment pending. You can retry payment from your orders page.",
                  {
                    duration: 5000,
                  }
                );
                navigate("/buyer/orders");
              } catch (error) {
                console.error("Error handling payment cancellation:", error);
                toast.error(
                  "Failed to process payment cancellation. Please contact support."
                );
              }
            },
          },
          notes: {
            address: "Cotchel Order",
            order_id: orderData.orderId,
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error(handleApiError(error));
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleChangeAddress = () => {
    navigate("/address-selection", {
      state: {
        from: "checkout",
        returnTo: "/checkout",
      },
    });
  };

  if (loading) {
    return <LoadingState type="card" count={3} />;
  }

  return (
    <ErrorBoundary>
      <div className="max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-6xl 2xl:max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Checkout</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Address */}
          <div className="lg:w-8/12 space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Delivery Address
                </h2>
                <button
                  onClick={handleChangeAddress}
                  className="text-[#0c0b45] hover:text-[#0c0b45]/80 text-sm font-medium"
                >
                  Change Address
                </button>
              </div>
              {selectedAddress ? (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">
                      {selectedAddress.name}
                    </h3>
                    {selectedAddress.isDefault && (
                      <span className="px-2 py-0.5 text-xs font-medium text-[#0c0b45] bg-[#0c0b45]/10 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1">{selectedAddress.phone}</p>
                  <p className="text-gray-600 mt-1">
                    {selectedAddress.addressLine1}
                    {selectedAddress.addressLine2 &&
                      `, ${selectedAddress.addressLine2}`}
                    , {selectedAddress.city}, {selectedAddress.state},{" "}
                    {selectedAddress.postalCode}, {selectedAddress.country}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    No delivery address selected
                  </p>
                  <button
                    onClick={handleChangeAddress}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0c0b45] text-white rounded-lg hover:bg-[#0c0b45]/90 transition-colors"
                  >
                    Select Delivery Address
                  </button>
                </div>
              )}
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Payment Information
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <FiLock className="text-[#0c0b45]" />
                  <span>Secure payment powered by Razorpay</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <FiShield className="text-[#0c0b45]" />
                  <span>Your payment information is encrypted</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:w-4/12">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <div key={item._id} className="flex gap-4">
                    <img
                      src={item.productId.images[0]}
                      alt={item.productId.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {item.productId.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        ₹{item.price * item.quantity * item.lotSize}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{cart.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">₹0</span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-green-600">
                      -₹{cart.discount}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>₹{cart.totalPrice}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder || !selectedAddress}
                className="w-full mt-6 bg-[#0c0b45] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#0c0b45]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {placingOrder ? "Processing..." : "Proceed to Payment"}
              </button>

              {/* Trust Badges */}
              <div className="mt-6 flex items-center justify-center gap-4 text-gray-500">
                <div className="flex items-center gap-1">
                  <FiTruck className="text-[#0c0b45]" />
                  <span className="text-xs">Free Shipping</span>
                </div>
                <div className="flex items-center gap-1">
                  <FiShield className="text-[#0c0b45]" />
                  <span className="text-xs">Secure Payment</span>
                </div>
                <div className="flex items-center gap-1">
                  <FiClock className="text-[#0c0b45]" />
                  <span className="text-xs">24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Checkout;
