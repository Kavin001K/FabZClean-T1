// Neon REST API service for direct database operations
import { DATABASE_CONFIG } from './database';

export class NeonRestAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = DATABASE_CONFIG.restApiUrl || '';
    this.apiKey = DATABASE_CONFIG.stackSecretKey || '';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'apikey': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`REST API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Orders operations
  async getOrders() {
    return this.makeRequest('/orders?select=*');
  }

  async getOrder(id: string) {
    return this.makeRequest(`/orders?id=eq.${id}&select=*`);
  }

  async createOrder(orderData: any) {
    return this.makeRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrder(id: string, orderData: any) {
    return this.makeRequest(`/orders?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(orderData),
    });
  }

  async deleteOrder(id: string) {
    return this.makeRequest(`/orders?id=eq.${id}`, {
      method: 'DELETE',
    });
  }

  // Customers operations
  async getCustomers() {
    return this.makeRequest('/customers?select=*');
  }

  async getCustomer(id: string) {
    return this.makeRequest(`/customers?id=eq.${id}&select=*`);
  }

  async createCustomer(customerData: any) {
    return this.makeRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  async updateCustomer(id: string, customerData: any) {
    return this.makeRequest(`/customers?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(customerData),
    });
  }

  // Products operations
  async getProducts() {
    return this.makeRequest('/products?select=*');
  }

  async getProduct(id: string) {
    return this.makeRequest(`/products?id=eq.${id}&select=*`);
  }

  async createProduct(productData: any) {
    return this.makeRequest('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: string, productData: any) {
    return this.makeRequest(`/products?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(productData),
    });
  }

  // Services operations
  async getServices() {
    return this.makeRequest('/services?select=*');
  }

  async getService(id: string) {
    return this.makeRequest(`/services?id=eq.${id}&select=*`);
  }

  async createService(serviceData: any) {
    return this.makeRequest('/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  }

  async updateService(id: string, serviceData: any) {
    return this.makeRequest(`/services?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(serviceData),
    });
  }

  // Deliveries operations
  async getDeliveries() {
    return this.makeRequest('/deliveries?select=*');
  }

  async getDelivery(id: string) {
    return this.makeRequest(`/deliveries?id=eq.${id}&select=*`);
  }

  async createDelivery(deliveryData: any) {
    return this.makeRequest('/deliveries', {
      method: 'POST',
      body: JSON.stringify(deliveryData),
    });
  }

  // Analytics operations
  async getAnalytics() {
    return this.makeRequest('/analytics?select=*');
  }

  // Custom queries
  async executeQuery(query: string) {
    return this.makeRequest(`/rpc/execute_query`, {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  // Health check
  async healthCheck() {
    try {
      await this.makeRequest('/orders?select=count&limit=1');
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
  }
}

// Export singleton instance
export const neonRestAPI = new NeonRestAPI();
