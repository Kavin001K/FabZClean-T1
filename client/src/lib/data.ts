export const SAMPLE_SALES_DATA = [
  { day: 'Mon', revenue: 12000, orders: 180 },
  { day: 'Tue', revenue: 15000, orders: 220 },
  { day: 'Wed', revenue: 18000, orders: 280 },
  { day: 'Thu', revenue: 22000, orders: 320 },
  { day: 'Fri', revenue: 19000, orders: 290 },
  { day: 'Sat', revenue: 24000, orders: 350 },
  { day: 'Sun', revenue: 26000, orders: 380 },
];

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
};

export const formatPercentage = (num: number) => {
  return `${num.toFixed(1)}%`;
};

export const getStatusColor = (status: string) => {
  const statusColors = {
    pending: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    processing: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    completed: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    delivered: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    cancelled: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    in_transit: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    failed: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  };
  
  return statusColors[status as keyof typeof statusColors] || statusColors.pending;
};

export const getStockStatusColor = (quantity: number, reorderLevel: number) => {
  if (quantity === 0) return "status-error";
  if (quantity <= reorderLevel) return "status-warning";
  return "status-online";
};

export const getStockStatusText = (quantity: number, reorderLevel: number) => {
  if (quantity === 0) return "Out of Stock";
  if (quantity <= reorderLevel) return "Low Stock";
  return "In Stock";
};
