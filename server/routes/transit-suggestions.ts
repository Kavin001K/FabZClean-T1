import express, { Request, Response } from 'express';
import { storage } from '../storage';

const router = express.Router();

// Get smart suggestions for transit orders
router.get('/suggestions', async (req: Request, res: Response) => {
    try {
        const { type } = req.query;
        const allOrders = await storage.getOrders();

        let suggestions = [];

        if (type === 'store_to_factory') {
            // Suggest orders that are newly created or marked ready for transit
            suggestions = allOrders.filter((order: any) =>
                ['pending', 'in_store', 'ready_for_transit'].includes(order.status)
            );
        } else if (type === 'factory_to_store') {
            // Suggest orders that are processed and ready to go back
            suggestions = allOrders.filter((order: any) =>
                ['processing', 'ready_for_delivery', 'completed'].includes(order.status)
            );
        } else {
            // Default: return all active orders that might need transit
            suggestions = allOrders.filter((order: any) =>
                !['delivered', 'cancelled'].includes(order.status)
            );
        }

        // Sort by: 1) Express orders first (priority), 2) Due date (orders due sooner come first)
        suggestions.sort((a: any, b: any) => {
            // Express/Priority orders always come first
            const aIsExpress = a.isExpressOrder || a.is_express_order || a.priority === 'high' || a.priority === 'urgent';
            const bIsExpress = b.isExpressOrder || b.is_express_order || b.priority === 'high' || b.priority === 'urgent';

            if (aIsExpress && !bIsExpress) return -1;
            if (!aIsExpress && bIsExpress) return 1;

            // Then sort by due date
            const dateA = a.pickupDate ? new Date(a.pickupDate).getTime() : 0;
            const dateB = b.pickupDate ? new Date(b.pickupDate).getTime() : 0;

            // If one has a date and the other doesn't, the one with date comes first (if date is valid)
            if (dateA && !dateB) return -1;
            if (!dateA && dateB) return 1;

            return dateA - dateB;
        });

        // Limit to top 20 suggestions
        res.json(suggestions.slice(0, 20));
    } catch (error) {
        console.error('Error fetching transit suggestions:', error);
        res.status(500).json({ message: 'Failed to fetch suggestions' });
    }
});

export default router;
