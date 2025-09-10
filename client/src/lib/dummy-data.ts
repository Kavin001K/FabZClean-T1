// In client/src/lib/dummy-data.ts

export type Order = {
  id: string;
  customerName: string;
  date: string;
  status: 'Pending' | 'Processing' | 'Quality Check' | 'Ready for Delivery' | 'Out for Delivery' | 'Completed' | 'Cancelled';
  total: number;
  service: string;
  priority?: 'Normal' | 'High' | 'Urgent';
  notes?: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  totalOrders: number;
};

export type InventoryItem = {
  id: string;
  name: string;
  stock: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
};

export const dummyOrders: Order[] = [
  { id: 'ORD001', customerName: 'John Doe', date: '2025-09-10', status: 'Completed', total: 2500, service: 'Dry Cleaning', priority: 'Normal', notes: 'Customer requested express service' },
  { id: 'ORD002', customerName: 'Jane Smith', date: '2025-09-10', status: 'Out for Delivery', total: 1500, service: 'Wash & Fold', priority: 'High', notes: 'Fragile items - handle with care' },
  { id: 'ORD003', customerName: 'Mike Johnson', date: '2025-09-09', status: 'Quality Check', total: 3200, service: 'Premium Laundry', priority: 'Normal', notes: 'Special stain treatment required' },
  { id: 'ORD004', customerName: 'Sarah Wilson', date: '2025-09-09', status: 'Ready for Delivery', total: 1800, service: 'Ironing', priority: 'Normal', notes: 'Customer prefers morning delivery' },
  { id: 'ORD005', customerName: 'David Brown', date: '2025-09-08', status: 'Processing', total: 2200, service: 'Dry Cleaning', priority: 'Urgent', notes: 'Wedding dress - needs special attention' },
  { id: 'ORD006', customerName: 'Lisa Davis', date: '2025-09-08', status: 'Cancelled', total: 1200, service: 'Wash & Fold', priority: 'Normal', notes: 'Customer requested cancellation' },
  { id: 'ORD007', customerName: 'Robert Miller', date: '2025-09-07', status: 'Completed', total: 2800, service: 'Premium Laundry', priority: 'Normal', notes: 'Regular customer - VIP treatment' },
  { id: 'ORD008', customerName: 'Emily Garcia', date: '2025-09-07', status: 'Pending', total: 1600, service: 'Ironing', priority: 'Normal', notes: 'First-time customer' },
  { id: 'ORD009', customerName: 'James Rodriguez', date: '2025-09-06', status: 'Processing', total: 1900, service: 'Dry Cleaning', priority: 'High', notes: 'Business suit - needs pressing' },
  { id: 'ORD010', customerName: 'Maria Martinez', date: '2025-09-06', status: 'Completed', total: 2100, service: 'Wash & Fold', priority: 'Normal', notes: 'Customer satisfied with service' },
];

export const dummyCustomers: Customer[] = [
  { id: 'CUST001', name: 'John Doe', email: 'john.d@example.com', phone: '9876543210', joinDate: '2025-01-15', totalOrders: 5 },
  { id: 'CUST002', name: 'Jane Smith', email: 'jane.s@example.com', phone: '9876543211', joinDate: '2025-03-22', totalOrders: 8 },
  { id: 'CUST003', name: 'Mike Johnson', email: 'mike.j@example.com', phone: '9876543212', joinDate: '2025-02-10', totalOrders: 3 },
  { id: 'CUST004', name: 'Sarah Wilson', email: 'sarah.w@example.com', phone: '9876543213', joinDate: '2025-04-05', totalOrders: 12 },
  { id: 'CUST005', name: 'David Brown', email: 'david.b@example.com', phone: '9876543214', joinDate: '2025-01-28', totalOrders: 7 },
  { id: 'CUST006', name: 'Lisa Davis', email: 'lisa.d@example.com', phone: '9876543215', joinDate: '2025-03-15', totalOrders: 4 },
  { id: 'CUST007', name: 'Robert Miller', email: 'robert.m@example.com', phone: '9876543216', joinDate: '2025-02-20', totalOrders: 9 },
  { id: 'CUST008', name: 'Emily Garcia', email: 'emily.g@example.com', phone: '9876543217', joinDate: '2025-04-12', totalOrders: 6 },
  { id: 'CUST009', name: 'James Rodriguez', email: 'james.r@example.com', phone: '9876543218', joinDate: '2025-01-08', totalOrders: 11 },
  { id: 'CUST010', name: 'Maria Martinez', email: 'maria.m@example.com', phone: '9876543219', joinDate: '2025-03-30', totalOrders: 2 },
];

export const dummyInventory: InventoryItem[] = [
  { id: 'INV001', name: 'Detergent (kg)', stock: 50, status: 'In Stock' },
  { id: 'INV002', name: 'Fabric Softener (L)', stock: 8, status: 'Low Stock' },
  { id: 'INV003', name: 'Hangers (units)', stock: 200, status: 'In Stock' },
  { id: 'INV004', name: 'Stain Remover (L)', stock: 0, status: 'Out of Stock' },
  { id: 'INV005', name: 'Bleach (L)', stock: 15, status: 'In Stock' },
  { id: 'INV006', name: 'Dry Cleaning Solvent (L)', stock: 5, status: 'Low Stock' },
  { id: 'INV007', name: 'Ironing Boards (units)', stock: 12, status: 'In Stock' },
  { id: 'INV008', name: 'Laundry Bags (units)', stock: 2, status: 'Low Stock' },
  { id: 'INV009', name: 'Steam Press (units)', stock: 3, status: 'In Stock' },
  { id: 'INV010', name: 'Washing Machine Detergent (L)', stock: 0, status: 'Out of Stock' },
];

