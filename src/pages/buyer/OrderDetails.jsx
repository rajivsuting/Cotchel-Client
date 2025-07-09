import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/apiService";
import { API } from "../../config/api";
import {
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiArrowLeft,
} from "react-icons/fi";
import LoadingState from "../../components/LoadingState";

const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setError("Invalid order ID");
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get(API.ORDERS.GET(orderId))
      .then((res) => {
        setOrder(res.data.order);
        setError(null);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Error loading order details");
      })
      .finally(() => setLoading(false));
  }, [orderId]);

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

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Order Header */}
        <div className="p-6 border-b border-gray-200">
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

        {/* Order Details */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Products */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Products
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
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {product.name}
                      </h3>
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

            {/* Order Information */}
            <div className="space-y-6">
              {/* Shipping Address */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Shipping Address
                </h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-900">{order.address.name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {order.address.street}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.address.city}, {order.address.state} -{" "}
                    {order.address.pincode}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.address.country}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Phone: {order.address.phone}
                  </p>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Payment Information
                </h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
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
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Amount</span>
                    <span className="text-lg font-semibold text-gray-900">
                      ₹{order.totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seller Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Seller Information
                </h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">
                    {order.seller.businessName || order.seller.name}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {order.seller.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    Phone: {order.seller.phone}
                  </p>
                  {order.seller.address && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        {order.seller.address.addressLine1}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.seller.address.addressLine2}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.seller.address.city},{" "}
                        {order.seller.address.state} -{" "}
                        {order.seller.address.postalCode}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.seller.address.country}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
