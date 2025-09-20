import React, { useState, useEffect } from "react";
import {
  Bell,
  Search,
  User,
  ShoppingBag,
  TrendingUp,
  Box,
  Users,
  ArrowUp,
  ArrowDown,
  CreditCard,
  Package,
  Truck,
  CheckCircle,
  Menu,
  Star,
  AlertTriangle,
  Shirt,
  Watch,
  Footprints,
  CircuitBoard,
  Cpu,
  Monitor,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import sellerDashboardService from "../../services/sellerDashboardService";
import { useSellerVerification } from "../../hooks/useSellerVerification";

const SellerDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { isVerified } = useSellerVerification();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    stats: [],
    recentOrders: [],
    topProducts: [],
  });

  // Theme color - dark navy (#0c0b45)
  const themeColor = "#0c0b45";
  const themeLighter = "#1c1a7a";
  const themeLight = "#e8e8f0";

  useEffect(() => {
    // Only fetch dashboard data if seller is verified
    if (!isVerified) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await sellerDashboardService.getDashboardData();
        console.log(data);
        // Format the data for display
        setDashboardData({
          stats: data.stats.map((stat) => ({
            ...stat,
            value:
              stat.title === "Today's Sales" || stat.title === "Total Sales"
                ? `₹${(stat.value || 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : stat.value || 0,
          })),
          recentOrders: data.recentOrders.map((order) => ({
            ...order,
            date: new Date(order.date).toLocaleDateString(),
            amount: `₹${(order.amount || 0).toLocaleString()}`,
          })),
          topProducts: data.topProducts.map((product) => ({
            ...product,
            revenue: `₹${(product.revenue || 0).toLocaleString()}`,
          })),
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isVerified]);

  const handleViewProduct = (productId) => {
    navigate(`/products/${productId}`);
  };

  const handleOrderClick = (orderId) => {
    navigate(`/seller/dashboard/orders/${orderId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {dashboardData.stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md overflow-hidden transform transition-transform duration-300 hover:scale-105 hover:shadow-lg"
          >
            <div className="flex flex-col h-full">
              <div
                style={{ backgroundColor: themeColor }}
                className="px-6 py-3"
              >
                <div className="flex justify-between items-center">
                  <p className="text-white text-sm font-medium">{stat.title}</p>
                  {getStatIcon(stat.title)}
                </div>
              </div>
              <div className="px-6 py-4">
                <h3 className="text-2xl font-bold text-gray-800">
                  {stat.value}
                </h3>
                {stat.title !== "Active Orders" &&
                  stat.title !== "Total Products" &&
                  stat.title !== "Total Sales" && (
                    <div className="mt-2 flex items-center">
                      <span
                        className={`text-sm font-medium flex items-center ${
                          stat.positive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {stat.positive ? (
                          <ArrowUp size={14} />
                        ) : (
                          <ArrowDown size={14} />
                        )}
                        <span className="ml-1">{stat.change}</span>
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        vs yesterday
                      </span>
                    </div>
                  )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <div style={{ borderBottomColor: themeLight }} className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <span
                style={{ backgroundColor: themeLight }}
                className="p-1 rounded-md mr-2"
              >
                <ShoppingBag size={18} style={{ color: themeColor }} />
              </span>
              Recent Orders
            </h3>
            <span
              style={{ backgroundColor: themeLight, color: themeColor }}
              className="text-xs font-semibold px-2 py-1 rounded-full"
            >
              {dashboardData.recentOrders.length} new orders
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: themeLight }}>
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: themeColor }}
                >
                  Order
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: themeColor }}
                >
                  Product
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: themeColor }}
                >
                  Customer
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: themeColor }}
                >
                  Date
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: themeColor }}
                >
                  Status
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: themeColor }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dashboardData.recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleOrderClick(order.id)}
                >
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                    style={{ color: themeColor }}
                  >
                    {order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={order.image}
                        alt={order.product}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                      <span className="ml-2 text-sm text-gray-800">
                        {order.product}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {order.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full
                      ${
                        order.status === "Delivered"
                          ? "bg-green-100 text-green-800"
                          : order.status === "Processing"
                          ? "bg-blue-100 text-blue-800"
                          : order.status === "Shipped"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                    {order.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => navigate("/seller/dashboard/orders")}
            style={{ color: themeColor }}
            className="text-sm font-medium hover:underline"
          >
            View all orders →
          </button>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div style={{ borderBottomColor: themeLight }} className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <span
                style={{ backgroundColor: themeLight }}
                className="p-1 rounded-md mr-2"
              >
                <Box size={18} style={{ color: themeColor }} />
              </span>
              Top Selling Products
            </h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: themeLight }}>
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: themeColor }}
                >
                  Product
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: themeColor }}
                >
                  Sold
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: themeColor }}
                >
                  Revenue
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: themeColor }}
                >
                  Stock
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: themeColor }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dashboardData.topProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-800">
                        {product.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {product.sold} units
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                    {product.revenue}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full
                      ${
                        product.stock > 40
                          ? "bg-green-100 text-green-800"
                          : product.stock > 20
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.stock} in stock
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleViewProduct(product.id)}
                      style={{ color: themeColor }}
                      className="hover:underline font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => navigate("/seller/dashboard/products")}
            style={{ color: themeColor }}
            className="text-sm font-medium hover:underline"
          >
            View all products →
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to get stat icon
function getStatIcon(title) {
  switch (title) {
    case "Today's Sales":
      return <CreditCard size={20} className="text-white" />;
    case "Active Orders":
      return <ShoppingBag size={20} className="text-white" />;
    case "Total Products":
      return <Package size={20} className="text-white" />;
    case "Total Sales":
      return <CreditCard size={20} className="text-white" />;
    default:
      return null;
  }
}

export default SellerDashboard;
