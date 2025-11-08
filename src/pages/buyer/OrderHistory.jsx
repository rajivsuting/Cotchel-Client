import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiDownload,
  FiCreditCard,
  FiClock,
  FiAlertCircle,
} from "react-icons/fi";
import api from "../../services/apiService";
import { API, handleApiError } from "../../config/api";
import { toast } from "react-hot-toast";
import LoadingState from "../../components/LoadingState";
import {
  getOrderStatusColor,
  getPaymentStatusColor,
  canDownloadInvoice,
} from "../../utils/orderStatusUtils";
import { useOrdersListSocket } from "../../hooks/useSocket";
import { useAuth } from "../../context/AuthContext";
import { useDispatch } from "react-redux";
import { fetchAndSyncCart } from "../../utils/cartUtils";

const OrderHistory = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [orders, setOrders] = useState([]);
  const [pendingPaymentOrders, setPendingPaymentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cancellingOrder, setCancellingOrder] = useState(null);

  const fetchOrders = async (page = 1, silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const response = await api.get(`${API.ORDERS.ALL}?page=${page}`);
      setOrders(response.data.orders);
      setTotalPages(response.data.pagination.totalPages);
      setCurrentPage(page);
    } catch (err) {
      console.error("Error fetching orders:", err);
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      if (!silent) {
        toast.error(errorMessage);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const fetchPendingPaymentOrders = async () => {
    try {
      const response = await api.get(API.ORDERS.PENDING_PAYMENT);
      setPendingPaymentOrders(response.data.data || []);
    } catch (err) {
      console.error("Error fetching pending payment orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage);
    fetchPendingPaymentOrders();
  }, [currentPage]);

  // ✅ REAL-TIME UPDATES via WebSocket (replaces polling)
  const handleOrdersListUpdate = useCallback(() => {
    console.log("🔔 Orders list updated - refreshing silently");
    fetchOrders(currentPage, true); // Silent refresh
    fetchPendingPaymentOrders();
  }, [currentPage]);

  // Connect to WebSocket for real-time orders list updates
  useOrdersListSocket(user?._id, "buyer", handleOrdersListUpdate);

  const getTimeRemaining = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = 30 * 60 * 1000 - (now - created);

    if (diffMs <= 0) return { expired: true, minutes: 0, seconds: 0 };

    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);

    return { expired: false, minutes, seconds };
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getStatusIcon = (status) => {
    const statusMap = {
      "Payment Pending": <FiPackage className="w-5 h-5" />,
      Confirmed: <FiCheckCircle className="w-5 h-5" />,
      Processing: <FiPackage className="w-5 h-5" />,
      Packed: <FiPackage className="w-5 h-5" />,
      Shipped: <FiTruck className="w-5 h-5" />,
      "In Transit": <FiTruck className="w-5 h-5" />,
      "Out for Delivery": <FiTruck className="w-5 h-5" />,
      Delivered: <FiCheckCircle className="w-5 h-5" />,
      Completed: <FiCheckCircle className="w-5 h-5" />,
      Cancelled: <FiXCircle className="w-5 h-5" />,
      Pending: <FiPackage className="w-5 h-5" />,
    };
    return statusMap[status] || <FiPackage className="w-5 h-5" />;
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      const response = await api.get(`/invoices/${orderId}/download`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Cotchel-Invoice-${orderId.slice(-8).toUpperCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error(
        error.response?.data?.message || "Failed to download invoice"
      );
    }
  };

  const handleCancelPendingOrder = async (orderId) => {
    try {
      setCancellingOrder(orderId);
      await api.delete(API.ORDERS.CANCEL_PENDING(orderId));
      toast.success("Order cancelled successfully");

      // Refresh cart counter (items were restored to cart after cancellation)
      await fetchAndSyncCart(dispatch);

      fetchOrders(currentPage);
      fetchPendingPaymentOrders();
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error(handleApiError(error));
    } finally {
      setCancellingOrder(null);
    }
  };

  const handleRetryPayment = async (orderId) => {
    try {
      const eligibilityResponse = await api.get(
        API.ORDERS.CAN_RETRY_PAYMENT(orderId)
      );

      if (!eligibilityResponse.data.data.canRetry) {
        toast.error(
          eligibilityResponse.data.data.message || "Payment cannot be retried"
        );
        return;
      }

      const response = await api.post(API.ORDERS.RETRY_PAYMENT(orderId));
      const paymentData = response.data.data;

      const options = {
        key: "rzp_test_JuxnZBxv767oxR",
        amount: paymentData.amount * 100,
        currency: "INR",
        name: "Cotchel",
        description: "Complete your payment",
        order_id: paymentData.paymentOrderId,
        handler: async function (razorpayResponse) {
          try {
            await api.post(API.ORDERS.VERIFY_PAYMENT, {
              order_id: paymentData.paymentOrderId,
              payment_id: razorpayResponse.razorpay_payment_id,
              signature: razorpayResponse.razorpay_signature,
            });

            toast.success("Payment successful!");

            // Refresh cart counter (order completed, items removed from cart)
            await fetchAndSyncCart(dispatch);

            fetchOrders(currentPage);
            fetchPendingPaymentOrders();
          } catch (error) {
            console.error("Payment verification failed:", error);
            toast.error(handleApiError(error));
          }
        },
        modal: {
          ondismiss: function () {
            toast.info("Payment cancelled. You can retry anytime.");
          },
        },
        theme: {
          color: "#0c0b45",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Error retrying payment:", error);
      toast.error(handleApiError(error));
    }
  };

  const CountdownTimer = ({ createdAt, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState(getTimeRemaining(createdAt));

    useEffect(() => {
      const timer = setInterval(() => {
        const remaining = getTimeRemaining(createdAt);
        setTimeLeft(remaining);

        if (remaining.expired && onExpire) {
          onExpire();
        }
      }, 1000);

      return () => clearInterval(timer);
    }, [createdAt, onExpire]);

    if (timeLeft.expired) {
      return <span className="text-red-600 font-medium">Expired</span>;
    }

    return (
      <span className="text-orange-600 font-medium">
        {timeLeft.minutes}m {timeLeft.seconds}s remaining
      </span>
    );
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">{error}</h2>
        <button
          onClick={() => fetchOrders(currentPage)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#0D0B46] hover:bg-[#23206a]"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto bg-transparent p-0 mt-8 pb-20">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8 flex items-center gap-2">
        Order History
      </h1>

      {/* Pending Payment Orders Section */}
      {pendingPaymentOrders.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FiAlertCircle className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Payment Orders
            </h2>
          </div>
          {pendingPaymentOrders.map((order) => (
            <div
              key={order._id}
              className="border-2 border-orange-200 rounded-xl bg-orange-50 p-6 mb-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order #{order._id}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Created on{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-orange-600">
                  <FiClock className="w-5 h-5" />
                  <CountdownTimer
                    createdAt={order.createdAt}
                    onExpire={() => {
                      fetchPendingPaymentOrders();
                      fetchOrders(currentPage);
                    }}
                  />
                </div>
              </div>

              <div className="border-t border-orange-200 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {order.products.map((product) => (
                    <div
                      key={product.product._id}
                      className="flex items-center gap-4"
                    >
                      <img
                        src={
                          product.product.featuredImage || "/placeholder.png"
                        }
                        alt={product.product.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {product.product.title}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Qty: {product.quantity}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          ₹{product.totalPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-orange-200 mt-4 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ₹{order.totalPrice.toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRetryPayment(order._id)}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    <FiCreditCard className="w-4 h-4" />
                    Complete Payment
                  </button>
                  <button
                    onClick={() => handleCancelPendingOrder(order._id)}
                    disabled={cancellingOrder === order._id}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiXCircle className="w-4 h-4" />
                    {cancellingOrder === order._id
                      ? "Cancelling..."
                      : "Cancel Order"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Regular Orders Section */}
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No orders yet
          </h2>
          <p className="text-gray-500 mb-6">
            When you place orders, they will appear here.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#0D0B46] hover:bg-[#23206a]"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div>
          {orders.map((order) => (
            <div
              key={order.orderId}
              className="border border-gray-200 rounded-xl bg-white p-6 mb-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order #{order.orderId}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Placed on{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(
                    order.status
                  )}`}
                >
                  {getStatusIcon(order.status)}
                  {order.status}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {order.products.map((product) => (
                    <div
                      key={product.productId}
                      className="flex items-center gap-4"
                    >
                      <Link
                        to={`/product/${product.productId}`}
                        className="flex-shrink-0"
                      >
                        <img
                          src={product.featuredImage || "/placeholder.png"}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                      <div>
                        <Link
                          to={`/product/${product.productId}`}
                          className="block"
                        >
                          <h4 className="text-sm font-medium text-gray-900 hover:text-[#0D0B46] transition-colors">
                            {product.name}
                          </h4>
                        </Link>
                        <p className="text-sm text-gray-500">
                          Qty: {product.quantity}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          ₹{product.totalPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 mt-4 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ₹{order.totalPrice.toFixed(2)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {order.status === "Payment Pending" &&
                    order.paymentStatus === "Pending" && (
                      <>
                        <button
                          onClick={() => handleRetryPayment(order.orderId)}
                          className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                        >
                          <FiCreditCard className="w-4 h-4" />
                          Retry Payment
                        </button>
                        <button
                          onClick={() =>
                            handleCancelPendingOrder(order.orderId)
                          }
                          disabled={cancellingOrder === order.orderId}
                          className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FiXCircle className="w-4 h-4" />
                          {cancellingOrder === order.orderId
                            ? "Cancelling..."
                            : "Cancel"}
                        </button>
                      </>
                    )}
                  {canDownloadInvoice(order.status, order.paymentStatus) && (
                    <button
                      onClick={() => handleDownloadInvoice(order.orderId)}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <FiDownload className="w-4 h-4" />
                      Invoice
                    </button>
                  )}
                  <Link
                    to={`/buyer/orders/${order.orderId}`}
                    className="inline-flex items-center px-4 py-2 border border-[#0D0B46] text-sm font-medium rounded-md text-[#0D0B46] hover:bg-[#0D0B46] hover:text-white transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  handlePageChange(Math.min(currentPage + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
