// Data service for connecting to the database API
// This replaces all dummy data with real database queries

// Import types from shared schema instead of defining them here
import type { Order, Customer, Service, Product, Delivery, Employee } from "../../../shared/schema";

// Get access token from localStorage (employee-based auth)
function getAccessToken(): string | null {
  return localStorage.getItem('employee_token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('supabase.auth.token');
}

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

// API base URL - use environment variable or fallback to relative path
// In production (Vercel), this will use /api which is handled by rewrites
// In development, this uses Vite proxy
const getApiBase = () => {
  if (import.meta.env.PROD) {
    // Check for explicit API URL in environment
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      return apiUrl;
    }
    // Default to relative path for production (Vercel handles rewrites)
    return '/api';
  }
  // Development: use relative path (handled by Vite proxy)
  return '/api';
};

export const getWebSocketUrl = () => {
  if (import.meta.env.PROD) {
    // In production, use wss:// and the current host
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
  }
  // In development, use ws://localhost:5001
  return 'ws://localhost:5001/ws';
};

export const API_BASE = getApiBase();

type HeadersMap = Record<string, string>;

function normalizeHeaders(headers?: HeadersInit): HeadersMap {
  if (!headers) return {};
  if (headers instanceof Headers) {
    const result: HeadersMap = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  if (Array.isArray(headers)) {
    return headers.reduce<HeadersMap>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  }

  return { ...(headers as HeadersMap) };
}

function withAuth(init: RequestInit = {}): RequestInit {
  const headers = normalizeHeaders(init.headers);
  if (!headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return {
    ...init,
    headers,
  };
}

async function authorizedFetch(endpoint: string, init: RequestInit = {}) {
  return fetch(`${API_BASE}${endpoint}`, withAuth(init));
}

// Generic fetch function with error handling
async function fetchData<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await authorizedFetch(endpoint, {
      ...init,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
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
      const response = await fetchData<{ data: Order[]; pagination?: any }>("/orders");
      // Handle paginated response
      return response.data || response;
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
      const response = await authorizedFetch("/orders", {
        method: "POST",
        body: JSON.stringify(order),
      });
      if (!response.ok) throw new Error("Failed to create order");
      const result = await response.json();
      // Handle wrapped response from createSuccessResponse
      return result.data || result;
    } catch (error) {
      console.error("Failed to create order:", error);
      return null;
    }
  },

  async update(id: string, order: Partial<Order>): Promise<Order | null> {
    try {
      const response = await authorizedFetch(`/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify(order),
      });
      if (!response.ok) throw new Error("Failed to update order");
      return await response.json();
    } catch (error) {
      console.error(`Failed to update order ${id}:`, error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const response = await authorizedFetch(`/orders/${id}`, {
        method: "DELETE",
      });
      return response.ok;
    } catch (error) {
      console.error(`Failed to delete order ${id}:`, error);
      return false;
    }
  },

  async deleteMany(orderIds: string[]): Promise<{ successful: number; failed: number; total: number }> {
    try {
      const response = await authorizedFetch(`/orders`, {
        method: "DELETE",
        body: JSON.stringify({ orderIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete orders");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to delete orders:", error);
      return { successful: 0, failed: orderIds.length, total: orderIds.length };
    }
  },

  async logPrintAction(id: string, type: 'bill' | 'invoice' | 'label' = 'bill'): Promise<void> {
    try {
      await authorizedFetch(`/orders/${id}/log-print`, {
        method: "POST",
        body: JSON.stringify({ type }),
      });
    } catch (error) {
      console.error(`Failed to log print action for order ${id}:`, error);
    }
  }
};

// Customers API
export const customersApi = {
  async getAll(): Promise<Customer[]> {
    try {
      const response = await fetchData<{ data: Customer[] } | Customer[]>('/customers');
      // Handle paginated response structure
      if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
        return response.data;
      }
      // Handle direct array response
      if (Array.isArray(response)) {
        return response;
      }
      return [];
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
      const response = await authorizedFetch(`/customers`, {
        method: "POST",
        body: JSON.stringify(customer),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create customer");
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to create customer:", error);
      throw error; // Propagate error to caller
    }
  },

  async update(id: string, customer: Partial<Customer>): Promise<Customer | null> {
    try {
      const response = await authorizedFetch(`/customers/${id}`, {
        method: "PUT",
        body: JSON.stringify(customer),
      });
      if (!response.ok) throw new Error("Failed to update customer");
      return await response.json();
    } catch (error) {
      console.error(`Failed to update customer ${id}:`, error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const response = await authorizedFetch(`/customers/${id}`, {
        method: "DELETE",
      });
      return response.ok;
    } catch (error) {
      console.error(`Failed to delete customer ${id}:`, error);
      return false;
    }
  },

  async searchByPhone(phone: string): Promise<Customer | null> {
    try {
      const customers = await fetchData<Customer[]>(`/customers?phone=${phone}`);
      return customers.length > 0 ? customers[0] : null;
    } catch (error) {
      console.error(`Failed to search customer by phone ${phone}:`, error);
      return null;
    }
  },

  // Alias for getById to fix linter error
  get: async (id: string) => customersApi.getById(id),
};

// Employees API
export const employeesApi = {
  async getAll(): Promise<Employee[]> {
    // Let errors propagate to the caller (useQuery)
    const response = await fetchData<{ success: boolean; employees: Employee[] } | Employee[]>('/employees');
    // Handle both wrapped and unwrapped responses
    if (response && typeof response === 'object' && 'employees' in response) {
      return response.employees || [];
    }
    return Array.isArray(response) ? response : [];
  },

  async getById(id: string): Promise<Employee | null> {
    try {
      const response = await fetchData<{ success: boolean; employee: Employee } | Employee>(`/employees/${id}`);
      // Handle both wrapped and unwrapped responses
      if (response && typeof response === 'object' && 'employee' in response) {
        return response.employee || null;
      }
      return response as Employee;
    } catch (error) {
      console.error(`Failed to fetch employee ${id}:`, error);
      return null;
    }
  },

  async create(employee: Partial<Employee>): Promise<Employee | null> {
    try {
      const response = await authorizedFetch(`/employees`, {
        method: "POST",
        body: JSON.stringify(employee),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create employee");
      }
      const data = await response.json();
      // Handle wrapped response
      if (data && typeof data === 'object' && 'employee' in data) {
        return data.employee;
      }
      return data;
    } catch (error) {
      console.error("Failed to create employee:", error);
      throw error;
    }
  },

  async update(id: string, employee: Partial<Employee>): Promise<Employee | null> {
    try {
      const response = await authorizedFetch(`/employees/${id}`, {
        method: "PUT",
        body: JSON.stringify(employee),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update employee");
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to update employee ${id}:`, error);
      throw error;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const response = await authorizedFetch(`/employees/${id}`, {
        method: "DELETE",
      });
      return response.ok;
    } catch (error) {
      console.error(`Failed to delete employee ${id}:`, error);
      return false;
    }
  },
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
          item.stockQuantity <= (item.reorderLevel || 25) ? 'Low Stock' as const : 'In Stock' as const,
        category: item.category,
        sku: item.sku,
        price: parseFloat(item.price) || 0,
        reorderLevel: item.reorderLevel || 10,
        supplier: item.supplier || '',
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
          rawData.stockQuantity <= (rawData.reorderLevel || 25) ? 'Low Stock' as const : 'In Stock' as const,
        category: rawData.category,
        sku: rawData.sku,
        price: parseFloat(rawData.price) || 0,
        reorderLevel: rawData.reorderLevel || 10,
        supplier: rawData.supplier || '',
      };
    } catch (error) {
      console.error(`Failed to fetch inventory item ${id}:`, error);
      return null;
    }
  },

  async create(item: Partial<InventoryItem>): Promise<InventoryItem | null> {
    try {
      const response = await authorizedFetch(`/products`, {
        method: "POST",
        body: JSON.stringify({
          name: item.name,
          sku: item.sku || `SKU-${Date.now()}`,
          category: item.category || "General",
          price: item.price?.toString() || "0",
          stockQuantity: item.stock || 0,
          reorderLevel: item.reorderLevel || 10,
          supplier: item.supplier || "",
        }),
      });
      if (!response.ok) throw new Error("Failed to create inventory item");
      const product = await response.json();
      return {
        id: product.id,
        name: product.name,
        stock: product.stockQuantity,
        status: product.stockQuantity === 0 ? 'Out of Stock' as const :
          product.stockQuantity <= (product.reorderLevel || 25) ? 'Low Stock' as const : 'In Stock' as const,
        category: product.category,
        sku: product.sku,
        price: parseFloat(product.price) || 0,
        reorderLevel: product.reorderLevel || 10,
        supplier: product.supplier || '',
      };
    } catch (error) {
      console.error('Failed to create inventory item:', error);
      return null;
    }
  },

  async update(id: string, item: Partial<InventoryItem>): Promise<InventoryItem | null> {
    try {
      const response = await authorizedFetch(`/products/${id}`, {
        method: "PUT",
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
      if (!response.ok) throw new Error("Failed to update inventory item");
      const product = await response.json();
      return {
        id: product.id,
        name: product.name,
        stock: product.stockQuantity,
        status: product.stockQuantity === 0 ? 'Out of Stock' as const :
          product.stockQuantity <= (product.reorderLevel || 25) ? 'Low Stock' as const : 'In Stock' as const,
        category: product.category,
        sku: product.sku,
        price: parseFloat(product.price) || 0,
        reorderLevel: product.reorderLevel || 10,
        supplier: product.supplier || '',
      };
    } catch (error) {
      console.error('Failed to update inventory item:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const response = await authorizedFetch(`/products/${id}`, {
        method: "DELETE",
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
// ✅ Note: Analytics data is now provided by useAnalyticsEngine hook
// These functions are kept for backward compatibility but return empty arrays
// The realtime analytics engine handles all data processing
export const analyticsApi = {
  async getSalesData(): Promise<SalesData[]> {
    // ✅ Removed mock data - use RevenueChartRealtime component instead
    // This function is kept for backward compatibility
    return [];
  },

  async getOrderStatusData(): Promise<OrderStatusData[]> {
    // ✅ Removed mock data - use useAnalyticsEngine hook instead
    // This function is kept for backward compatibility
    return [];
  },

  async getServicePopularityData(): Promise<ServicePopularityData[]> {
    // ✅ Removed mock data - use useAnalyticsEngine hook instead
    // This function is kept for backward compatibility
    return [];
  },

  async getDashboardMetrics(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    newCustomers: number;
    inventoryItems: number;
    dueDateStats?: {
      today: number;
      tomorrow: number;
      overdue: number;
      upcoming: number;
    };
  }> {
    try {
      return await fetchData('/dashboard/metrics');
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
      return {
        totalRevenue: 0,
        totalOrders: 0,
        newCustomers: 0,
        inventoryItems: 0,
        dueDateStats: {
          today: 0,
          tomorrow: 0,
          overdue: 0,
          upcoming: 0,
        }
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
      const response = await authorizedFetch(`/services`, {
        method: "POST",
        body: JSON.stringify(service),
      });
      if (!response.ok) throw new Error("Failed to create service");
      return await response.json();
    } catch (error) {
      console.error("Failed to create service:", error);
      return null;
    }
  },

  async update(id: string, service: Partial<Service>): Promise<Service | null> {
    try {
      const response = await authorizedFetch(`/services/${id}`, {
        method: "PUT",
        body: JSON.stringify(service),
      });
      if (!response.ok) throw new Error("Failed to update service");
      return await response.json();
    } catch (error) {
      console.error("Failed to update service:", error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const response = await authorizedFetch(`/services/${id}`, {
        method: "DELETE",
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
          orderId: delivery.orderId || `order-${delivery.id}`, // Ensure orderId is never null
          customerName: `Customer ${delivery.orderId || delivery.id}`,
          address: '123 Main St, City',
          coordinates: delivery.location as { lat: number; lng: number } || { lat: 12.9716, lng: 77.5946 },
          status: delivery.status === 'pending' ? 'pending' :
            delivery.status === 'in_transit' ? 'in_progress' :
              delivery.status === 'delivered' ? 'completed' : 'failed',
          estimatedArrival: delivery.estimatedDelivery ? new Date(delivery.estimatedDelivery) : undefined,
          actualArrival: delivery.actualDelivery ? new Date(delivery.actualDelivery) : undefined,
        }],
        totalDistance: Math.random() * 50 + 10, // Mock distance
        estimatedDuration: Math.random() * 120 + 30, // Mock duration in minutes
        startTime: delivery.createdAt ? new Date(delivery.createdAt) : undefined,
        endTime: delivery.actualDelivery ? new Date(delivery.actualDelivery) : undefined,
        createdAt: delivery.createdAt ? new Date(delivery.createdAt) : new Date(),
        updatedAt: delivery.updatedAt ? new Date(delivery.updatedAt) : new Date(),
      }));

      return routes;
    } catch (error) {
      console.error('Failed to fetch routes:', error);
      return [];
    }
  },

  async assignDriverToRoute(routeId: string, driverId: string): Promise<Route | null> {
    try {
      const response = await authorizedFetch(`/deliveries/${routeId}/assign-driver`, {
        method: "POST",
        body: JSON.stringify({ driverId }),
      });
      if (!response.ok) throw new Error("Failed to assign driver");
      return await response.json();
    } catch (error) {
      console.error("Failed to assign driver:", error);
      return null;
    }
  },

  async updateDeliveryStatus(deliveryId: string, status: string): Promise<Delivery | null> {
    try {
      const response = await authorizedFetch(`/deliveries/${deliveryId}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update delivery status");
      return await response.json();
    } catch (error) {
      console.error("Failed to update delivery status:", error);
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
