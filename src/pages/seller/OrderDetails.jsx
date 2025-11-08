import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../services/apiService";
import { API } from "../../config/api";
import {
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiArrowLeft,
  FiClock,
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiDownload,
  FiRefreshCw,
  FiAlertCircle,
  FiPrinter,
} from "react-icons/fi";
import LoadingState from "../../components/LoadingState";
import { canDownloadInvoice } from "../../utils/orderStatusUtils";
import { toast } from "react-hot-toast";
import { useOrderSocket } from "../../hooks/useSocket";

const SellerOrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingLabel, setGeneratingLabel] = useState(false);

  const fetchOrderDetails = async (showLoader = true) => {
    if (!orderId) {
      setError("Invalid order ID");
      setLoading(false);
      return;
    }

    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const res = await api.get(API.ORDERS.GET(orderId));
      setOrder(res.data.order);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || "Error loading order details");
    } finally {
      if (showLoader) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  const handleGenerateLabel = async () => {
    try {
      setGeneratingLabel(true);
      const response = await api.post(API.ORDERS.GENERATE_LABEL(orderId));
      
      if (response.data.success) {
        toast.success("Shipping label generated successfully!");
        // Refresh order details to show new shipping info
        await fetchOrderDetails(false);
      }
    } catch (error) {
      console.error("Error generating label:", error);
      
      const errorData = error.response?.data;
      
      // Generic error message for sellers (admin will handle backend issues)
      toast.error(
        "Unable to generate shipping label at the moment. Please contact support or try again later.",
        { duration: 5000 }
      );
    } finally {
      setGeneratingLabel(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails(true);
  }, [orderId]);

  // ✅ REAL-TIME UPDATES via WebSocket (replaces polling)
  const handleOrderUpdate = useCallback((orderUpdate) => {
    console.log("🔔 Seller: Real-time order update received:", orderUpdate);
    
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

    toast.success(`Order ${orderUpdate.status}`);
    setLastUpdated(new Date());
  }, []);

  // Connect to WebSocket for real-time updates
  useOrderSocket(orderId, handleOrderUpdate);

  // Update "seconds ago" counter
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
        <button
          onClick={() => navigate("/seller/dashboard/orders")}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#0D0B46] hover:bg-[#23206a]"
        >
          Back to Orders
        </button>
      </div>
    );
  if (!order)
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Order not found
        </h2>
        <button
          onClick={() => navigate("/seller/dashboard/orders")}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#0D0B46] hover:bg-[#23206a]"
        >
          Back to Orders
        </button>
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

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "text-green-600 bg-green-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "failed":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const response = await api.get(`/invoices/${orderId}/download`, {
        responseType: "blob",
      });

      // Create blob and download
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate("/seller/dashboard/orders")}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </button>
        </div>

        {/* Order Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
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
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {lastUpdated && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Updated {secondsAgo < 60 ? `${secondsAgo}s` : `${Math.floor(secondsAgo / 60)}m`} ago
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => fetchOrderDetails(false)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              {canDownloadInvoice(order.status, order.paymentStatus) && (
                <button
                  onClick={handleDownloadInvoice}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-[#0D0B46] text-sm font-medium rounded-md text-[#0D0B46] hover:bg-[#0D0B46] hover:text-white transition-colors"
                >
                  <FiDownload className="w-4 h-4" />
                  Invoice
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
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(
                  order.paymentStatus
                )}`}
              >
                <FiClock className="w-4 h-4" />
                Payment: {order.paymentStatus}
              </div>
            </div>
          </div>
        </div>

        {/* Seller Action Alert */}
        {/* Seller Action Buttons */}
        {(order.status === "Processing" || order.status === "Confirmed") && !order.awbCode && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiPackage className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ready to Ship?
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  Pack your order and generate the shipping label. We'll automatically assign the best courier and schedule pickup for you.
                </p>
                <button
                  onClick={handleGenerateLabel}
                  disabled={generatingLabel}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#0c0b45] text-white rounded-lg font-medium hover:bg-[#0c0b45]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingLabel ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Generating Label...
                    </>
                  ) : (
                    <>
                      <FiPackage />
                      Generate Shipping Label
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {order.status === "Packed" && order.awbCode && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Action Required: Keep Order Ready for Pickup
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  Courier pickup has been scheduled. Please keep your packed order ready.
                </p>
                <div className="bg-white border border-blue-200 rounded p-3 space-y-2">
                  {order.scheduledPickupDate && (
                    <div className="flex items-center justify-between text-sm bg-orange-50 -mx-3 -mt-3 px-3 py-2 border-b border-orange-200">
                      <span className="text-gray-900 font-semibold flex items-center gap-2">
                        <FiClock className="text-orange-600" />
                        Pickup Scheduled:
                      </span>
                      <span className="font-bold text-orange-700">
                        {new Date(order.scheduledPickupDate).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })} at {order.pickupTime || "10:00 AM"}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Courier Partner:</span>
                    <span className="font-semibold text-gray-900">{order.courierName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">AWB Code:</span>
                    <span className="font-mono font-semibold text-gray-900">{order.awbCode}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shipping Information Card */}
        {(order.awbCode || order.courierName || order.estimatedDeliveryDate) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FiTruck className="w-5 h-5" />
                Shipping Details
              </h2>
              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Tracking →
                </a>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {order.courierName && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Courier Partner</p>
                  <p className="text-sm font-semibold text-gray-900">{order.courierName}</p>
                </div>
              )}
              {order.awbCode && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">AWB / Tracking Number</p>
                  <p className="text-sm font-mono font-semibold text-gray-900">{order.awbCode}</p>
                </div>
              )}
              {order.shipmentId && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Shipment ID</p>
                  <p className="text-sm font-mono font-semibold text-gray-900">{order.shipmentId}</p>
                </div>
              )}
              {order.estimatedDeliveryDate && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Expected Delivery</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(order.estimatedDeliveryDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Status Timeline */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h2>
            <div className="space-y-4">
              {order.statusHistory.map((history, index) => {
                const isLast = index === order.statusHistory.length - 1;
                const isCurrent = history.status === order.status;
                
                return (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${isCurrent ? 'bg-green-600 ring-4 ring-green-100' : 'bg-green-600'}`} />
                      {!isLast && (
                        <div className="w-0.5 h-full bg-green-600 mt-1 min-h-[2rem]" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className={`font-semibold ${isCurrent ? 'text-green-600' : 'text-gray-900'}`}>
                            {history.status}
                          </h4>
                          {history.note && (
                            <p className="text-sm text-gray-600 mt-0.5">{history.note}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-gray-500">
                            {new Date(history.timestamp).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(history.timestamp).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Products Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Products Ordered
              </h2>
              <div className="space-y-4">
                {order.products.map((product) => (
                  <div
                    key={product.productId}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <img
                      src={product.featuredImage || "/placeholder.png"}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {product.name}
                      </h3>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Quantity:</span>{" "}
                          {product.quantity}
                        </div>
                        <div>
                          <span className="font-medium">Unit Price:</span> ₹
                          {product.price.toFixed(2)}
                        </div>
                        <div>
                          <span className="font-medium">Total:</span> ₹
                          {product.totalPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">
                    ₹{order.totalPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">Free</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-base font-semibold text-gray-900">
                      Total
                    </span>
                    <span className="text-base font-semibold text-gray-900">
                      ₹{order.totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Customer & Shipping Info */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiUser className="w-5 h-5 mr-2" />
                Customer Information
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <FiUser className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">
                    {typeof order.buyer === "object"
                      ? order.buyer.name
                      : order.buyer}
                  </span>
                </div>
                {(order.buyer?.email || order.buyerEmail) && (
                  <div className="flex items-center gap-2 text-sm">
                    <FiMail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {order.buyer?.email || order.buyerEmail}
                    </span>
                  </div>
                )}
                {(order.buyer?.phone || order.address?.phone) && (
                  <div className="flex items-center gap-2 text-sm">
                    <FiPhone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {order.buyer?.phone || order.address?.phone}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiMapPin className="w-5 h-5 mr-2" />
                Shipping Address
              </h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-900">
                  {order.address?.name}
                </p>
                <p>{order.address?.street}</p>
                <p>
                  {order.address?.city}, {order.address?.state} -{" "}
                  {order.address?.pincode}
                </p>
                <p>{order.address?.country}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerOrderDetails;
