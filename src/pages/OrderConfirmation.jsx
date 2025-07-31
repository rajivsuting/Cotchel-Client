import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/apiService";
import { API } from "../config/api";
import LoadingState from "../components/LoadingState";
import ErrorBoundary from "../components/ErrorBoundary";
import {
  FiCheckCircle,
  FiTruck,
  FiMapPin,
  FiClock,
  FiPackage,
  FiDownload,
  FiShare2,
  FiHome,
  FiShoppingBag,
} from "react-icons/fi";

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);

      // First, get the single order to extract paymentTransactionId
      const singleOrderResponse = await api.get(API.ORDERS.GET(orderId));
      const singleOrder = singleOrderResponse.data.order;

      if (!singleOrder.paymentTransactionId) {
        // If no paymentTransactionId, just show the single order
        setOrders([singleOrder]);
        return;
      }

      // Now fetch all orders with the same paymentTransactionId
      const allOrdersResponse = await api.get(
        API.ORDERS.GET_BY_PAYMENT(singleOrder.paymentTransactionId)
      );
      setOrders(allOrdersResponse.data.orders);
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError("Failed to load order details");
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const downloadInvoice = () => {
    // TODO: Implement invoice download
    toast.info("Invoice download feature coming soon!");
  };

  const shareOrder = () => {
    if (navigator.share) {
      navigator.share({
        title: "My Order Confirmation",
        text: `I just placed an order on Cotchel! Order ID: ${orderId}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Order link copied to clipboard!");
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error || !orders.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiPackage className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Order Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "The order you're looking for doesn't exist."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0D0B46] text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            <FiHome className="w-5 h-5" />
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order Confirmed!
            </h1>
            <p className="text-gray-600 text-lg">
              Thank you for your purchase. Your order has been successfully
              placed.
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            {/* Order Header */}
            <div className="bg-gradient-to-r from-[#0D0B46] to-[#23206a] text-white p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-1">
                    Order #{orderId}
                  </h2>
                  <p className="text-blue-100">
                    Placed on {formatDate(orders[0]?.createdAt)} at{" "}
                    {formatTime(orders[0]?.createdAt)}
                  </p>
                  {orders.length > 1 && (
                    <p className="text-blue-100 text-sm mt-1">
                      {orders.length} orders from {orders.length} sellers
                    </p>
                  )}
                </div>
                <div className="mt-4 sm:mt-0">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <FiCheckCircle className="w-4 h-4 mr-1" />
                    Confirmed
                  </span>
                </div>
              </div>
            </div>

            {/* Order Content */}
            <div className="p-6">
              {/* Order Items */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Items
                </h3>
                <div className="space-y-4">
                  {orders.flatMap((order, orderIndex) =>
                    order.products.map((item, itemIndex) => (
                      <div
                        key={`${orderIndex}-${itemIndex}`}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                      >
                        <img
                          src={
                            item.featuredImage ||
                            item.images?.[0] ||
                            "/placeholder.png"
                          }
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {item.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Quantity: {item.quantity} × ₹{item.price}
                          </p>
                          {orders.length > 1 && (
                            <p className="text-xs text-gray-400 mt-1">
                              Seller: {order.seller?.name || "Unknown Seller"}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ₹{item.totalPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>
                      ₹
                      {orders
                        .reduce((sum, order) => sum + order.totalPrice, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span>Included</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>
                        ₹
                        {orders
                          .reduce((sum, order) => sum + order.totalPrice, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery & Payment Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Delivery Address */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiMapPin className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delivery Address
                </h3>
              </div>
              <div className="space-y-2 text-gray-600">
                <p className="font-medium text-gray-900">
                  {orders[0]?.address?.name}
                </p>
                <p>{orders[0]?.address?.phone}</p>
                <p>
                  {orders[0]?.address?.street}, {orders[0]?.address?.city}
                </p>
                <p>
                  {orders[0]?.address?.state} {orders[0]?.address?.pincode}
                </p>
                <p>{orders[0]?.address?.country}</p>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <FiCheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Payment Information
                </h3>
              </div>
              <div className="space-y-2 text-gray-600">
                <p>
                  <span className="font-medium">Payment Method:</span> Razorpay
                </p>
                <p>
                  <span className="font-medium">Payment Status:</span>{" "}
                  <span className="text-green-600 font-medium">Paid</span>
                </p>
                {orders[0]?.paymentTransactionId && (
                  <p>
                    <span className="font-medium">Transaction ID:</span>{" "}
                    {orders[0]?.paymentTransactionId}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              What's Next?
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiPackage className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Order Processing
                </h4>
                <p className="text-sm text-gray-600">
                  We're preparing your order for shipment
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiTruck className="w-6 h-6 text-orange-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Shipping</h4>
                <p className="text-sm text-gray-600">
                  Your order will be shipped within 24-48 hours
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiClock className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Delivery</h4>
                <p className="text-sm text-gray-600">
                  Expected delivery in 3-5 business days
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0D0B46] text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium"
            >
              <FiHome className="w-5 h-5" />
              Continue Shopping
            </Link>
            <Link
              to="/buyer/orders"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <FiShoppingBag className="w-5 h-5" />
              View All Orders
            </Link>
            {/* <button
              onClick={downloadInvoice}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <FiDownload className="w-5 h-5" />
              Download Invoice
            </button>
            <button
              onClick={shareOrder}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <FiShare2 className="w-5 h-5" />
              Share Order
            </button> */}
          </div>

          {/* Support Info */}
          <div className="text-center mt-8 p-6 bg-blue-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-gray-600 mb-4">
              If you have any questions about your order, our customer support
              team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@cotchel.com"
                className="text-[#0D0B46] hover:underline font-medium"
              >
                support@cotchel.com
              </a>
              <span className="text-gray-400">|</span>
              <a
                href="tel:+91-1800-123-4567"
                className="text-[#0D0B46] hover:underline font-medium"
              >
                +91-1800-123-4567
              </a>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default OrderConfirmation;
