import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Minus, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Order, Service } from "@shared/schema";
import { servicesApi } from "@/lib/data-service";

export interface EditOrderDialogProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (orderId: string, updates: Partial<Order>) => void;
  isLoading?: boolean;
}

type EditableOrderItem = {
  serviceId: string;
  serviceName: string;
  quantity: number;
  price: string;
  subtotal: string;
  customName?: string;
  tagNote?: string;
};

export default React.memo(function EditOrderDialog({
  order,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}: EditOrderDialogProps) {
  const [formData, setFormData] = useState<Partial<Order>>({});
  const [editableItems, setEditableItems] = useState<EditableOrderItem[]>([]);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);

  const toMoney = (value: unknown, fallback = 0): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
  };

  const normalizeItem = (item: any, index: number): EditableOrderItem => {
    const quantity = Math.max(1, Math.round(toMoney(item?.quantity, 1)));
    const unitPrice = toMoney(item?.price, toMoney(item?.unitPrice, 0));
    const subtotal = toMoney(item?.subtotal, unitPrice * quantity);
    return {
      serviceId: String(item?.serviceId || item?.id || `custom-${index + 1}`),
      serviceName: String(item?.serviceName || item?.name || item?.customName || 'Service').trim() || 'Service',
      quantity,
      price: unitPrice.toFixed(2),
      subtotal: subtotal.toFixed(2),
      customName: item?.customName ? String(item.customName) : undefined,
      tagNote: item?.tagNote ? String(item.tagNote) : undefined,
    };
  };

  useEffect(() => {
    if (order) {
      setFormData({
        ...order,
      });

      const incomingItems = Array.isArray((order as any).items)
        ? (order as any).items
        : [];

      if (incomingItems.length > 0) {
        setEditableItems(incomingItems.map((item: any, index: number) => normalizeItem(item, index)));
      } else {
        const fallbackItem: EditableOrderItem = {
          serviceId: 'manual',
          serviceName: String((order as any).service || 'Service'),
          quantity: Math.max(1, Math.round(toMoney((order as any).quantity, 1))),
          price: toMoney(order.totalAmount, 0).toFixed(2),
          subtotal: toMoney(order.totalAmount, 0).toFixed(2),
        };
        setEditableItems([fallbackItem]);
      }
    }
  }, [order]);

  useEffect(() => {
    if (!isOpen) return;
    servicesApi.getAll()
      .then((services) => {
        setAvailableServices(Array.isArray(services) ? services : []);
      })
      .catch(() => {
        setAvailableServices([]);
      });
  }, [isOpen]);

  const handleSave = () => {
    if (order && formData) {
      const cleanedItems = editableItems
        .map((item, index) => normalizeItem(item, index))
        .filter((item) => item.serviceName && item.quantity > 0);

      if (cleanedItems.length === 0) {
        return;
      }

      const recalculatedTotal = cleanedItems.reduce((sum, item) => sum + toMoney(item.subtotal, 0), 0);

      const updates: any = {
        status: formData.status,
        priority: (formData as any).priority || 'normal',
        pickupDate: (formData as any).pickupDate || null,
        fulfillmentType: (formData as any).fulfillmentType || (order as any).fulfillmentType || 'pickup',
        items: cleanedItems,
        totalAmount: recalculatedTotal.toFixed(2),
      };

      console.log('Saving order updates:', updates);
      onSave(order.id, updates);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateItem = (index: number, updater: (item: EditableOrderItem) => EditableOrderItem) => {
    setEditableItems((prev) => prev.map((item, i) => {
      if (i !== index) return item;
      const next = normalizeItem(updater(item), i);
      const qty = Math.max(1, next.quantity);
      const price = toMoney(next.price, 0);
      return {
        ...next,
        quantity: qty,
        price: price.toFixed(2),
        subtotal: (price * qty).toFixed(2),
      };
    }));
  };

  const handleServiceChange = (index: number, serviceId: string) => {
    const selected = availableServices.find((service) => service.id === serviceId);
    if (!selected) return;

    updateItem(index, (item) => ({
      ...item,
      serviceId: selected.id,
      serviceName: selected.name,
      price: toMoney(selected.price, 0).toFixed(2),
      subtotal: (toMoney(selected.price, 0) * Math.max(1, item.quantity)).toFixed(2),
    }));
  };

  const handleQuantityChange = (index: number, nextQuantity: number) => {
    updateItem(index, (item) => ({
      ...item,
      quantity: Math.max(1, Math.round(nextQuantity)),
    }));
  };

  const handlePriceChange = (index: number, nextPrice: string) => {
    const parsed = toMoney(nextPrice, 0);
    updateItem(index, (item) => ({
      ...item,
      price: parsed.toFixed(2),
    }));
  };

  const handleAddItem = () => {
    const defaultService = availableServices[0];
    const defaultPrice = toMoney(defaultService?.price, 0).toFixed(2);
    setEditableItems((prev) => [
      ...prev,
      {
        serviceId: defaultService?.id || `custom-${Date.now()}`,
        serviceName: defaultService?.name || 'New Service',
        quantity: 1,
        price: defaultPrice,
        subtotal: defaultPrice,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setEditableItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  if (!order) return null;

  const isDelivery = ((formData as any).fulfillmentType || (order as any).fulfillmentType) === 'delivery';
  const recalculatedTotal = editableItems.reduce((sum, item) => sum + toMoney(item.subtotal, 0), 0);
  const getValidStatuses = (currentStatus: string) => {
    const list = isDelivery
      ? ['pending', 'processing', 'ready_for_delivery', 'out_for_delivery', 'delivered', 'cancelled']
      : ['pending', 'processing', 'ready_for_pickup', 'completed', 'cancelled'];
    if (currentStatus && !list.includes(currentStatus)) {
      list.push(currentStatus);
    }
    return list;
  };

  const formatStatusDisplay = (status: string) => {
    if (!status) return 'Unknown';
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background border-none shadow-2xl rounded-xl">
        <DialogHeader className="px-6 py-4 border-b bg-card">
          <DialogTitle className="text-xl font-bold">Edit Order: {order.id.substring(0, 8).toUpperCase()}</DialogTitle>
          <DialogDescription>
            Update order details and status. Check read-only info carefully.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Read-only Identity Section */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="customerName" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer Name</Label>
              <Input
                id="customerName"
                value={formData.customerName || ''}
                readOnly
                disabled
                className="bg-muted/30 cursor-not-allowed font-medium shadow-none border-dashed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderNumber" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order Number</Label>
              <Input
                id="orderNumber"
                value={formData.orderNumber || ''}
                readOnly
                disabled
                className="bg-muted/30 cursor-not-allowed font-medium uppercase tracking-wider shadow-none border-dashed"
              />
            </div>
          </div>

          {/* Editable Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center text-foreground">
              Update Details
              <span className="ml-2 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Editable</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-xl bg-card border shadow-sm relative overflow-hidden">
              <div className="absolute left-0 top-0 w-1 h-full bg-primary/80"></div>

              <div className="space-y-2">
                <Label htmlFor="status" className="font-medium">Order Status</Label>
                <Select
                  value={formData.status || 'pending'}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger className="border-primary/20 hover:border-primary/50 focus:ring-primary/20 transition-all font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getValidStatuses(formData.status || 'pending').map(status => (
                      <SelectItem key={status} value={status}>
                        {formatStatusDisplay(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="font-medium">Priority</Label>
                <Select
                  value={(formData as any).priority || 'normal'}
                  onValueChange={(value) => handleInputChange('priority', value)}
                >
                  <SelectTrigger className="border-primary/20 hover:border-primary/50 focus:ring-primary/20 transition-all font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fulfillmentType" className="font-medium">Fulfillment Type</Label>
                <Select
                  value={(formData as any).fulfillmentType || 'pickup'}
                  onValueChange={(value) => handleInputChange('fulfillmentType', value)}
                >
                  <SelectTrigger className="border-primary/20 hover:border-primary/50 focus:ring-primary/20 transition-all font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-medium">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal border-primary/20 hover:border-primary/50 focus:ring-primary/20 transition-all",
                        !(formData as any).pickupDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                      {(formData as any).pickupDate ? (
                        <span className="font-medium">{format(new Date((formData as any).pickupDate), "PPP")}</span>
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[100]">
                    <Calendar
                      mode="single"
                      selected={(formData as any).pickupDate ? new Date((formData as any).pickupDate) : undefined}
                      onSelect={(date) => handleInputChange('pickupDate', date ? date.toISOString() : '')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Editable Services Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">Order Services</h4>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add Service
              </Button>
            </div>

            <div className="space-y-3">
              {editableItems.map((item, index) => (
                <div key={`${item.serviceId}-${index}`} className="rounded-lg border bg-card p-3 md:p-4">
                  <div className="grid grid-cols-1 md:grid-cols-[1.4fr_140px_140px_120px_auto] gap-3 items-end">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Service</Label>
                      <Select
                        value={item.serviceId}
                        onValueChange={(value) => handleServiceChange(index, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          {!availableServices.some((service) => service.id === item.serviceId) && (
                            <SelectItem value={item.serviceId}>
                              {item.serviceName}
                            </SelectItem>
                          )}
                          {availableServices.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qty</Label>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => handleQuantityChange(index, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, Number(e.target.value || 1))}
                          className="text-center"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => handleQuantityChange(index, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unit Price</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.price}
                        onChange={(e) => handlePriceChange(index, e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subtotal</Label>
                      <Input value={item.subtotal} readOnly disabled className="font-semibold" />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      disabled={editableItems.length <= 1}
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Read-only Financials & Notes Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground flex items-center">
              Financial Information
              <span className="ml-2 text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Read-only</span>
            </h4>
            <div className="grid grid-cols-2 gap-6 bg-muted/20 p-5 rounded-xl border border-dashed">
              <div className="space-y-2">
                <Label htmlFor="paymentStatus" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Status</Label>
                <Input
                  id="paymentStatus"
                  value={formatStatusDisplay((formData as any).paymentStatus || 'pending')}
                  readOnly
                  disabled
                  className={cn(
                    "cursor-not-allowed capitalize font-bold shadow-none border-transparent bg-background",
                    (formData as any).paymentStatus === 'paid' ? "text-emerald-600" :
                      (formData as any).paymentStatus === 'failed' ? "text-destructive" : "text-amber-500"
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalAmount" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Amount (₹)</Label>
                <Input
                  id="totalAmount"
                  value={recalculatedTotal.toFixed(2)}
                  readOnly
                  disabled
                  className="cursor-not-allowed font-bold text-foreground text-lg shadow-none border-transparent bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="advancePaid" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Advance Paid (₹)</Label>
                <Input
                  id="advancePaid"
                  value={(formData as any).advancePaid || 0}
                  readOnly
                  disabled
                  className="cursor-not-allowed font-medium text-emerald-600 shadow-none border-transparent bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</Label>
                <Textarea
                  id="notes"
                  value={(formData as any).notes || ''}
                  readOnly
                  disabled
                  className="cursor-not-allowed resize-none text-sm shadow-none border-transparent bg-background"
                  placeholder={!(formData as any).notes ? "No notes available" : ""}
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-card/50">
          <Button variant="outline" onClick={onClose} className="hover:bg-destructive hover:text-destructive-foreground transition-colors border-destructive/20 text-destructive">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="min-w-[140px] shadow-lg shadow-primary/20"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
