import { storage } from './storage';
class DynamicPricingEngine {
    constructor() {
        this.pricingRules = new Map();
        this.updateInterval = null;
        this.initializePricingRules();
        this.startPricingUpdates();
    }
    async initializePricingRules() {
        try {
            const services = await storage.getServices();
            services.forEach(service => {
                this.pricingRules.set(service.id, {
                    serviceId: service.id,
                    basePrice: parseFloat(service.price || '100'),
                    currentPrice: parseFloat(service.price || '100'),
                    priceMultiplier: 1.0,
                    factors: {
                        demand: 0.5,
                        inventory: 0.8,
                        timeOfDay: 0.5,
                        dayOfWeek: 0.5,
                        seasonality: 0.5,
                        localEvents: 0.0
                    },
                    lastUpdated: new Date()
                });
            });
            console.log(`Initialized pricing rules for ${services.length} services`);
        }
        catch (error) {
            console.error('Error initializing pricing rules:', error);
        }
    }
    startPricingUpdates() {
        // Update pricing every 5 minutes
        this.updateInterval = setInterval(async () => {
            await this.updateAllPricing();
        }, 5 * 60 * 1000);
    }
    async updateAllPricing() {
        try {
            const orders = await storage.getOrders();
            const products = await storage.getProducts();
            for (const [serviceId, pricing] of this.pricingRules) {
                await this.calculatePricing(serviceId, pricing, orders, products);
            }
            console.log('Updated pricing for all services');
        }
        catch (error) {
            console.error('Error updating pricing:', error);
        }
    }
    async calculatePricing(serviceId, pricing, orders, products) {
        const now = new Date();
        // Calculate demand factor (based on recent orders for this service)
        const recentOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt || new Date());
            const hoursDiff = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
            return hoursDiff <= 24; // Last 24 hours
        });
        const serviceOrders = recentOrders.filter(order => order.service?.toLowerCase().includes(serviceId.toLowerCase()));
        const demandFactor = Math.min(serviceOrders.length / 10, 1); // Normalize to 0-1
        // Calculate inventory factor (based on product availability)
        const serviceProducts = products.filter(product => product.category?.toLowerCase().includes(serviceId.toLowerCase()));
        const inventoryFactor = serviceProducts.length > 0
            ? serviceProducts.reduce((sum, product) => sum + (product.stockQuantity || 0), 0) / (serviceProducts.length * 100)
            : 0.8; // Default to 80% if no products found
        // Calculate time-based factors
        const hour = now.getHours();
        const timeOfDayFactor = this.getTimeOfDayFactor(hour);
        const dayOfWeekFactor = this.getDayOfWeekFactor(now.getDay());
        // Calculate seasonality factor (example: higher demand in summer for cleaning)
        const seasonalityFactor = this.getSeasonalityFactor(now.getMonth());
        // Calculate local events factor (placeholder - would integrate with events API)
        const localEventsFactor = 0.0; // No events currently
        // Update factors
        pricing.factors = {
            demand: demandFactor,
            inventory: Math.min(inventoryFactor, 1),
            timeOfDay: timeOfDayFactor,
            dayOfWeek: dayOfWeekFactor,
            seasonality: seasonalityFactor,
            localEvents: localEventsFactor
        };
        // Calculate price multiplier
        const priceMultiplier = this.calculatePriceMultiplier(pricing.factors);
        pricing.priceMultiplier = priceMultiplier;
        pricing.currentPrice = pricing.basePrice * priceMultiplier;
        pricing.lastUpdated = now;
        this.pricingRules.set(serviceId, pricing);
    }
    getTimeOfDayFactor(hour) {
        // Peak hours: 9-11 AM and 2-5 PM
        if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 17)) {
            return 1.0; // Peak hours
        }
        else if (hour >= 6 && hour <= 8) {
            return 0.8; // Early morning
        }
        else if (hour >= 18 && hour <= 20) {
            return 0.9; // Evening
        }
        else {
            return 0.6; // Off-peak hours
        }
    }
    getDayOfWeekFactor(day) {
        // Weekend factor
        return day === 0 || day === 6 ? 1.0 : 0.8; // Sunday = 0, Saturday = 6
    }
    getSeasonalityFactor(month) {
        // Higher demand in spring/summer months (March-August)
        if (month >= 2 && month <= 7) {
            return 1.0; // High season
        }
        else if (month >= 8 && month <= 10) {
            return 0.9; // Medium season
        }
        else {
            return 0.7; // Low season
        }
    }
    calculatePriceMultiplier(factors) {
        // Weighted calculation of price multiplier
        const weights = {
            demand: 0.3,
            inventory: 0.2,
            timeOfDay: 0.2,
            dayOfWeek: 0.1,
            seasonality: 0.1,
            localEvents: 0.1
        };
        let multiplier = 1.0;
        // High demand increases price
        multiplier += factors.demand * 0.3;
        // Low inventory increases price
        multiplier += (1 - factors.inventory) * 0.2;
        // Peak time increases price
        multiplier += factors.timeOfDay * 0.2;
        // Weekend increases price
        multiplier += factors.dayOfWeek * 0.1;
        // High season increases price
        multiplier += factors.seasonality * 0.1;
        // Local events increase price
        multiplier += factors.localEvents * 0.1;
        // Apply bounds (0.5x to 2.0x multiplier)
        return Math.max(0.5, Math.min(2.0, multiplier));
    }
    getServicePricing(serviceId) {
        return this.pricingRules.get(serviceId) || null;
    }
    getAllPricing() {
        return Array.from(this.pricingRules.values());
    }
    async getRecommendedPrice(serviceId) {
        const pricing = this.pricingRules.get(serviceId);
        if (!pricing) {
            // If no pricing rule exists, return base price
            const services = await storage.getServices();
            const service = services.find(s => s.id === serviceId);
            return parseFloat(service?.price || '100');
        }
        return pricing.currentPrice;
    }
    getPricingFactors(serviceId) {
        const pricing = this.pricingRules.get(serviceId);
        return pricing?.factors || null;
    }
    async updateServicePricing(serviceId) {
        try {
            const orders = await storage.getOrders();
            const products = await storage.getProducts();
            const pricing = this.pricingRules.get(serviceId);
            if (pricing) {
                await this.calculatePricing(serviceId, pricing, orders, products);
            }
        }
        catch (error) {
            console.error(`Error updating pricing for service ${serviceId}:`, error);
        }
    }
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}
// Export singleton instance
export const pricingEngine = new DynamicPricingEngine();
//# sourceMappingURL=pricing-engine.js.map