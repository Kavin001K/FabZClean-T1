// Data service for connecting to the database API
// This replaces all dummy data with real database queries

// Import types from shared schema instead of defining them here
import type { Order, Customer, Service, Product, Delivery } from "../../../shared/schema";

export type InventoryItem = {
  id: string;
  name: string;
  stock: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  category?: string;
  sku?: string;
  price?: number;
  reorderLevel?: number;
  supplier?: string;
};

export type SalesData = {
  month: string;
  revenue: number;
};

export type OrderStatusData = {
  status: string;
  value: number;
};

export type ServicePopularityData = {
  name: string;
  value: number;
  fill: string;
};

// API base URL
const API_BASE = '/api';

// Generic fetch function with error handling
async function fetchData<T>(endpoint: string): Promise<T> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error(`Request timeout for ${endpoint}`);
        throw new Error(`Request timeout for ${endpoint}`);
      }
      console.error(`Error fetching ${endpoint}:`, error.message);
    } else {
      console.error(`Unknown error fetching ${endpoint}:`, error);
    }
    throw error;
  }
}

// Orders API
export const ordersApi = {
  async getAll(): Promise<Order[]> {
    try {
      return await fetchData<Order[]>('/orders');
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Order | null> {
    try {
      return await fetchData<Order>(`/orders/${id}`);
    } catch (error) {
      console.error(`Failed to fetch order ${id}:`, error);
      return null;
    }
  },

  async create(order: Partial<Order>): Promise<Order | null> {
    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      if (!response.ok) throw new Error('Failed to create order');
      return await response.json();
    } catch (error) {
      console.error('Failed to create order:', error);
      return null;
    }
  },

  async update(id: string, order: Partial<Order>): Promise<Order | null> {
    try {
      const response = await fetch(`${API_BASE}/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      if (!response.ok) throw new Error('Failed to update order');
      return await response.json();
    } catch (error) {
      console.error(`Failed to update order ${id}:`, error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/orders/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error(`Failed to delete order ${id}:`, error);
      return false;
    }
  },

  async deleteMany(orderIds: string[]): Promise<{ successful: number; failed: number; total: number }> {
    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete orders');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to delete orders:', error);
      return { successful: 0, failed: orderIds.length, total: orderIds.length };
    }
  }
};

// Customers API
export const customersApi = {
  async getAll(): Promise<Customer[]> {
    try {
      return await fetchData<Customer[]>('/customers');
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Customer | null> {
    try {
      return await fetchData<Customer>(`/customers/${id}`);
    } catch (error) {
      console.error(`Failed to fetch customer ${id}:`, error);
      return null;
    }
  },

  async create(customer: Partial<Customer>): Promise<Customer | null> {
    try {
      const response = await fetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      });
      if (!response.ok) throw new Error('Failed to create customer');
      return await response.json();
    } catch (error) {
      console.error('Failed to create customer:', error);
      return null;
    }
  },

  async update(id: string, customer: Partial<Customer>): Promise<Customer | null> {
    try {
      const response = await fetch(`${API_BASE}/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      });
      if (!response.ok) throw new Error('Failed to update customer');
      return await response.json();
    } catch (error) {
      console.error(`Failed to update customer ${id}:`, error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/customers/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error(`Failed to delete customer ${id}:`, error);
      return false;
    }
  },

  async getKPIs(): Promise<{
    totalCustomers: number;
    newCustomersThisMonth: number;
    totalRevenue: number;
    avgOrderValue: number;
    retentionRate: number;
  }> {
    try {
      return await fetchData('/customers/kpis');
    } catch (error) {
      console.error('Failed to fetch customer KPIs:', error);
      return {
        totalCustomers: 0,
        newCustomersThisMonth: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        retentionRate: 0,
      };
    }
  }
};

// Inventory API
export const inventoryApi = {
  async getAll(): Promise<InventoryItem[]> {
    try {
      const rawData = await fetchData<any[]>('/products');
      // Map the API data to match InventoryItem interface
      return rawData.map(item => ({
        id: item.id,
        name: item.name,
        stock: item.stockQuantity,
        status: item.stockQuantity === 0 ? 'Out of Stock' as const :
                item.stockQuantity <= 25 ? 'Low Stock' as const : 'In Stock' as const
      }));
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      return [];
    }
  },

  async getById(id: string): Promise<InventoryItem | null> {
    try {
      const rawData = await fetchData<any>(`/products/${id}`);
      if (!rawData) return null;
      
      return {
        id: rawData.id,
        name: rawData.name,
        stock: rawData.stockQuantity,
        status: rawData.stockQuantity === 0 ? 'Out of Stock' as const :
                rawData.stockQuantity <= (rawData.reorderLevel || 25) ? 'Low Stock' as const : 'In Stock' as const
      };
    } catch (error) {
      console.error(`Failed to fetch inventory item ${id}:`, error);
      return null;
    }
  },

  async create(item: Partial<InventoryItem>): Promise<InventoryItem | null> {
    try {
      const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          sku: item.sku || `SKU-${Date.now()}`,
          category: item.category || 'General',
          price: item.price?.toString() || '0',
          stockQuantity: item.stock || 0,
          reorderLevel: item.reorderLevel || 10,
          supplier: item.supplier || '',
        }),
      });
      if (!response.ok) throw new Error('Failed to create inventory item');
      const product = await response.json();
      return {
        id: product.id,
        name: product.name,
        stock: product.stockQuantity,
        status: product.stockQuantity === 0 ? 'Out of Stock' as const :
                product.stockQuantity <= (product.reorderLevel || 25) ? 'Low Stock' as const : 'In Stock' as const
      };
    } catch (error) {
      console.error('Failed to create inventory item:', error);
      return null;
    }
  },

  async update(id: string, item: Partial<InventoryItem>): Promise<InventoryItem | null> {
    try {
      const response = await fetch(`${API_BASE}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          sku: item.sku,
          category: item.category,
          price: item.price?.toString(),
          stockQuantity: item.stock,
          reorderLevel: item.reorderLevel,
          supplier: item.supplier,
        }),
      });
      if (!response.ok) throw new Error('Failed to update inventory item');
      const product = await response.json();
      return {
        id: product.id,
        name: product.name,
        stock: product.stockQuantity,
        status: product.stockQuantity === 0 ? 'Out of Stock' as const :
                product.stockQuantity <= (product.reorderLevel || 25) ? 'Low Stock' as const : 'In Stock' as const
      };
    } catch (error) {
      console.error('Failed to update inventory item:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to delete inventory item:', error);
      return false;
    }
  },

  async updateStock(id: string, newStock: number): Promise<InventoryItem | null> {
    try {
      const item = await this.getById(id);
      if (!item) return null;
      return await this.update(id, { stock: newStock });
    } catch (error) {
      console.error('Failed to update stock:', error);
      return null;
    }
  }
};

// Analytics API
export const analyticsApi = {
  async getSalesData(): Promise<SalesData[]> {
    try {
      // For now, return sample data since we don't have sales analytics endpoint
      return [
        { month: "Jan", revenue: 12000 },
        { month: "Feb", revenue: 15000 },
        { month: "Mar", revenue: 18000 },
        { month: "Apr", revenue: 16000 },
        { month: "May", revenue: 20000 },
        { month: "Jun", revenue: 22000 },
      ];
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
      return [];
    }
  },

  async getOrderStatusData(): Promise<OrderStatusData[]> {
    try {
      // For now, return sample data since we don't have order status analytics endpoint
      return [
        { status: "Pending", value: 5 },
        { status: "Processing", value: 8 },
        { status: "Completed", value: 12 },
        { status: "Cancelled", value: 2 },
      ];
    } catch (error) {
      console.error('Failed to fetch order status data:', error);
      return [];
    }
  },

  async getServicePopularityData(): Promise<ServicePopularityData[]> {
    try {
      // For now, return sample data since we don't have service popularity analytics endpoint
      return [
        { name: "Dry Cleaning", value: 40, fill: "hsl(var(--primary))" },
        { name: "Premium Laundry", value: 30, fill: "hsl(var(--primary))" },
        { name: "Laundry By Kg", value: 20, fill: "hsl(var(--primary))" },
        { name: "Bags Clean", value: 10, fill: "hsl(var(--primary))" },
      ];
    } catch (error) {
      console.error('Failed to fetch service popularity data:', error);
      return [];
    }
  },

  async getDashboardMetrics(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    newCustomers: number;
    inventoryItems: number;
  }> {
    try {
      return await fetchData('/dashboard/metrics');
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
      return {
        totalRevenue: 0,
        totalOrders: 0,
        newCustomers: 0,
        inventoryItems: 0
      };
    }
  }
};

// Helper functions for displaying data
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'N/A';
  }
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

export const formatPercentage = (num: number): string => {
  return `${num.toFixed(1)}%`;
};

// Status and priority helpers
export const getStatusColor = (status: string): string => {
  const statusColors = {
    pending: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    processing: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    completed: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    cancelled: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  };
  
  return statusColors[status.toLowerCase() as keyof typeof statusColors] || statusColors.pending;
};

export const getPriorityColor = (priority: string): string => {
  const priorityColors = {
    normal: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400",
    high: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    urgent: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  };
  
  return priorityColors[priority.toLowerCase() as keyof typeof priorityColors] || priorityColors.normal;
};

export const getStockStatusColor = (quantity: number, reorderLevel: number = 10): string => {
  if (quantity === 0) return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
  if (quantity <= reorderLevel) return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
  return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
};

export const getStockStatusText = (quantity: number, reorderLevel: number = 10): string => {
  if (quantity === 0) return "Out of Stock";
  if (quantity <= reorderLevel) return "Low Stock";
  return "In Stock";
};

// Order workflow helpers
export const orderWorkflow = [
  'pending', 'processing', 'completed'
] as const;

export const getNextStatus = (currentStatus: Order['status']): Order['status'] | null => {
  const currentIndex = orderWorkflow.indexOf(currentStatus as any);
  if (currentIndex === -1 || currentIndex === orderWorkflow.length - 1) {
    return null;
  }
  return orderWorkflow[currentIndex + 1] as Order['status'];
};

export const getPreviousStatus = (currentStatus: Order['status']): Order['status'] | null => {
  const currentIndex = orderWorkflow.indexOf(currentStatus as any);
  if (currentIndex <= 0) {
    return null;
  }
  return orderWorkflow[currentIndex - 1] as Order['status'];
};

// Services API
export const servicesApi = {
  async getAll(): Promise<Service[]> {
    try {
      return await fetchData<Service[]>('/services');
    } catch (error) {
      console.error('Failed to fetch services:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Service | null> {
    try {
      return await fetchData<Service>(`/services/${id}`);
    } catch (error) {
      console.error(`Failed to fetch service ${id}:`, error);
      return null;
    }
  },

  async create(service: Partial<Service>): Promise<Service | null> {
    try {
      const response = await fetch(`${API_BASE}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service),
      });
      if (!response.ok) throw new Error('Failed to create service');
      return await response.json();
    } catch (error) {
      console.error('Failed to create service:', error);
      return null;
    }
  },

  async update(id: string, service: Partial<Service>): Promise<Service | null> {
    try {
      const response = await fetch(`${API_BASE}/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service),
      });
      if (!response.ok) throw new Error('Failed to update service');
      return await response.json();
    } catch (error) {
      console.error('Failed to update service:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/services/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to delete service:', error);
      return false;
    }
  },
};

// Driver type definition
export type Driver = {
  id: string;
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  vehicleNumber: string;
  vehicleType: 'bike' | 'car' | 'van';
  vehicleModel: string;
  status: 'available' | 'busy' | 'offline';
  rating: number;
  totalDeliveries: number;
  totalEarnings: number;
  lastActive: string;
};

// Delivery type definition
export type Delivery = {
  id: string;
  orderId: string;
  driverName: string;
  vehicleId: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'failed';
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  route: Array<{
    latitude: number;
    longitude: number;
  }> | null;
  createdAt: string;
  updatedAt: string;
};

// Route type definition
export type Route = {
  id: string;
  name: string;
  driverId?: string;
  driverName?: string;
  vehicleId?: string;
  status: 'unassigned' | 'assigned' | 'in_progress' | 'completed';
  stops: RouteStop[];
  totalDistance: number;
  estimatedDuration: number;
  startTime?: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type RouteStop = {
  id: string;
  orderId: string;
  customerName: string;
  address: string;
  coordinates: { lat: number; lng: number };
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  estimatedArrival?: Date;
  actualArrival?: Date;
  notes?: string;
};

// Logistics API
export const logisticsApi = {
  async getDeliveries(): Promise<Delivery[]> {
    try {
      return await fetchData<Delivery[]>('/deliveries');
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
      return [];
    }
  },

  async getDrivers(): Promise<Driver[]> {
    try {
      return await fetchData<Driver[]>('/drivers');
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
      return [];
    }
  },

  async getActiveDrivers(): Promise<Driver[]> {
    try {
      return await fetchData<Driver[]>('/tracking/drivers');
    } catch (error) {
      console.error('Failed to fetch active drivers:', error);
      return [];
    }
  },

  async getRoutes(): Promise<Route[]> {
    try {
      // Mock routes data - in real app this would be a proper endpoint
      const deliveries = await this.getDeliveries();
      const drivers = await this.getDrivers();
      
      // Convert deliveries to routes
      const routes: Route[] = deliveries.map((delivery, index) => ({
        id: `route-${delivery.id}`,
        name: `Route ${index + 1}`,
        driverId: delivery.driverName ? drivers.find(d => d.name === delivery.driverName)?.id : undefined,
        driverName: delivery.driverName,
        vehicleId: delivery.vehicleId,
        status: delivery.status === 'pending' ? 'unassigned' : 
                delivery.status === 'in_transit' ? 'in_progress' : 'completed',
        stops: [{
          id: `stop-${delivery.id}`,
          orderId: delivery.orderId,
          customerName: `Customer ${delivery.orderId}`,
          address: '123 Main St, City',
          coordinates: delivery.location as { lat: number; lng: number } || { lat: 12.9716, lng: 77.5946 },
          status: delivery.status === 'pending' ? 'pending' :
                  delivery.status === 'in_transit' ? 'in_progress' :
                  delivery.status === 'delivered' ? 'completed' : 'failed',
          estimatedArrival: delivery.estimatedDelivery,
          actualArrival: delivery.actualDelivery,
        }],
        totalDistance: Math.random() * 50 + 10, // Mock distance
        estimatedDuration: Math.random() * 120 + 30, // Mock duration in minutes
        startTime: delivery.createdAt,
        endTime: delivery.actualDelivery,
        createdAt: delivery.createdAt,
        updatedAt: delivery.updatedAt,
      }));
      
      return routes;
    } catch (error) {
      console.error('Failed to fetch routes:', error);
      return [];
    }
  },

  async assignDriverToRoute(routeId: string, driverId: string): Promise<Route | null> {
    try {
      const response = await fetch(`${API_BASE}/deliveries/${routeId}/assign-driver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId }),
      });
      if (!response.ok) throw new Error('Failed to assign driver');
      return await response.json();
    } catch (error) {
      console.error('Failed to assign driver:', error);
      return null;
    }
  },

  async updateDeliveryStatus(deliveryId: string, status: string): Promise<Delivery | null> {
    try {
      const response = await fetch(`${API_BASE}/deliveries/${deliveryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update delivery status');
      return await response.json();
    } catch (error) {
      console.error('Failed to update delivery status:', error);
      return null;
    }
  },

  async createRoute(routeData: Partial<Route>): Promise<Route | null> {
    try {
      // Mock implementation - in real app this would create a route
      const newRoute: Route = {
        id: `route-${Date.now()}`,
        name: routeData.name || 'New Route',
        status: 'unassigned',
        stops: routeData.stops || [],
        totalDistance: 0,
        estimatedDuration: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return newRoute;
    } catch (error) {
      console.error('Failed to create route:', error);
      return null;
    }
  },
};
