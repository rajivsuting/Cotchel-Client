import React, { useState, useEffect, useCallback } from "react";
import api from "../../services/apiService";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  Package2,
  IndianRupee,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { API, API_CONFIG } from "../../config/api";
import { useOrdersListSocket } from "../../hooks/useSocket";
import { useAuth } from "../../context/AuthContext";

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
  "Payment Failed": "bg-red-100 text-red-800",
  "Payment Pending": "bg-yellow-100 text-yellow-800",
  Shipped: "bg-blue-100 text-blue-800",
};

const paymentStatusColors = {
  Pending: "bg-yellow-100 text-yellow-800",
  Paid: "bg-green-100 text-green-800",
  Failed: "bg-red-100 text-red-800",
};

const StatusIcon = ({ status }) => {
  switch (status) {
    case "Completed":
      return <CheckCircle className="w-4 h-4" />;
    case "Cancelled":
    case "Payment Failed":
      return <XCircle className="w-4 h-4" />;
    case "Pending":
    case "Payment Pending":
      return <Clock className="w-4 h-4" />;
    case "Shipped":
      return <Truck className="w-4 h-4" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
};

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [limit] = useState(10);
  const [exporting, setExporting] = useState(false);

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const response = await api.get(API.ORDERS.ALL);
      setOrders(response.data.orders);
      setTotalPages(response.data.pagination.totalPages);
      setTotalOrders(response.data.pagination.totalOrders);
    } catch (err) {
      setError("Failed to fetch orders");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // Separate orders that need action (label generation)
  const ordersNeedingAction = orders.filter(
    (order) =>
      (order.status === "Processing" || order.status === "Confirmed") &&
      !order.awbCode
  );

  const regularOrders = orders.filter(
    (order) =>
      !(
        (order.status === "Processing" || order.status === "Confirmed") &&
        !order.awbCode
      )
  );

  useEffect(() => {
    fetchOrders(false);
  }, []);

  // ✅ REAL-TIME UPDATES via WebSocket (replaces polling)
  const handleOrdersListUpdate = useCallback(() => {
    console.log("🔔 Seller: Orders list updated - refreshing silently");
    fetchOrders(true); // Silent refresh
  }, []);

  // Connect to WebSocket for real-time orders list updates
  useOrdersListSocket(user?._id, "seller", handleOrdersListUpdate);

  const handleOrderClick = (orderId) => {
    navigate(`/seller/dashboard/orders/${orderId}`);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await api.get(API.ORDERS.ALL, {
        params: {
          limit: 1000,
        },
      });

      const ordersToExport = response.data.orders;
      const csvData = [
        [
          "Order ID",
          "Date",
          "Buyer",
          "Products",
          "Quantity",
          "Total Price",
          "Status",
          "Payment Status",
          "Shipping Address",
        ],
        ...ordersToExport.map((order) => [
          order.orderId,
          format(new Date(order.createdAt), "PPp"),
          order.buyer,
          order.products.map((p) => p.name).join(", "),
          order.products.map((p) => p.quantity).reduce((a, b) => a + b, 0),
          order.totalPrice.toFixed(2),
          order.status,
          order.paymentStatus,
          `${order.address?.street || ""}, ${order.address?.city || ""}, ${
            order.address?.state || ""
          } - ${order.address?.pincode || ""}`,
        ]),
      ];

      const csvString = csvData
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `seller_orders_${format(new Date(), "yyyy-MM-dd")}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Error exporting orders:", err);
      setError("Failed to export orders. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
              {ordersNeedingAction.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-orange-500 text-white animate-pulse">
                  <AlertCircle className="w-4 h-4" />
                  {ordersNeedingAction.length} Need Action
                </span>
              )}
            </div>
            <p className="text-gray-600">Manage your orders</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              disabled={exporting || loading}
              className={`px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 flex items-center transition-colors ${
                (exporting || loading) && "opacity-50 cursor-not-allowed"
              }`}
            >
              <Download
                size={16}
                className={`mr-2 ${exporting && "animate-bounce"}`}
              />
              {exporting ? "Exporting..." : "Export"}
            </button>
          </div>
        </div>

        {/* Action Required Section */}
        {ordersNeedingAction.length > 0 && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                    {ordersNeedingAction.length}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Action Required: Generate Shipping Labels
                    </h2>
                    <p className="text-sm text-gray-600">
                      These orders are ready to ship. Click to generate shipping
                      labels.
                    </p>
                  </div>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>

              <div className="space-y-3">
                {ordersNeedingAction.map((order) => (
                  <div
                    key={order.orderId}
                    onClick={() => handleOrderClick(order.orderId)}
                    className="bg-white border-2 border-orange-200 rounded-lg p-4 hover:border-orange-400 cursor-pointer transition-all hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Order ID</p>
                          <p className="text-sm font-semibold text-gray-900">
                            #{order.orderId}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(order.createdAt), "PPp")}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Products</p>
                          <div className="flex items-center gap-2">
                            {order.products[0]?.featuredImage && (
                              <img
                                src={order.products[0].featuredImage}
                                alt={order.products[0].name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {order.products[0]?.name}
                              </p>
                              {order.products.length > 1 && (
                                <p className="text-xs text-gray-500">
                                  +{order.products.length - 1} more
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Buyer</p>
                          <p className="text-sm font-medium text-gray-900">
                            {order.buyerName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.buyerPhone}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Amount</p>
                          <p className="text-lg font-bold text-gray-900">
                            ₹{order.totalPrice.toFixed(2)}
                          </p>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                            <CheckCircle className="w-3 h-3" />
                            {order.paymentStatus}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold bg-orange-100 text-orange-700 border border-orange-300">
                          <Package2 className="w-4 h-4" />
                          {order.status}
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* All Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              All Orders ({regularOrders.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Buyer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {regularOrders.map((order) => (
                  <tr
                    key={order.orderId}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleOrderClick(order.orderId)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{order.orderId}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(order.createdAt), "PPp")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {order.products.map((product) => (
                          <div
                            key={`${order.orderId}-${product.productId}`}
                            className="flex items-center gap-2"
                          >
                            <img
                              src={product.featuredImage}
                              alt={product.name}
                              className="w-10 h-10 rounded-md object-cover"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                Qty: {product.quantity}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.buyer}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.address?.city && `${order.address.city}, `}
                            {order.address?.state}
                            {order.address?.pincode &&
                              ` - ${order.address.pincode}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[order.status]
                          }`}
                        >
                          <StatusIcon status={order.status} />
                          {order.status}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            paymentStatusColors[order.paymentStatus]
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                        {order.awbCode && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <Truck className="w-3 h-3" />
                            Auto-Tracking
                          </span>
                        )}
                        {order.scheduledPickupDate &&
                          order.status === "Packed" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                              <Clock className="w-3 h-3" />
                              Pickup:{" "}
                              {new Date(
                                order.scheduledPickupDate
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              {order.pickupTime}
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        <IndianRupee className="w-4 h-4" />
                        {order.totalPrice.toFixed(2)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading &&
            regularOrders.length === 0 &&
            ordersNeedingAction.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Package2 className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  No orders found
                </h3>
                <p className="mt-1 text-gray-500">
                  There are no orders to display at the moment.
                </p>
              </div>
            )}

          {!loading &&
            regularOrders.length === 0 &&
            ordersNeedingAction.length > 0 && (
              <div className="text-center py-8 px-4">
                <p className="text-sm text-gray-500">
                  All your orders require action. See the section above.
                </p>
              </div>
            )}

          {!loading && orders.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * limit, totalOrders)}
                </span>{" "}
                of <span className="font-medium">{totalOrders}</span> orders
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className={`p-2 rounded-md transition-colors ${
                    currentPage === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-md transition-colors ${
                        currentPage === page
                          ? "bg-[#0c0b45] text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-md transition-colors ${
                    currentPage === totalPages
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
