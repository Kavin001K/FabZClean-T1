import { Router } from "express";
import { db as storage } from "../db";
import { insertTransitOrderSchema, TransitOrder, Order } from "../../shared/schema";
import { z } from "zod";
import { authMiddleware, auditMiddleware, scopeMiddleware } from "../middleware/employee-auth";



const router = Router();

// Protect all routes
router.use(authMiddleware);
// Apply scope filtering (automatically adds franchiseId/factoryId to query/body)
router.use(scopeMiddleware);

// GET all transit orders (filtered by franchise, type, status)
router.get("/", async (req, res) => {
    try {
        const { type, status } = req.query;

        // STRICT FRANCHISE ISOLATION
        const employee = req.employee;
        let effectiveFranchiseId: string | undefined = undefined;

        if (employee) {
            if (employee.role === 'admin' || employee.role === 'factory_manager') {
                // Admin/Factory manager can filter by any franchise or see all
                effectiveFranchiseId = req.query.franchiseId as string | undefined;
                console.log(`[Transit GET] Admin/FM viewing transits, filter: ${effectiveFranchiseId || 'ALL'}`);
            } else {
                // All other roles MUST use their own franchise
                if (!employee.franchiseId) {
                    return res.status(403).json({
                        message: 'Access denied - no franchise assignment',
                        error: 'Your account is not assigned to any franchise.'
                    });
                }
                effectiveFranchiseId = employee.franchiseId;
                console.log(`[Transit GET] User ${employee.username} viewing transits for franchise: ${effectiveFranchiseId}`);
            }
        }

        // Fetch from database with franchise filter
        let transits = await storage.listTransitOrders();

        // Filter by type if provided (e.g., "To Factory", "Return to Store")
        if (type) {
            transits = transits.filter((t: TransitOrder) => {
                const transitType = t.type?.toLowerCase().replace(/\s+/g, '_');
                const queryType = (type as string).toLowerCase().replace(/\s+/g, '_');
                return transitType === queryType || t.type === type;
            });
        }

        // Filter by status if provided (e.g., "in_transit", "Received")
        if (status) {
            transits = transits.filter((t: TransitOrder) => {
                const transitStatus = t.status?.toLowerCase().replace(/\s+/g, '_');
                const queryStatus = (status as string).toLowerCase().replace(/\s+/g, '_');
                return transitStatus === queryStatus || t.status === status;
            });
        }

        res.json(transits);
    } catch (error) {
        console.error("Error fetching transit orders:", error);
        res.status(500).json({ message: "Failed to fetch transit orders" });
    }
});

