import { storage } from './storage';
class LoyaltyProgram {
    constructor() {
        this.customerPoints = new Map();
        this.pointsTransactions = new Map();
        this.rewards = [];
        this.badges = new Map();
        this.initializeRewards();
        this.initializeBadges();
        this.loadCustomerData();
    }
    initializeRewards() {
        this.rewards = [
            {
                id: 'discount-5',
                name: '5% Discount',
                description: 'Get 5% off your next order',
                pointsRequired: 100,
                discountPercentage: 5,
                isActive: true
            },
            {
                id: 'discount-10',
                name: '10% Discount',
                description: 'Get 10% off your next order',
                pointsRequired: 250,
                discountPercentage: 10,
                isActive: true
            },
            {
                id: 'discount-15',
                name: '15% Discount',
                description: 'Get 15% off your next order',
                pointsRequired: 500,
                discountPercentage: 15,
                isActive: true
            },
            {
                id: 'free-cleaning',
                name: 'Free Basic Cleaning',
                description: 'Get a free basic cleaning service',
                pointsRequired: 750,
                freeService: 'basic-cleaning',
                isActive: true
            },
            {
                id: 'discount-25',
                name: '25% Discount',
                description: 'Get 25% off your next order',
                pointsRequired: 1000,
                discountPercentage: 25,
                isActive: true
            },
            {
                id: 'free-premium',
                name: 'Free Premium Service',
                description: 'Get a free premium cleaning service',
                pointsRequired: 1500,
                freeService: 'premium-cleaning',
                isActive: true
            }
        ];
    }
    initializeBadges() {
        const badgeDefinitions = [
            {
                id: 'first-order',
                name: 'First Order',
                description: 'Completed your first order',
                icon: '🎉',
                category: 'milestone'
            },
            {
                id: 'five-star',
                name: 'Five Star Customer',
                description: 'Received 5-star rating',
                icon: '⭐',
                category: 'achievement'
            },
            {
                id: 'loyal-customer',
                name: 'Loyal Customer',
                description: 'Completed 10 orders',
                icon: '💎',
                category: 'milestone'
            },
            {
                id: 'big-spender',
                name: 'Big Spender',
                description: 'Spent over ₹10,000',
                icon: '💰',
                category: 'achievement'
            },
            {
                id: 'referral-champion',
                name: 'Referral Champion',
                description: 'Referred 5 customers',
                icon: '👥',
                category: 'special'
            },
            {
                id: 'reviewer',
                name: 'Active Reviewer',
                description: 'Left 5 reviews',
                icon: '📝',
                category: 'achievement'
            },
            {
                id: 'early-bird',
                name: 'Early Bird',
                description: 'Booked 5 morning appointments',
                icon: '🌅',
                category: 'special'
            },
            {
                id: 'weekend-warrior',
                name: 'Weekend Warrior',
                description: 'Booked 5 weekend appointments',
                icon: '🏆',
                category: 'special'
            }
        ];
        badgeDefinitions.forEach(badge => {
            this.badges.set(badge.id, badge);
        });
    }
    async loadCustomerData() {
        try {
            const customers = await storage.getCustomers();
            const orders = await storage.getOrders();
            customers.forEach(customer => {
                const customerOrders = orders.filter(order => order.customerId === customer.id);
                const totalSpent = customerOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
                // Calculate points based on orders
                const earnedPoints = this.calculatePointsFromOrders(customerOrders);
                this.customerPoints.set(customer.id, {
                    customerId: customer.id,
                    totalPoints: earnedPoints,
                    availablePoints: earnedPoints,
                    redeemedPoints: 0,
                    level: this.calculateLevel(earnedPoints),
                    badges: this.calculateBadges(customer.id, customerOrders, totalSpent),
                    lastUpdated: new Date()
                });
            });
            console.log(`Loaded loyalty data for ${customers.length} customers`);
        }
        catch (error) {
            console.error('Error loading customer loyalty data:', error);
        }
    }
    calculatePointsFromOrders(orders) {
        return orders.reduce((points, order) => {
            const orderValue = parseFloat(order.totalAmount);
            // 1 point per ₹10 spent
            return points + Math.floor(orderValue / 10);
        }, 0);
    }
    calculateLevel(points) {
        if (points >= 2000)
            return 'Diamond';
        if (points >= 1000)
            return 'Platinum';
        if (points >= 500)
            return 'Gold';
        if (points >= 100)
            return 'Silver';
        return 'Bronze';
    }
    calculateBadges(customerId, orders, totalSpent) {
        const badges = [];
        const now = new Date();
        // First Order badge
        if (orders.length >= 1) {
            badges.push({
                ...this.badges.get('first-order'),
                earnedAt: new Date(orders[0].createdAt || now)
            });
        }
        // Loyal Customer badge
        if (orders.length >= 10) {
            badges.push({
                ...this.badges.get('loyal-customer'),
                earnedAt: new Date(orders[9].createdAt || now)
            });
        }
        // Big Spender badge
        if (totalSpent >= 10000) {
            badges.push({
                ...this.badges.get('big-spender'),
                earnedAt: new Date()
            });
        }
        // Early Bird badge (morning appointments)
        const morningOrders = orders.filter(order => {
            const hour = new Date(order.createdAt || new Date()).getHours();
            return hour >= 6 && hour <= 10;
        });
        if (morningOrders.length >= 5) {
            badges.push({
                ...this.badges.get('early-bird'),
                earnedAt: new Date()
            });
        }
        // Weekend Warrior badge
        const weekendOrders = orders.filter(order => {
            const day = new Date(order.createdAt || new Date()).getDay();
            return day === 0 || day === 6; // Sunday or Saturday
        });
        if (weekendOrders.length >= 5) {
            badges.push({
                ...this.badges.get('weekend-warrior'),
                earnedAt: new Date()
            });
        }
        return badges;
    }
    async addPoints(customerId, points, source, description) {
        const customerData = this.customerPoints.get(customerId);
        if (!customerData) {
            // Initialize customer if not exists
            await this.initializeCustomer(customerId);
        }
        const customer = this.customerPoints.get(customerId);
        customer.totalPoints += points;
        customer.availablePoints += points;
        customer.level = this.calculateLevel(customer.totalPoints);
        customer.lastUpdated = new Date();
        // Add transaction
        const transaction = {
            id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            customerId,
            points,
            type: 'earned',
            source,
            description,
            timestamp: new Date()
        };
        if (!this.pointsTransactions.has(customerId)) {
            this.pointsTransactions.set(customerId, []);
        }
        this.pointsTransactions.get(customerId).push(transaction);
        // Check for new badges
        await this.checkForNewBadges(customerId);
        console.log(`Added ${points} points to customer ${customerId} for ${source}`);
    }
    async redeemPoints(customerId, points, rewardId) {
        const customer = this.customerPoints.get(customerId);
        if (!customer || customer.availablePoints < points) {
            return false;
        }
        const reward = this.rewards.find(r => r.id === rewardId);
        if (!reward || !reward.isActive) {
            return false;
        }
        customer.availablePoints -= points;
        customer.redeemedPoints += points;
        customer.lastUpdated = new Date();
        // Add transaction
        const transaction = {
            id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            customerId,
            points: -points,
            type: 'redeemed',
            source: 'reward',
            description: `Redeemed ${reward.name}`,
            timestamp: new Date()
        };
        if (!this.pointsTransactions.has(customerId)) {
            this.pointsTransactions.set(customerId, []);
        }
        this.pointsTransactions.get(customerId).push(transaction);
        console.log(`Customer ${customerId} redeemed ${points} points for ${reward.name}`);
        return true;
    }
    getCustomerPoints(customerId) {
        return this.customerPoints.get(customerId) || null;
    }
    getCustomerTransactions(customerId) {
        return this.pointsTransactions.get(customerId) || [];
    }
    getAvailableRewards(customerId) {
        const customer = this.customerPoints.get(customerId);
        if (!customer)
            return [];
        return this.rewards.filter(reward => reward.isActive && customer.availablePoints >= reward.pointsRequired);
    }
    getLeaderboard(limit = 10) {
        return Array.from(this.customerPoints.values())
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .slice(0, limit);
    }
    getAllBadges() {
        return Array.from(this.badges.values());
    }
    getRewards() {
        return this.rewards.filter(reward => reward.isActive);
    }
    async initializeCustomer(customerId) {
        this.customerPoints.set(customerId, {
            customerId,
            totalPoints: 0,
            availablePoints: 0,
            redeemedPoints: 0,
            level: 'Bronze',
            badges: [],
            lastUpdated: new Date()
        });
    }
    async checkForNewBadges(customerId) {
        const customer = this.customerPoints.get(customerId);
        if (!customer)
            return;
        const orders = await storage.getOrders();
        const customerOrders = orders.filter(order => order.customerId === customerId);
        const totalSpent = customerOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
        const newBadges = this.calculateBadges(customerId, customerOrders, totalSpent);
        // Add new badges that customer doesn't already have
        newBadges.forEach(newBadge => {
            const existingBadge = customer.badges.find(badge => badge.id === newBadge.id);
            if (!existingBadge) {
                customer.badges.push(newBadge);
                console.log(`Customer ${customerId} earned new badge: ${newBadge.name}`);
            }
        });
    }
    async processOrderRewards(customerId, orderValue) {
        const points = Math.floor(orderValue / 10); // 1 point per ₹10
        await this.addPoints(customerId, points, 'order', `Points earned from order worth ₹${orderValue}`);
    }
}
// Export singleton instance
export const loyaltyProgram = new LoyaltyProgram();
//# sourceMappingURL=loyalty-program.js.map