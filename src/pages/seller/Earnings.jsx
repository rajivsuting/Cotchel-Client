import React, { useState, useEffect } from "react";
import { AiOutlineDollar, AiOutlineArrowUp } from "react-icons/ai";
import { FiDownload } from "react-icons/fi";
import api from "../../services/apiService";
import { format } from "date-fns";
import { API, API_CONFIG } from "../../config/api";

const Earnings = () => {
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

  useEffect(() => {
    fetchEarningsStats();
    fetchTransactions();
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Earnings</h1>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-[#0c0b45] text-white rounded-md hover:bg-[#0c0b45]-dark transition-colors"
        >
          <FiDownload />
          Download Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm">Pending Payout</h3>
            <AiOutlineDollar className="text-yellow-500 text-xl" />
          </div>
          <p className="text-2xl font-semibold text-gray-800">
            ₹{earningsData.pendingPayout?.toLocaleString() || 0}
          </p>
          {earningsData.nextPayoutDate && (
            <p className="text-sm text-gray-500 mt-2">
              Next payout on{" "}
              {format(new Date(earningsData.nextPayoutDate), "MMM dd, yyyy")}
            </p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm">Last Payout</h3>
            <AiOutlineDollar className="text-green-500 text-xl" />
          </div>
          <p className="text-2xl font-semibold text-gray-800">
            ₹{earningsData.lastPayout?.amount?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {earningsData.lastPayout?.date
              ? `Paid on ${format(
                  new Date(earningsData.lastPayout.date),
                  "MMM dd, yyyy"
                )}`
              : "No payouts yet"}
          </p>
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
  );
};

export default Earnings;