// GET eligible orders for transit
router.get("/eligible", async (req, res) => {
    try {
        const { type } = req.query;

        // STRICT FRANCHISE ISOLATION for eligible orders
        const employee = req.employee;
        let effectiveFranchiseId: string | undefined = undefined;

        if (employee) {
            if (employee.role === 'admin' || employee.role === 'factory_manager') {
                // Admin/Factory manager can filter by any franchise or see all
                effectiveFranchiseId = req.query.franchiseId as string | undefined;
            } else {
                // All other roles MUST use their own franchise
                if (!employee.franchiseId) {
                    return res.status(403).json({
                        message: 'Access denied - no franchise assignment',
                        error: 'Your account is not assigned to any franchise.'
                    });
                }
                effectiveFranchiseId = employee.franchiseId;
            }
        }

        console.log(`[Transit] Fetching eligible orders - type: ${type}, franchise: ${effectiveFranchiseId}`);

        // Get orders filtered by franchise
        const allOrders = await storage.listOrders(effectiveFranchiseId);
        console.log(`[Transit] Orders for franchise ${effectiveFranchiseId}: ${allOrders.length}`);

        // Get orders that are already in active transit
        const activeTransits = await storage.listTransitOrders();
        const ordersInActiveTransit = new Set<string>();

        for (const transit of activeTransits) {
            const transitStatus = transit.status?.toLowerCase();
            if (transitStatus === 'in_transit' || transitStatus === 'in transit' || transitStatus === 'pending') {
                try {
                    const items = await storage.getTransitOrderItems(transit.id);
                    items.forEach((item: any) => {
                        if (item.orderId) ordersInActiveTransit.add(item.orderId);
                    });
                } catch (e) {
                    console.warn(`Could not fetch items for transit ${transit.id}`);
                }
            }
        }

        console.log(`[Transit] Orders already in active transit: ${ordersInActiveTransit.size}`);

        let eligibleOrders: Order[] = [];

        // Helper function for case-insensitive status check
        const statusMatches = (orderStatus: string, targetStatus: string) => {
            return orderStatus?.toLowerCase() === targetStatus.toLowerCase();
        };

        if (type === 'To Factory') {
            // Orders eligible for Store -> Factory: pending status, not in active transit
            eligibleOrders = allOrders.filter((o: Order) => {
                const isPending = statusMatches(o.status, 'pending');
                const notInTransit = !ordersInActiveTransit.has(o.id);
                return isPending && notInTransit;
            });
            console.log(`[Transit] Eligible for 'To Factory': ${eligibleOrders.length}`);
        } else if (type === 'Return to Store') {
            // Orders eligible for Factory -> Store: processing status (at factory)
            eligibleOrders = allOrders.filter((o: Order) => {
                const isProcessing = statusMatches(o.status, 'processing');
                const notInTransit = !ordersInActiveTransit.has(o.id);
                return isProcessing && notInTransit;
            });
            console.log(`[Transit] Eligible for 'Return to Store': ${eligibleOrders.length}`);
        } else {
            // No type specified, return all non-completed, non-transit orders
            eligibleOrders = allOrders.filter((o: Order) => {
                const statusLower = o.status?.toLowerCase();
                const isPendingOrProcessing = statusLower === 'pending' || statusLower === 'processing';
                const notInTransit = !ordersInActiveTransit.has(o.id);
                return isPendingOrProcessing && notInTransit;
            });
            console.log(`[Transit] Eligible for all types: ${eligibleOrders.length}`);
        }

        // Log sample order for debugging
        if (allOrders.length > 0) {
            console.log(`[Transit] Sample order status: "${allOrders[0].status}" (type: ${typeof allOrders[0].status})`);
        }

        // Sort eligible orders: Express orders first, then by due date for fast transit
        eligibleOrders.sort((a: Order, b: Order) => {
            const aIsExpress = (a as any).isExpressOrder || (a as any).is_express_order || (a as any).priority === 'high';
            const bIsExpress = (b as any).isExpressOrder || (b as any).is_express_order || (b as any).priority === 'high';

            if (aIsExpress && !bIsExpress) return -1;
            if (!aIsExpress && bIsExpress) return 1;

            // Then by due date
            const dateA = a.pickupDate ? new Date(a.pickupDate).getTime() : Infinity;
            const dateB = b.pickupDate ? new Date(b.pickupDate).getTime() : Infinity;
            return dateA - dateB;
        });

        console.log(`[Transit] Final eligible orders: ${eligibleOrders.length}`);
        res.json(eligibleOrders);
    } catch (error) {
        console.error("Fetch eligible orders error:", error);
        res.status(500).json({ message: "Failed to fetch eligible orders" });
    }
});

// CREATE Transit Order
router.post("/", auditMiddleware('create_transit_order', 'transit_order'), async (req, res) => {
    try {
        const {
            orderIds, vehicleNumber, driverName, type, franchiseId, employeeId,
            driverPhone, driverLicense, vehicleType, employeeName, employeePhone, designation,
            storeDetails, factoryDetails, origin, destination
        } = req.body;

        // STRICT FRANCHISE ISOLATION
        const employee = req.employee;
        let effectiveFranchiseId = franchiseId;

        // Non-admin/factory_manager users must use their own franchiseId
        if (employee && employee.role !== 'admin' && employee.role !== 'factory_manager') {
            if (!employee.franchiseId) {
                return res.status(403).json({
                    message: 'Cannot create transit - no franchise assignment',
                    error: 'Your account is not assigned to any franchise.'
                });
            }
            effectiveFranchiseId = employee.franchiseId;
            console.log(`[Transit] Enforcing franchise isolation: ${effectiveFranchiseId} (user: ${employee.username})`);
        }

        // Validate required fields
        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({ message: "No orders selected" });
        }


        // Generate new Transit ID format: TRN-2025POL001A-F
        const transitId = await storage.getNextTransitId(effectiveFranchiseId, type);

        // 1. Create Transit Record
        const transitData = {
            id: transitId,
            transitId,
            type,
            status: 'In Transit',
            vehicleNumber,
            vehicleType,
            driverName,
            driverPhone,
            driverLicense,
            employeeId: employeeId || employee?.employeeId,
            employeeName: employeeName || employee?.username,
            franchiseId: effectiveFranchiseId,
            origin,
            destination,
            totalOrders: orderIds.length,
            storeDetails,
            factoryDetails
        };

        console.log(`[Transit] Creating transit order: ${transitId}`);
        console.log(`[Transit] Type: ${type}, Orders: ${orderIds.length}, Franchise: ${effectiveFranchiseId}`);

        const newTransit = await storage.createTransitOrder(transitData);
        console.log(`[Transit] Created transit:`, newTransit?.id, 'ID:', transitId, 'Orders:', newTransit?.totalOrders || newTransit?.total_orders);

        // 2. Process Items and Update Orders based on transit type
        for (const orderId of orderIds) {
            const order = await storage.getOrder(orderId);
            if (order) {
                // Try to create transit order item, but don't fail if it errors
                try {
                    await storage.addTransitOrderItem({
                        transitOrderId: newTransit.id,
                        orderId: order.id,
                        orderNumber: order.orderNumber,
                        customerId: order.customerId,
                        customerName: order.customerName,
                        status: 'In Transit'
                    });
                } catch (itemError: any) {
                    console.warn(`[Transit] Could not create item for order ${order.orderNumber}:`, itemError?.message);
                    // Continue processing - don't fail the entire transit creation
                }

                /**
                 * ORDER LIFECYCLE WORKFLOW:
                 * 
                 * 1. Order Created → pending (at store)
                 * 2. Store→Factory Transit Created → in_transit (going to factory)
                 * 3. Factory Receives Transit → processing (factory working on it)
                 * 4. Factory→Store Transit Created → ready_for_transit (factory done, returning)
                 * 5. Store Receives Return Transit → ready_for_pickup / out_for_delivery
                 * 6. Customer Handover (payment must be paid) → completed / delivered
                 */

                if (type === 'To Factory') {
                    // Store → Factory: Order is now in transit to factory
                    await storage.updateOrder(order.id, { status: 'in_transit' });
                    console.log(`[Transit] Order ${order.orderNumber} marked as in_transit (going to factory)`);
                }

                if (type === 'Return to Store') {
                    // Factory → Store: Factory work is done, order is being returned
                    await storage.updateOrder(order.id, { status: 'ready_for_transit' });
                    console.log(`[Transit] Order ${order.orderNumber} marked as ready_for_transit (factory done, returning to store)`);
                }
            }
        }

        res.json(newTransit);
    } catch (error: any) {
        console.error("Create transit error:", error);
        console.error("Error details:", error?.message, error?.code, error?.details);
        res.status(500).json({
            message: "Failed to create transit order",
            error: error?.message || 'Unknown error',
            details: error?.details || null
        });
    }
});

