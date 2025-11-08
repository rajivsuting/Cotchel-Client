import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../services/apiService";
import { API, handleApiError } from "../../config/api";
import {
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiArrowLeft,
  FiClock,
  FiDownload,
  FiCreditCard,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";
import LoadingState from "../../components/LoadingState";
import { canDownloadInvoice } from "../../utils/orderStatusUtils";
import { toast } from "react-hot-toast";
import { useOrderSocket } from "../../hooks/useSocket";
import { useDispatch } from "react-redux";
import { fetchAndSyncCart } from "../../utils/cartUtils";

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isLiveSync, setIsLiveSync] = useState(false);
  const [previousStatus, setPreviousStatus] = useState(null);

  const fetchOrderDetails = async (
    showLoader = true,
    isManualRefresh = false,
    syncShiprocket = false
  ) => {
    if (!orderId) {
      setError("Invalid order ID");
      setLoading(false);
      return;
    }

    if (showLoader) {
      setLoading(true);
    }
    if (isManualRefresh) {
      setRefreshing(true);
    }

    try {
      // First fetch order from database
      const res = await api.get(API.ORDERS.GET(orderId));
      const orderData = res.data.order;

      // If order has a shipment and we want real-time data, sync from Shiprocket
      if (syncShiprocket && orderData.shipmentId) {
        const activeStatuses = [
          "Confirmed",
          "Processing",
          "Packed",
          "Shipped",
          "In Transit",
          "Out for Delivery",
        ];

        if (activeStatuses.includes(orderData.status)) {
          try {
            console.log("Syncing tracking from Shiprocket...");
            setIsLiveSync(true);
            await api.post(API.ORDERS.SYNC_TRACKING(orderId));
            // Fetch order again after Shiprocket sync
            const updatedRes = await api.get(API.ORDERS.GET(orderId));
            const updatedOrder = updatedRes.data.order;

            // Show toast if status changed
            if (
              previousStatus &&
              updatedOrder.status !== previousStatus &&
              !isManualRefresh
            ) {
              toast.success(`Order status updated: ${updatedOrder.status}`);
            }

            setPreviousStatus(updatedOrder.status);
            setOrder(updatedOrder);
            console.log("Tracking synced from Shiprocket");
          } catch (syncErr) {
            console.error(
              "Shiprocket sync failed, using cached data:",
              syncErr
            );
            setOrder(orderData);
            setPreviousStatus(orderData.status);
          } finally {
            setIsLiveSync(false);
          }
        } else {
          setOrder(orderData);
          if (!previousStatus) setPreviousStatus(orderData.status);
        }
      } else {
        setOrder(orderData);
        if (!previousStatus) setPreviousStatus(orderData.status);
      }

      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || "Error loading order details");
    } finally {
      if (showLoader) {
        setLoading(false);
      }
      if (isManualRefresh) {
        setRefreshing(false);
      }
    }
  };

  // Initial fetch with Shiprocket sync
  useEffect(() => {
    fetchOrderDetails(true, false, true);
  }, [orderId]);

  // ✅ REAL-TIME UPDATES via WebSocket (replaces polling)
  const handleOrderUpdate = useCallback(
    (orderUpdate) => {
      console.log("🔔 Real-time order update received:", orderUpdate);

      // Update order state with new data
      setOrder((prevOrder) => {
        if (!prevOrder) return prevOrder;

        return {
          ...prevOrder,
          status: orderUpdate.status,
          paymentStatus: orderUpdate.paymentStatus,
          statusHistory: orderUpdate.statusHistory,
          awbCode: orderUpdate.awbCode,
          courierName: orderUpdate.courierName,
          trackingUrl: orderUpdate.trackingUrl,
          scheduledPickupDate: orderUpdate.scheduledPickupDate,
          pickupTime: orderUpdate.pickupTime,
          estimatedDeliveryDate: orderUpdate.estimatedDeliveryDate,
        };
      });

      // Show toast notification for status change
      if (previousStatus && orderUpdate.status !== previousStatus) {
        toast.success(`Order status updated: ${orderUpdate.status}`);
      }

      setPreviousStatus(orderUpdate.status);
      setLastUpdated(new Date());
    },
    [previousStatus]
  );

  // Connect to WebSocket for real-time updates
  useOrderSocket(orderId, handleOrderUpdate);

  // Update "seconds ago" counter every second
  useEffect(() => {
    if (!lastUpdated) return;

    const updateCounter = () => {
      const seconds = Math.floor((new Date() - lastUpdated) / 1000);
      setSecondsAgo(seconds);
    };

    updateCounter();
    const interval = setInterval(updateCounter, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  if (loading) return <LoadingState />;
  if (error)
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">{error}</h2>
        <Link
          to="/buyer/orders"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#0D0B46] hover:bg-[#23206a]"
        >
          Back to Orders
        </Link>
      </div>
    );
  if (!order)
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Order not found
        </h2>
        <Link
          to="/buyer/orders"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#0D0B46] hover:bg-[#23206a]"
        >
          Back to Orders
        </Link>
      </div>
    );

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "text-green-600 bg-green-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "cancelled":
        return "text-red-600 bg-red-50";
      case "shipped":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <FiCheckCircle className="w-5 h-5" />;
      case "pending":
        return <FiPackage className="w-5 h-5" />;
      case "cancelled":
        return <FiXCircle className="w-5 h-5" />;
      case "shipped":
        return <FiTruck className="w-5 h-5" />;
      default:
        return <FiPackage className="w-5 h-5" />;
    }
  };

  const handleDownloadInvoice = async () => {
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

  const getTimeRemaining = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = 30 * 60 * 1000 - (now - created);

    if (diffMs <= 0) return { expired: true, minutes: 0, seconds: 0 };

    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);

    return { expired: false, minutes, seconds };
  };

  const handleCancelPendingOrder = async () => {
    try {
      setCancellingOrder(true);
      await api.delete(API.ORDERS.CANCEL_PENDING(orderId));
      toast.success("Order cancelled successfully");

      // Refresh cart counter (items were restored to cart after cancellation)
      await fetchAndSyncCart(dispatch);

      // Refresh to show updated status
      await fetchOrderDetails(false);
      setCancellingOrder(false);
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error(handleApiError(error));
      setCancellingOrder(false);
    }
  };

  const handleRetryPayment = async () => {
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

            // Refresh order details to show updated status
            await fetchOrderDetails(false);
          } catch (error) {
            console.error("Payment verification failed:", error);
            toast.error("Payment verification failed. Please try again.");
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
      toast.error("Failed to retry payment. Please try again.");
    }
  };

  const CountdownTimer = ({ createdAt }) => {
    const [timeLeft, setTimeLeft] = useState(getTimeRemaining(createdAt));

    useEffect(() => {
      const timer = setInterval(() => {
        const remaining = getTimeRemaining(createdAt);
        setTimeLeft(remaining);

        if (remaining.expired) {
          window.location.reload();
        }
      }, 1000);

      return () => clearInterval(timer);
    }, [createdAt]);

    if (timeLeft.expired) {
      return <span className="text-red-600 font-medium">Expired</span>;
    }

    return (
      <span className="text-orange-600 font-medium">
        {timeLeft.minutes}m {timeLeft.seconds}s remaining
      </span>
    );
  };

  const OrderTrackingBar = ({
    order,
    onRefresh,
    isRefreshing,
    isLiveSyncing,
    lastUpdate,
    timeSinceUpdate,
  }) => {
    // Build timeline from actual status history (dynamic)
    const getRelevantStatuses = () => {
      if (!order.statusHistory || order.statusHistory.length === 0) {
        return [
          {
            key: order.status,
            label: order.status,
            description: "",
            timestamp: order.createdAt,
          },
        ];
      }

      // Map status history to display format
      const statusDescriptions = {
        "Payment Pending": "We have received your order",
        Confirmed: "Your order has been confirmed",
        Processing: "Seller is preparing your order",
        Packed: "Your order has been packed",
        Shipped: "Your order has been shipped",
        "In Transit": "Your order is on the way",
        "Out for Delivery": "Your order will be delivered today",
        Delivered: "Your order has been delivered",
      };

      return order.statusHistory.map((h) => ({
        key: h.status,
        label: h.status,
        description: h.note || statusDescriptions[h.status] || "",
        timestamp: h.timestamp,
      }));
    };

    // Check if order is cancelled
    if (
      order.status === "Cancelled" ||
      order.status === "Cancellation Requested"
    ) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Order Status
          </h3>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <FiXCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-base font-semibold text-red-600">
                {order.status === "Cancellation Requested"
                  ? "Cancellation Requested"
                  : "Order Cancelled"}
              </h4>
              {order.cancellationReason && (
                <p className="text-sm text-gray-600 mt-1">
                  {order.cancellationReason}
                </p>
              )}
              {order.cancelledAt && (
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(order.cancelledAt).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    const relevantStatuses = getRelevantStatuses();

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Delivery Status
            </h3>
            {isLiveSyncing && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
                Live Sync
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onRefresh}
              disabled={isRefreshing || isLiveSyncing}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
              title="Sync from Shiprocket"
            >
              <FiRefreshCw
                className={`w-3.5 h-3.5 ${
                  isRefreshing || isLiveSyncing ? "animate-spin" : ""
                }`}
              />
              {isLiveSyncing ? "Syncing..." : "Refresh"}
            </button>
            {lastUpdate && !isLiveSyncing && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-gray-500">
                  {timeSinceUpdate < 60
                    ? `${timeSinceUpdate}s ago`
                    : `${Math.floor(timeSinceUpdate / 60)}m ago`}
                </span>
              </div>
            )}
            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Track Shipment →
              </a>
            )}
          </div>
        </div>

        {/* Vertical Timeline */}
        <div className="relative">
          {relevantStatuses.map((status, index) => {
            const isLast = index === relevantStatuses.length - 1;
            const isCurrent = status.key === order.status;

            return (
              <div
                key={`${status.key}-${index}`}
                className="flex gap-4 pb-8 last:pb-0"
              >
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isCurrent
                        ? "bg-green-600 ring-4 ring-green-100"
                        : "bg-green-600"
                    }`}
                  />
                  {!isLast && (
                    <div className="w-0.5 h-full bg-green-600 mt-1" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 -mt-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4
                        className={`font-semibold ${
                          isCurrent ? "text-green-600" : "text-gray-900"
                        }`}
                      >
                        {status.label}
                      </h4>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {status.description}
                      </p>
                    </div>
                    {status.timestamp && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-500">
                          {new Date(status.timestamp).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(status.timestamp).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Shipment Details Card */}
        {(order.awbCode ||
          order.courierName ||
          order.estimatedDeliveryDate) && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Shipping Information
            </h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              {order.courierName && (
                <div className="flex items-center gap-3">
                  <FiTruck className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">Courier Partner</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {order.courierName}
                    </p>
                  </div>
                </div>
              )}
              {order.awbCode && (
                <div className="flex items-center gap-3">
                  <FiPackage className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">Tracking Number</p>
                    <p className="text-sm font-mono font-semibold text-gray-900">
                      {order.awbCode}
                    </p>
                  </div>
                </div>
              )}
              {order.estimatedDeliveryDate && (
                <div className="flex items-center gap-3">
                  <FiClock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">Expected Delivery</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(order.estimatedDeliveryDate).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          to="/buyer/orders"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Link>
      </div>

      {/* Payment Pending Alert */}
      {order.status === "Payment Pending" &&
        order.paymentStatus === "Pending" && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Payment Pending
                </h3>
                <p className="text-sm text-gray-700 mb-2">
                  Complete your payment to confirm this order. Your order will
                  be automatically cancelled if payment is not received within
                  30 minutes.
                </p>
                <div className="flex items-center gap-2 text-orange-600">
                  <FiClock className="w-4 h-4" />
                  <CountdownTimer createdAt={order.createdAt} />
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Order Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Order #{order.orderId}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Placed on{" "}
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {order.status === "Payment Pending" &&
              order.paymentStatus === "Pending" && (
                <>
                  <button
                    onClick={handleRetryPayment}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    <FiCreditCard className="w-4 h-4" />
                    Complete Payment
                  </button>
                  <button
                    onClick={handleCancelPendingOrder}
                    disabled={cancellingOrder}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiXCircle className="w-4 h-4" />
                    {cancellingOrder ? "Cancelling..." : "Cancel Order"}
                  </button>
                </>
              )}
            {canDownloadInvoice(order.status, order.paymentStatus) && (
              <button
                onClick={handleDownloadInvoice}
                className="inline-flex items-center gap-2 px-4 py-2 border border-[#0D0B46] text-sm font-medium rounded-md text-[#0D0B46] hover:bg-[#0D0B46] hover:text-white transition-colors"
              >
                <FiDownload className="w-4 h-4" />
                Download Invoice
              </button>
            )}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                order.status
              )}`}
            >
              {getStatusIcon(order.status)}
              {order.status}
            </div>
          </div>
        </div>
      </div>

      {/* Order Tracking Bar */}
      <OrderTrackingBar
        order={order}
        onRefresh={() => fetchOrderDetails(false, true, true)}
        isRefreshing={refreshing}
        isLiveSyncing={isLiveSync}
        lastUpdate={lastUpdated}
        timeSinceUpdate={secondsAgo}
      />

      {/* Order Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Order Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Payment Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span
                  className={`text-sm font-medium ${
                    order.paymentStatus === "Paid"
                      ? "text-green-600"
                      : "text-yellow-600"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Amount</span>
                <span className="text-sm font-semibold text-gray-900">
                  ₹{order.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Shipping Address
            </h3>
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900">{order.address.name}</p>
              <p className="mt-1">{order.address.street}</p>
              <p>
                {order.address.city}, {order.address.state} -{" "}
                {order.address.pincode}
              </p>
              <p>{order.address.country}</p>
              <p className="mt-1">Phone: {order.address.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Products</h2>
        <div className="space-y-4">
          {order.products.map((product) => (
            <div
              key={product.productId}
              className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
            >
              <Link
                to={`/product/${product.productId}`}
                className="flex-shrink-0"
              >
                <img
                  src={product.featuredImage || "/placeholder.png"}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded-lg hover:scale-105 transition-transform duration-300"
                />
              </Link>
              <div className="flex-1">
                <Link to={`/product/${product.productId}`} className="block">
                  <h3 className="text-sm font-medium text-gray-900 hover:text-[#0D0B46] transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-sm text-gray-500 mt-1">
                  Quantity: {product.quantity}
                </p>
                <div className="mt-2 flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Price: ₹{product.price.toFixed(2)}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    Total: ₹{product.totalPrice.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seller Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Seller Information
        </h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-900">
            {order.seller.businessName ||
              order.seller.personalName ||
              "Unknown Seller"}
          </p>
          <p className="text-sm text-gray-600 mt-1">{order.seller.email}</p>
          <p className="text-sm text-gray-600">
            Phone: {order.seller.phone || "Not provided"}
          </p>
          {order.seller.businessDetails?.address && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                {order.seller.businessDetails.address.addressLine1}
              </p>
              {order.seller.businessDetails.address.addressLine2 && (
                <p className="text-sm text-gray-600">
                  {order.seller.businessDetails.address.addressLine2}
                </p>
              )}
              <p className="text-sm text-gray-600">
                {order.seller.businessDetails.address.city},{" "}
                {order.seller.businessDetails.address.state} -{" "}
                {order.seller.businessDetails.address.postalCode}
              </p>
              <p className="text-sm text-gray-600">
                {order.seller.businessDetails.address.country}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