// Data for charts
export const dummySalesData = [
  { month: 'Jan', revenue: 45000 },
  { month: 'Feb', revenue: 52000 },
  { month: 'Mar', revenue: 78000 },
  { month: 'Apr', revenue: 65000 },
  { month: 'May', revenue: 82000 },
  { month: 'Jun', revenue: 75000 },
  { month: 'Jul', revenue: 68000 },
  { month: 'Aug', revenue: 71000 },
  { month: 'Sep', revenue: 85000 },
  { month: 'Oct', revenue: 92000 },
  { month: 'Nov', revenue: 88000 },
  { month: 'Dec', revenue: 95000 },
];

export const dummyOrderStatusData = [
  { status: 'Completed', value: 125 },
  { status: 'Processing', value: 40 },
  { status: 'Pending', value: 15 },
  { status: 'Cancelled', value: 5 },
];

export const dummyServicePopularityData = [
  { name: 'Dry Cleaning', value: 400, fill: '#8884d8' },
  { name: 'Wash & Fold', value: 300, fill: '#82ca9d' },
  { name: 'Ironing', value: 200, fill: '#ffc658' },
  { name: 'Premium Laundry', value: 278, fill: '#FF8042' },
];

// Order workflow helper functions
export const orderWorkflow = [
  'Pending',
  'Processing', 
  'Quality Check',
  'Ready for Delivery',
  'Out for Delivery',
  'Completed'
] as const;

export const getNextStatus = (currentStatus: Order['status']): Order['status'] | null => {
  const currentIndex = orderWorkflow.indexOf(currentStatus as any);
  if (currentIndex === -1 || currentIndex === orderWorkflow.length - 1) {
    return null; // No next status available
  }
  return orderWorkflow[currentIndex + 1] as Order['status'];
};

export const getPreviousStatus = (currentStatus: Order['status']): Order['status'] | null => {
  const currentIndex = orderWorkflow.indexOf(currentStatus as any);
  if (currentIndex <= 0) {
    return null; // No previous status available
  }
  return orderWorkflow[currentIndex - 1] as Order['status'];
};

export const getStatusColor = (status: Order['status']): string => {
  switch (status) {
    case 'Pending': return 'bg-yellow-100 text-yellow-800';
    case 'Processing': return 'bg-blue-100 text-blue-800';
    case 'Quality Check': return 'bg-purple-100 text-purple-800';
    case 'Ready for Delivery': return 'bg-orange-100 text-orange-800';
    case 'Out for Delivery': return 'bg-indigo-100 text-indigo-800';
    case 'Completed': return 'bg-green-100 text-green-800';
    case 'Cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getPriorityColor = (priority: Order['priority']): string => {
  switch (priority) {
    case 'Urgent': return 'bg-red-100 text-red-800';
    case 'High': return 'bg-orange-100 text-orange-800';
    case 'Normal': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// AI-Powered Insights Generation
export const generateInsights = () => {
  const totalRevenue = dummySalesData.reduce((sum, item) => sum + item.revenue, 0);
  const avgRevenue = totalRevenue / dummySalesData.length;
  const lastMonthRevenue = dummySalesData[dummySalesData.length - 2]?.revenue || 0;
  const currentMonthRevenue = dummySalesData[dummySalesData.length - 1]?.revenue || 0;
  const revenueGrowth = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 0;
  
  const topService = dummyServicePopularityData.reduce((prev, current) => 
    prev.value > current.value ? prev : current
  );
  
  const completedOrders = dummyOrders.filter(o => o.status === 'Completed').length;
  const totalOrders = dummyOrders.length;
  const completionRate = totalOrders > 0 ? (completedOrders / totalOrders * 100) : 0;
  
  const urgentOrders = dummyOrders.filter(o => o.priority === 'Urgent').length;
  
  const insights = [
    `📈 Revenue Analysis: Sales are ${revenueGrowth > 0 ? 'up' : 'down'} ${Math.abs(revenueGrowth).toFixed(1)}% from last month, with total revenue of ₹${totalRevenue.toLocaleString()}.`,
    `🏆 Top Service: "${topService.name}" is your most popular service with ${topService.value} orders, contributing significantly to revenue.`,
    `✅ Order Performance: You have a ${completionRate.toFixed(1)}% completion rate with ${completedOrders} out of ${totalOrders} orders completed.`,
    `⚡ Priority Orders: ${urgentOrders} urgent orders require immediate attention to maintain customer satisfaction.`,
    `📊 Service Mix: Your service portfolio shows good diversification with ${dummyServicePopularityData.length} different service types.`,
    `🎯 Customer Focus: Average order value is ₹${Math.round(avgRevenue).toLocaleString()}, indicating strong customer spending patterns.`
  ];
  
  return insights;
};
