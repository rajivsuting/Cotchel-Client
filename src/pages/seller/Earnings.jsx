import React, { useState, useEffect } from "react";
import { AiOutlineDollar, AiOutlineArrowUp } from "react-icons/ai";
import { FiDownload, FiAlertCircle, FiCheckCircle, FiClock, FiInfo, FiCreditCard } from "react-icons/fi";
import api from "../../services/apiService";
import { format, addDays, nextMonday } from "date-fns";
import { API, API_CONFIG } from "../../config/api";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const Earnings = () => {
  const { user } = useAuth();
  const [earningsData, setEarningsData] = useState({
    totalEarnings: 0,
    pendingPayout: 0,
    lastPayout: null,
    growthPercentage: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [limit] = useState(10);
  const [bankDetails, setBankDetails] = useState(null);

  useEffect(() => {
    fetchEarningsStats();
    fetchTransactions();
    fetchBankDetails();
  }, [currentPage]);

  const fetchEarningsStats = async () => {
    try {
      setLoading(true);
      const response = await api.get(API.USER.SELLER_EARNINGS_STATS);
      setEarningsData(response.data.data);
    } catch (err) {
      setError("Failed to fetch earnings statistics");
    } finally {
      setLoading(false);
    }
  };

  const fetchBankDetails = async () => {
    try {
      const response = await api.get(API.USER.PROFILE);
      if (response.data.data?.sellerDetails) {
        setBankDetails(response.data.data.sellerDetails);
      }
    } catch (err) {
      console.error("Error fetching bank details:", err);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get(API.USER.SELLER_EARNINGS_TRANSACTIONS, {
        params: {
          page: currentPage,
          limit,
        },
      });
      setTransactions(response.data.data.transactions);
      setTotalPages(response.data.data.pagination.totalPages);
      setTotalTransactions(response.data.data.pagination.totalTransactions);
    } catch (err) {
      setError("Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get(API.USER.SELLER_EARNINGS_TRANSACTIONS, {
        params: {
          limit: 1000,
        },
      });

      // Get the transactions data
      const transactions = response.data.data.transactions;

      // Define CSV headers
      const headers = [
        "Order ID",
        "Buyer Name",
        "Buyer Email",
        "Date",
        "Amount",
        "Payment Method",
        "Status",
      ];

      // Convert transactions to CSV rows
      const csvRows = transactions.map((transaction) => [
        transaction.id.slice(-6),
        transaction.buyer.name,
        transaction.buyer.email,
        format(new Date(transaction.date), "yyyy-MM-dd"),
        transaction.amount,
        transaction.paymentMethod,
        transaction.status,
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(","),
        ...csvRows.map((row) => row.join(",")),
      ].join("\n");

      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `earnings-report-${format(new Date(), "yyyy-MM-dd")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to export transactions");
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  // Calculate next payout date (next Monday)
  const getNextPayoutDate = () => {
    const today = new Date();
    const next = nextMonday(today);
    return next;
  };

  const hasBankDetails = !!(
    bankDetails?.bankName &&
    bankDetails?.accountNumber &&
    bankDetails?.ifscCode
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Earnings & Payouts</h1>
            <p className="text-gray-600">Track your earnings and payout schedule</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-[#0c0b45] text-white rounded-lg hover:bg-[#1a1860] transition-colors shadow-sm"
          >
            <FiDownload />
            Export Report
          </button>
        </div>

        {/* Bank Details Alert */}
        {!hasBankDetails && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900 mb-1">
                  Bank Details Required for Payouts
                </h3>
                <p className="text-sm text-red-700 mb-3">
                  Please add your bank account details to receive weekly payouts. You can add them in your Account Settings.
                </p>
                <a
                  href="/seller/dashboard/account"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                >
                  <FiCreditCard className="w-4 h-4" />
                  Add Bank Details
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Payout Schedule Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FiInfo className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payout Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-700 mb-1">
                    <span className="font-medium">Frequency:</span> Every Monday at 9:00 AM
                  </p>
                  <p className="text-gray-700 mb-1">
                    <span className="font-medium">Hold Period:</span> 7 days after delivery
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Minimum Payout:</span> ₹100
                  </p>
                </div>
                <div>
                  <p className="text-gray-700 mb-1">
                    <span className="font-medium">Commission:</span> 10% platform fee
                  </p>
                  <p className="text-gray-700 mb-1">
                    <span className="font-medium">Processing Time:</span> 1-2 business days
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Next Payout:</span> {format(getNextPayoutDate(), "EEEE, MMM dd, yyyy")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm">Total Earnings</h3>
            <AiOutlineDollar className="text-[#0c0b45] text-xl" />
          </div>
          <p className="text-2xl font-semibold text-gray-800">
            ₹{earningsData.totalEarnings?.toLocaleString() || 0}
          </p>
          {earningsData.growthPercentage !== undefined && (
            <div className="flex items-center mt-2 text-green-600">
              <AiOutlineArrowUp />
              <span className="text-sm">
                {earningsData.growthPercentage}% from last month
              </span>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-yellow-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Pending Payout</h3>
            <FiClock className="text-yellow-600 text-xl" />
          </div>
          <p className="text-3xl font-bold text-yellow-600">
            ₹{earningsData.pendingPayout?.toLocaleString() || 0}
          </p>
          <div className="mt-3 space-y-1">
            <p className="text-xs text-gray-500">
              Payout on: {format(getNextPayoutDate(), "EEEE, MMM dd")}
            </p>
            {earningsData.pendingPayout > 0 && (
              <p className="text-xs text-green-600 font-medium">
                Available in {Math.ceil((getNextPayoutDate() - new Date()) / (1000 * 60 * 60 * 24))} days
              </p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Last Payout</h3>
            <FiCheckCircle className="text-green-600 text-xl" />
          </div>
          <p className="text-3xl font-bold text-green-600">
            ₹{earningsData.lastPayout?.amount?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {earningsData.lastPayout?.date
              ? `Paid on ${format(
                  new Date(earningsData.lastPayout.date),
                  "MMM dd, yyyy"
                )}`
              : "No payouts yet"}
          </p>
        </div>

        {/* Bank Details Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Bank Account</h3>
            <FiCreditCard className="text-blue-600 text-xl" />
          </div>
          {hasBankDetails ? (
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Bank Name</p>
                <p className="text-sm font-semibold text-gray-900">{bankDetails.bankName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Account Number</p>
                <p className="text-sm font-mono font-semibold text-gray-900">
                  ****{bankDetails.accountNumber?.slice(-4)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">IFSC Code</p>
                <p className="text-sm font-mono text-gray-900">{bankDetails.ifscCode}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-gray-500 mb-2">No bank details added</p>
              <a
                href="/seller/dashboard/account"
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Add Now →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">
          Recent Transactions
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Buyer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-gray-50 transition-opacity duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      #{transaction.id.slice(-6)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium">{transaction.buyer.name}</p>
                        <p className="text-sm text-gray-500">
                          {transaction.buyer.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(transaction.date), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ₹{transaction.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        {transaction.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          transaction.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : transaction.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && transactions.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 mt-6">
            <div className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-medium">
                {(currentPage - 1) * limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(currentPage * limit, totalTransactions)}
              </span>{" "}
              of <span className="font-medium">{totalTransactions}</span>{" "}
              transactions
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-md transition-colors ${
                  currentPage === 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                aria-label="Previous page"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
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
                aria-label="Next page"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default Earnings;
