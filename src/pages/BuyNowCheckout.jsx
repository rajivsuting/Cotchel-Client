import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { API, handleApiError } from "../config/api";
import api from "../services/apiService";
import LoadingState from "../components/LoadingState";
import ErrorBoundary from "../components/ErrorBoundary";
import {
  FiCreditCard,
  FiLock,
  FiTruck,
  FiShield,
  FiClock,
  FiCheckCircle,
} from "react-icons/fi";

const BuyNowCheckout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [buyNowData, setBuyNowData] = useState(null);

  useEffect(() => {
    const addressId = location.state?.addressId;
    const from = location.state?.from;

    if (!addressId) {
      toast.error("Please select a delivery address");
      navigate("/address-selection");
      return;
    }

    // Get buy now data from sessionStorage
    const storedBuyNowData = sessionStorage.getItem("buyNowData");
    if (!storedBuyNowData) {
      toast.error("Buy now data not found. Please try again.");
      navigate("/");
      return;
    }

    try {
      const parsedData = JSON.parse(storedBuyNowData);
      setBuyNowData(parsedData);
      fetchAddress(addressId);
    } catch (error) {
      console.error("Error parsing buy now data:", error);
      toast.error("Invalid buy now data. Please try again.");
      navigate("/");
    }
  }, [location.state]);

  const fetchAddress = async (addressId) => {
    try {
      setLoading(true);
      const addressResponse = await api.get(`${API.ADDRESS.BASE}/${addressId}`);

      if (addressResponse.data?.data) {
        setSelectedAddress(addressResponse.data.data);
      } else {
        toast.error("Address not found");
        navigate("/address-selection", { state: { from: "buy-now" } });
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      toast.error("Failed to fetch address");
      navigate("/address-selection", { state: { from: "buy-now" } });
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress || !buyNowData) {
      toast.error("Missing order information");
      return;
    }

    try {
      setPlacingOrder(true);

      // Create order using buy now endpoint
      const response = await api.post(API.ORDERS.BUY_NOW, {
        productId: buyNowData.productId,
        quantity: buyNowData.quantity,
        addressId: selectedAddress._id,
      });

      if (response.data?.order) {
        const orderData = response.data.order;

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

              // Clear buy now data from sessionStorage
              sessionStorage.removeItem("buyNowData");

              toast.success("Payment successful!");
              navigate(`/order-confirmation/${orderData.orderId}`);
            } catch (error) {
              console.error("Payment verification failed:", error);
              toast.error(handleApiError(error));

              // Handle payment failure - restore stock and redirect
              try {
                await api.post(API.ORDERS.CANCEL_PAYMENT, {
                  orderId: orderData.orderId,
                  reason: "Payment verification failed",
                });
                toast.info("Order cancelled, please try again");
                navigate("/");
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
                toast.info("Order cancelled, please try again");
                navigate("/");
              } catch (error) {
                console.error("Error cancelling order:", error);
                toast.error("Failed to cancel order. Please contact support.");
              }
            },
          },
          notes: {
            address: "Cotchel Buy Now Order",
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
        from: "buy-now",
        productId: buyNowData?.productId,
        quantity: buyNowData?.quantity,
      },
    });
  };

  if (loading) {
    return <LoadingState type="card" count={3} />;
  }

  if (!buyNowData || !selectedAddress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Order Information Missing
          </h2>
          <p className="text-gray-600 mb-4">
            Please try again from the product page.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-[#0c0b45] text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const totalPrice =
    buyNowData.product.price * buyNowData.quantity * buyNowData.product.lotSize;

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

              {/* Product Item */}
              <div className="space-y-4 mb-6">
                <div className="flex gap-4">
                  <img
                    src={buyNowData.product.featuredImage}
                    alt={buyNowData.product.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {buyNowData.product.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Qty: {buyNowData.quantity} lots
                    </p>
                    <p className="text-sm text-gray-500">
                      Lot Size: {buyNowData.product.lotSize} units
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      ₹{totalPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    ₹{totalPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">₹0</span>
                </div>
                <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>₹{totalPrice.toLocaleString()}</span>
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

export default BuyNowCheckout;
