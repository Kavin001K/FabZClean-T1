"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.neonRestAPI = exports.NeonRestAPI = void 0;
// Neon REST API service for direct database operations
const database_1 = require("./database");
class NeonRestAPI {
    constructor() {
        this.baseUrl = database_1.DATABASE_CONFIG.restApiUrl || '';
        this.apiKey = database_1.DATABASE_CONFIG.stackSecretKey || '';
    }
    async makeRequest(endpoint, options = {}) {
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
    async getOrder(id) {
        return this.makeRequest(`/orders?id=eq.${id}&select=*`);
    }
    async createOrder(orderData) {
        return this.makeRequest('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData),
        });
    }
    async updateOrder(id, orderData) {
        return this.makeRequest(`/orders?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(orderData),
        });
    }
    async deleteOrder(id) {
        return this.makeRequest(`/orders?id=eq.${id}`, {
            method: 'DELETE',
        });
    }
    // Customers operations
    async getCustomers() {
        return this.makeRequest('/customers?select=*');
    }
    async getCustomer(id) {
        return this.makeRequest(`/customers?id=eq.${id}&select=*`);
    }
    async createCustomer(customerData) {
        return this.makeRequest('/customers', {
            method: 'POST',
            body: JSON.stringify(customerData),
        });
    }
    async updateCustomer(id, customerData) {
        return this.makeRequest(`/customers?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(customerData),
        });
    }
    // Products operations
    async getProducts() {
        return this.makeRequest('/products?select=*');
    }
    async getProduct(id) {
        return this.makeRequest(`/products?id=eq.${id}&select=*`);
    }
    async createProduct(productData) {
        return this.makeRequest('/products', {
            method: 'POST',
            body: JSON.stringify(productData),
        });
    }
    async updateProduct(id, productData) {
        return this.makeRequest(`/products?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(productData),
        });
    }
    // Services operations
    async getServices() {
        return this.makeRequest('/services?select=*');
    }
    async getService(id) {
        return this.makeRequest(`/services?id=eq.${id}&select=*`);
    }
    async createService(serviceData) {
        return this.makeRequest('/services', {
            method: 'POST',
            body: JSON.stringify(serviceData),
        });
    }
    async updateService(id, serviceData) {
        return this.makeRequest(`/services?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify(serviceData),
        });
    }
    // Deliveries operations
    async getDeliveries() {
        return this.makeRequest('/deliveries?select=*');
    }
    async getDelivery(id) {
        return this.makeRequest(`/deliveries?id=eq.${id}&select=*`);
    }
    async createDelivery(deliveryData) {
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
    async executeQuery(query) {
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
        }
        catch (error) {
            return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
        }
    }
}
exports.NeonRestAPI = NeonRestAPI;
// Export singleton instance
exports.neonRestAPI = new NeonRestAPI();
