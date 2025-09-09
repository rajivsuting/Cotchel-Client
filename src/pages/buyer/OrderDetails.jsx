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
  FiClock,
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

  const getOrderStepStatus = (step, currentStatus) => {
    const statusOrder = ["pending", "shipped", "completed"];
    const currentIndex = statusOrder.indexOf(currentStatus?.toLowerCase());
    const stepIndex = statusOrder.indexOf(step);

    if (currentStatus?.toLowerCase() === "cancelled") {
      return step === "cancelled" ? "active" : "inactive";
    }

    if (stepIndex <= currentIndex) {
      return stepIndex === currentIndex ? "active" : "completed";
    }
    return "pending";
  };

  const OrderTrackingBar = ({ status }) => {
    const steps = [
      {
        key: "pending",
        label: "Order Placed",
        sublabel: "Your order has been placed successfully",
        icon: <FiPackage className="w-5 h-5" />,
      },
      {
        key: "shipped",
        label: "Shipped",
        sublabel: "Your order has been shipped",
        icon: <FiTruck className="w-5 h-5" />,
      },
      {
        key: "completed",
        label: "Delivered",
        sublabel: "Your order has been delivered",
        icon: <FiCheckCircle className="w-5 h-5" />,
      },
    ];

    if (status?.toLowerCase() === "cancelled") {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-center">
            <FiXCircle className="w-6 h-6 text-red-500 mr-3" />
            <span className="text-red-600 font-medium text-lg">
              Order Cancelled
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Order Status
        </h3>
        <div className="relative">
          <div className="flex items-start justify-between">
            {steps.map((step, index) => {
              const stepStatus = getOrderStepStatus(step.key, status);
              const isLast = index === steps.length - 1;

              return (
                <div key={step.key} className="flex items-start flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        stepStatus === "completed"
                          ? "bg-green-500 border-green-500 text-white"
                          : stepStatus === "active"
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "bg-white border-gray-300 text-gray-400"
                      }`}
                    >
                      {stepStatus === "completed" ? (
                        <FiCheckCircle className="w-5 h-5" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <div className="mt-3 text-center flex-1">
                      <div
                        className={`text-sm font-medium ${
                          stepStatus === "completed"
                            ? "text-green-600"
                            : stepStatus === "active"
                            ? "text-blue-600"
                            : "text-gray-500"
                        }`}
                      >
                        {step.label}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {step.sublabel}
                      </div>
                    </div>
                  </div>
                  {!isLast && (
                    <div
                      className={`flex-1 h-0.5 mx-2 mt-5 ${
                        stepStatus === "completed"
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
              <FiClock className="w-4 h-4 mr-2" />
              Current Status: {status}
            </div>
          </div>
        </div>
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

      {/* Order Tracking Bar */}
      <OrderTrackingBar status={order.status} />

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
