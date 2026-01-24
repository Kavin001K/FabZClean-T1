import React, { useMemo } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Order } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle2, Clock, Package, Truck, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { createPortal } from 'react-dom';

// ----------------------------------------------------------------------
// Status Mapping & Configuration
// ----------------------------------------------------------------------

const COLUMNS = [
    { id: 'pending', title: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'processing', title: 'Processing', color: 'bg-blue-100 text-blue-800' },
    { id: 'ready', title: 'Ready', color: 'bg-green-100 text-green-800' },
    { id: 'out_for_delivery', title: 'Out for Delivery', color: 'bg-purple-100 text-purple-800' },
    { id: 'completed', title: 'Completed', color: 'bg-gray-100 text-gray-800' },
];

const STATUS_MAP: Record<string, string> = {
    pending: 'pending',
    processing: 'processing',
    in_store: 'ready',
    ready_for_pickup: 'ready',
    ready_for_transit: 'ready',
    assigned: 'out_for_delivery',
    in_transit: 'out_for_delivery',
    shipped: 'out_for_delivery',
    out_for_delivery: 'out_for_delivery',
    delivered: 'completed',
    completed: 'completed',
    cancelled: 'completed', // Or separate column
    archived: 'completed',
};

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

interface OrderTimelineViewProps {
    orders: Order[];
    onStatusChange: (orderId: string, newStatus: string) => void;
    onOrderClick: (order: Order) => void;
}

interface SortableOrderCardProps {
    order: Order;
    onClick: () => void;
}

// ----------------------------------------------------------------------
// Components
// ----------------------------------------------------------------------

function SortableOrderCard({ order, onClick }: SortableOrderCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: order.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const getPriorityColor = (p?: string) => {
        switch (p) {
            case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3">
            <Card
                className="cursor-pointer hover:shadow-md transition-shadow dark:bg-slate-900/50"
                onClick={onClick}
            >
                <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between">
                        <span className="font-mono text-xs font-bold text-muted-foreground">
                            {order.orderNumber}
                        </span>
                        {order.priority !== 'normal' && (
                            <Badge variant="outline" className={`text-[10px] px-1 py-0 h-5 ${getPriorityColor(order.priority || 'normal')}`}>
                                {order.priority}
                            </Badge>
                        )}
                    </div>

                    <div>
                        <h4 className="font-semibold text-sm truncate" title={order.customerName}>
                            {order.customerName}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {order.pickupDate ? format(new Date(order.pickupDate), 'MMM d') : 'No Date'}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t mt-2">
                        <Badge variant="secondary" className="text-[10px]">
                            {order.items?.length || 0} items
                        </Badge>
                        <span className="font-bold text-sm">
                            ₹{order.totalAmount}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function DroppableColumn({
    id,
    title,
    color,
    items
}: {
    id: string;
    title: string;
    color: string;
    items: Order[];
}) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className="flex flex-col h-full min-w-[280px] w-[280px] bg-muted/30 rounded-lg border border-border/50">
            {/* Column Header */}
            <div className={`p-3 rounded-t-lg border-b font-medium flex items-center justify-between ${color}`}>
                <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-current opacity-50" />
                    {title}
                </span>
                <Badge variant="secondary" className="bg-white/50 text-inherit border-0">
                    {items.length}
                </Badge>
            </div>

            {/* Droppable Area */}
            <div ref={setNodeRef} className="flex-1 p-2 overflow-y-auto min-h-[150px]">
                <SortableContext
                    items={items.map(o => o.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {items.map((order) => (
                        <SortableOrderCard
                            key={order.id}
                            order={order}
                            onClick={() => { }} // Handle click in parent or pass through
                        />
                    ))}
                </SortableContext>
                {items.length === 0 && (
                    <div className="h-24 border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground text-xs opacity-50">
                        Drop here
                    </div>
                )}
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export function OrderTimelineView({ orders, onStatusChange, onOrderClick }: OrderTimelineViewProps) {
    const [activeId, setActiveId] = React.useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Require drag 5px before activation to prevent accidental drags on click
            }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Group orders by column
    const columns = useMemo(() => {
        const grouped: Record<string, Order[]> = {
            pending: [],
            processing: [],
            ready: [],
            out_for_delivery: [],
            completed: [],
        };

        orders.forEach((order) => {
            const mappedStatus = STATUS_MAP[order.status] || 'pending';
            if (grouped[mappedStatus]) {
                grouped[mappedStatus].push(order);
            } else {
                // Fallback for unknown statuses
                grouped['pending'].push(order);
            }
        });

        return grouped;
    }, [orders]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeOrderId = active.id as string;
        const overId = over.id as string;

        // Find which column "over" belongs to
        // If "over" is a column ID
        let newStatus = '';
        if (Object.keys(columns).includes(overId)) {
            newStatus = overId;
        } else {
            // If "over" is another card, find that card's column
            // We can find the order in our list
            const overOrder = orders.find(o => o.id === overId);
            if (overOrder) {
                newStatus = STATUS_MAP[overOrder.status] || 'pending';
            }
        }

        if (newStatus) {
            // Map generic column status back to specific status if needed, 
            // OR just use the column ID if your backend supports updating to 'ready'/'out_for_delivery' broadly.
            // Since we have specific statuses like 'ready_for_pickup', we might default to one.

            let actualStatus = newStatus;
            if (newStatus === 'ready') actualStatus = 'ready_for_pickup'; // Default
            if (newStatus === 'out_for_delivery') actualStatus = 'out_for_delivery';

            // Only update if changed
            const currentOrder = orders.find(o => o.id === activeOrderId);
            const currentMapped = currentOrder ? (STATUS_MAP[currentOrder.status] || 'pending') : '';

            if (currentMapped !== newStatus) {
                onStatusChange(activeOrderId, actualStatus);
            }
        }
    };

    const activeOrder = activeId ? orders.find(o => o.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <ScrollArea className="h-full w-full">
                <div className="flex bg-muted/10 p-4 h-full gap-4 overflow-x-auto min-w-full">
                    {COLUMNS.map((col) => (
                        <DroppableColumn
                            key={col.id}
                            id={col.id}
                            title={col.title}
                            color={col.color}
                            items={columns[col.id] || []}
                        />
                    ))}
                </div>
            </ScrollArea>

            {createPortal(
                <DragOverlay>
                    {activeOrder ? (
                        <div className="transform rotate-2 opacity-90 cursor-grabbing w-[280px]">
                            <SortableOrderCard order={activeOrder} onClick={() => { }} />
                        </div>
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}