// UPDATE Transit Status
router.put("/:id/status", auditMiddleware('update_transit_status', 'transit_order'), async (req, res) => {
    try {
        const { status } = req.body;
        const transit = await storage.getTransitOrder(req.params.id);

        if (!transit) return res.status(404).json({ message: "Transit order not found" });

        // Update Transit status
        await storage.updateTransitOrder(req.params.id, { status });

        // Create history record
        try {
            await storage.addTransitStatusHistory(
                req.params.id,
                status,
                undefined,
                undefined
            );
        } catch (historyError) {
            console.warn('Could not create transit history:', historyError);
        }

        // Get linked orders
        const items = await storage.getTransitOrderItems(req.params.id);

        // Handle different transit types and statuses
        if (status === 'Received') {
            if (transit.type === 'To Factory') {
                // Factory receives shipment from store → Orders move to "processing"
                for (const item of items) {
                    await storage.updateOrder(item.orderId, { status: 'processing' });
                }
                console.log(`[Transit] Factory received ${items.length} orders - marked as processing`);
            } else if (transit.type === 'Return to Store') {
                // Store receives shipment from factory → Orders move to "ready_for_pickup"
                for (const item of items) {
                    // Get the order to check fulfillment type
                    const order = await storage.getOrder(item.orderId);
                    // Mark as ready_for_pickup (both delivery and pickup start here)
                    await storage.updateOrder(item.orderId, { status: 'ready_for_pickup' });
                }
                console.log(`[Transit] Store received ${items.length} orders - marked as ready_for_pickup`);
            }
        }

        res.json({ success: true, message: `Transit marked as ${status}` });
    } catch (error) {
        console.error("Update transit status error:", error);
        res.status(500).json({ message: "Failed to update status" });
    }
});

// GET transit order status history
router.get("/:id/status-history", async (req, res) => {
    try {
        const transitId = req.params.id;
        const history = await storage.getTransitStatusHistory(transitId);
        res.json(history || []);
    } catch (error) {
        console.error("Get transit status history error:", error);
        res.status(500).json({ message: "Failed to fetch status history" });
    }
});

// GET transit order items (orders linked to this shipment)
router.get("/:id/items", async (req, res) => {
    try {
        const transitId = req.params.id;
        const items = await storage.getTransitOrderItems(transitId);

        // Fetch full order details for each item
        const ordersWithDetails = await Promise.all(
            items.map(async (item: any) => {
                const order = await storage.getOrder(item.orderId);
                return {
                    ...item,
                    order: order || null
                };
            })
        );

        res.json(ordersWithDetails);
    } catch (error) {
        console.error("Get transit order items error:", error);
        res.status(500).json({ message: "Failed to fetch transit items" });
    }
});

export default router;
