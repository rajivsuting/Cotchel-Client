/**
 * Order Status Utilities - Centralized status colors and icons
 */

export const getOrderStatusColor = (status) => {
  const statusColors = {
    // Pre-payment
    "Payment Pending": "bg-amber-100 text-amber-800",
    
    // Post-payment
    "Confirmed": "bg-blue-100 text-blue-800",
    "Processing": "bg-indigo-100 text-indigo-800",
    "Packed": "bg-purple-100 text-purple-800",
    
    // Shipping
    "Shipped": "bg-sky-100 text-sky-800",
    "In Transit": "bg-cyan-100 text-cyan-800",
    "Out for Delivery": "bg-teal-100 text-teal-800",
    
    // Delivery
    "Delivered": "bg-green-100 text-green-800",
    "Completed": "bg-emerald-100 text-emerald-800",
    
    // Cancellation/Returns
    "Cancellation Requested": "bg-orange-100 text-orange-800",
    "Cancelled": "bg-red-100 text-red-800",
    "Return Requested": "bg-yellow-100 text-yellow-800",
    "Return Approved": "bg-lime-100 text-lime-800",
    "Return Rejected": "bg-rose-100 text-rose-800",
    "Returned": "bg-violet-100 text-violet-800",
    "Refunded": "bg-fuchsia-100 text-fuchsia-800",
    
    // Failed Delivery
    "Delivery Failed": "bg-red-100 text-red-800",
    "RTO Initiated": "bg-orange-100 text-orange-800",
    "RTO Delivered": "bg-gray-100 text-gray-800",
    
    // Legacy
    "Pending": "bg-amber-100 text-amber-800",
    "Payment Failed": "bg-red-100 text-red-800",
  };

  return statusColors[status] || "bg-gray-100 text-gray-800";
};

export const getPaymentStatusColor = (status) => {
  const colors = {
    "Pending": "bg-yellow-100 text-yellow-800",
    "Paid": "bg-green-100 text-green-800",
    "Failed": "bg-red-100 text-red-800",
    "Refund Requested": "bg-orange-100 text-orange-800",
    "Refund Processing": "bg-amber-100 text-amber-800",
    "Partially Refunded": "bg-purple-100 text-purple-800",
    "Refunded": "bg-blue-100 text-blue-800",
  };

  return colors[status] || "bg-gray-100 text-gray-800";
};

export const canDownloadInvoice = (status, paymentStatus) => {
  const eligibleStatuses = [
    "Confirmed",
    "Processing",
    "Packed",
    "Shipped",
    "In Transit",
    "Out for Delivery",
    "Delivered",
    "Completed",
  ];
  
  return eligibleStatuses.includes(status) && paymentStatus === "Paid";
};


