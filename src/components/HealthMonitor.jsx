import React, { useState, useEffect } from "react";
import { useHealthCheck } from "../hooks/useApi";

const HealthMonitor = ({ showDetails = false }) => {
  const { healthStatus, checkHealth } = useHealthCheck();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check health on component mount
    checkHealth();

    // Set up periodic health checks (every 30 seconds)
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, [checkHealth]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/monitoring/metrics", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showDetails) {
      fetchMetrics();
    }
  }, [showDetails]);

  const getStatusColor = (status) => {
    switch (status) {
      case "ok":
      case "healthy":
        return "text-green-600 bg-green-100";
      case "degraded":
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "error":
      case "unhealthy":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "ok":
      case "healthy":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "degraded":
      case "warning":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "error":
      case "unhealthy":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(" ");
  };

  if (!showDetails) {
    // Simple status indicator
    return (
      <div className="flex items-center space-x-2">
        <div
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
            healthStatus.status
          )}`}
        >
          {getStatusIcon(healthStatus.status)}
          <span className="ml-1 capitalize">{healthStatus.status}</span>
        </div>
        {healthStatus.lastCheck && (
          <span className="text-xs text-gray-500">
            {new Date(healthStatus.lastCheck).toLocaleTimeString()}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">System Health</h3>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Health Status */}
      <div className="mb-6">
        <div
          className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${getStatusColor(
            healthStatus.status
          )}`}
        >
          {getStatusIcon(healthStatus.status)}
          <span className="ml-2 capitalize">{healthStatus.status}</span>
        </div>
        {healthStatus.error && (
          <p className="mt-2 text-sm text-red-600">{healthStatus.error}</p>
        )}
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Database Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Database</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span
                  className={`text-sm font-medium ${getStatusColor(
                    metrics.database?.status
                  )}`}
                >
                  {metrics.database?.status || "Unknown"}
                </span>
              </div>
              {metrics.database?.responseTime && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Response:</span>
                  <span className="text-sm text-gray-900">
                    {metrics.database.responseTime}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Memory Usage */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Memory</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">RSS:</span>
                <span className="text-sm text-gray-900">
                  {formatBytes(metrics.process?.memory?.rss || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Heap Used:</span>
                <span className="text-sm text-gray-900">
                  {formatBytes(metrics.process?.memory?.heapUsed || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">System</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Uptime:</span>
                <span className="text-sm text-gray-900">
                  {formatUptime(metrics.system?.uptime?.process || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">CPU Cores:</span>
                <span className="text-sm text-gray-900">
                  {metrics.system?.cpu?.cores || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last Check */}
      {healthStatus.lastCheck && (
        <div className="mt-4 text-xs text-gray-500">
          Last checked: {new Date(healthStatus.lastCheck).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default HealthMonitor;
