/**
 * Fab Clean WhatsApp Flow - Production Ready
 * 4 Screens | Structured Address | ERP Integration
 */

import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

// ============================================================================
// CONFIGURATION
// ============================================================================

const SERVICES: Record<string, { name: string; base: number; time: string; days: string }> = {
    wash: { name: 'Wash & Iron', base: 35, time: '5-7 days', days: '5-7' },
    iron: { name: 'Ironing Only', base: 20, time: '3-5 days', days: '3-5' },
    dry: { name: 'Dry Cleaning', base: 80, time: '5-7 days', days: '5-7' },
    express: { name: 'Express', base: 70, time: '1-2 days', days: '1-2' },
};

const ITEMS: Record<string, { name: string; mult: number }> = {
    shirts: { name: 'Shirts & T-Shirts', mult: 1 },
    pants: { name: 'Pants & Jeans', mult: 1.2 },
    ethnic: { name: 'Saree, Kurta, Ethnic', mult: 2 },
    suits: { name: 'Suit, Blazer, Coat', mult: 3 },
    home: { name: 'Bedsheet, Curtains', mult: 1.5 },
    others: { name: 'Other Items', mult: 1 },
};

const CITIES: Record<string, string> = {
    pollachi: 'Pollachi',
    kinathukadavu: 'Kinathukadavu',
    coimbatore: 'Coimbatore',
    udumalpet: 'Udumalpet',
    valparai: 'Valparai',
    other: 'Other',
};

const SLOTS: Record<string, string> = {
    morning: 'Morning (8AM-12PM)',
    afternoon: 'Afternoon (12PM-5PM)',
    evening: 'Evening (5PM-8PM)',
};

// ============================================================================
// HELPERS
// ============================================================================

function genOrderId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return `FZC-${id}`;
}

function formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (d.toDateString() === today.toDateString()) return 'Today';
        if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

        return d.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    } catch {
        return dateStr;
    }
}

function calcEstimate(serviceId: string, itemIds: string[], qty: string): { min: number; max: number } {
    const svc = SERVICES[serviceId] || SERVICES.wash;
    const q = parseInt(qty) || 5;
    const items = Array.isArray(itemIds) ? itemIds : ['shirts'];

    let maxMult = 1;
    for (const id of items) {
        if (ITEMS[id] && ITEMS[id].mult > maxMult) {
            maxMult = ITEMS[id].mult;
        }
    }

    const base = svc.base * maxMult * q;
    return {
        min: Math.round(base * 0.85),
        max: Math.round(base * 1.15),
    };
}

function getItemNames(ids: string[]): string {
    if (!ids || ids.length === 0) return 'Various items';
    const names = ids.map(id => ITEMS[id]?.name || id).slice(0, 2);
    if (ids.length > 2) return `${names.join(', ')} +${ids.length - 2}`;
    return names.join(', ');
}

// ============================================================================
// WEBHOOK
// ============================================================================

router.post('/webhook', async (req: Request, res: Response) => {
    const { action, ...data } = req.body;
    console.log(`[WhatsApp Flow] ${action}:`, JSON.stringify(data, null, 2));

    if (action === 'book') {
        const orderId = genOrderId();
        const svc = SERVICES[data.service] || SERVICES.wash;
        const items = Array.isArray(data.items) ? data.items : ['shirts'];
        const est = calcEstimate(data.service, items, data.qty);
        const slot = SLOTS[data.slot] || SLOTS.morning;
        const dateStr = formatDate(data.date);
        const cityName = CITIES[data.city] || data.city;
        const qty = data.qty || '~5';

        // Build structured address
        const addressParts = [data.door, data.street];
        if (data.landmark) addressParts.push(`Near ${data.landmark}`);
        addressParts.push(`${cityName} - ${data.pincode}`);
        const fullAddress = addressParts.join(', ');

        // Build summary
        const summary = `🧺 ${svc.name} • ${qty} pcs\n👕 ${getItemNames(items)}`;

        // Build estimate string
        const estimateStr = `₹${est.min} - ₹${est.max}`;

        // Save to database
        try {
            await db.createOrder({
                orderNumber: orderId,
                customerName: data.name,
                customerPhone: data.phone,
                status: 'confirmed',
                items: items.map((id: string) => ({
                    serviceName: `${svc.name} - ${ITEMS[id]?.name || id}`,
                    quantity: Math.ceil((parseInt(data.qty) || 5) / items.length),
                    price: svc.base * (ITEMS[id]?.mult || 1),
                })),
                totalAmount: est.min.toString(),
                pickupAddress: {
                    door: data.door,
                    street: data.street,
                    landmark: data.landmark || '',
                    city: cityName,
                    pincode: data.pincode,
                    full: fullAddress,
                },
                pickupDate: new Date(data.date),
                pickupTimeSlot: data.slot,
                notes: data.notes || '',
                source: 'whatsapp',
            });
            console.log(`[WhatsApp Flow] ✅ Order ${orderId} created`);
        } catch (err) {
            console.error('[WhatsApp Flow] DB Error:', err);
        }

        return res.json({
            screen: 'DONE',
            data: {
                order_id: orderId,
                summary: summary,
                address: fullAddress,
                pickup: `📅 ${dateStr}\n⏰ ${slot}`,
                estimate: estimateStr,
            },
        });
    }

    return res.status(400).json({ error: 'Invalid action' });
});

// Health check
router.get('/health', (_, res) => {
    res.json({
        status: 'healthy',
        version: '5.0',
        screens: ['HELLO', 'ORDER', 'PICKUP', 'DONE'],
        services: Object.keys(SERVICES),
        items: Object.keys(ITEMS),
        cities: Object.keys(CITIES),
        slots: Object.keys(SLOTS),
    });
});

// Get pricing
router.get('/pricing', (_, res) => {
    res.json({ services: SERVICES, items: ITEMS, cities: CITIES, slots: SLOTS });
});

export default router;
