import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
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
import type { Order } from "@shared/schema";

export interface EditOrderDialogProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (orderId: string, updates: Partial<Order>) => void;
  isLoading?: boolean;
}

export default React.memo(function EditOrderDialog({
  order,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}: EditOrderDialogProps) {
  const [formData, setFormData] = useState<Partial<Order>>({});

  useEffect(() => {
    if (order) {
      setFormData({
        ...order,
      });
    }
  }, [order]);

  const handleSave = () => {
    if (order && formData) {
      const updates: any = { ...formData };

      // Make sure we pass priority and paymentMethod even if they were manipulated
      // We removed the code that deletes `priority`, so it will now be saved.

      // Ensure numeric fields are strings/numbers as expected by DB
      if (updates.totalAmount !== undefined && updates.totalAmount !== null) {
        updates.totalAmount = updates.totalAmount.toString();
      }
      if (updates.advancePaid !== undefined && updates.advancePaid !== null) {
        updates.advancePaid = updates.advancePaid.toString();
      }

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

  if (!order) return null;

  const isDelivery = (order as any).fulfillmentType === 'delivery';
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
            <div className="grid grid-cols-2 gap-6 p-5 rounded-xl bg-card border shadow-sm relative overflow-hidden">
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
                <Label htmlFor="paymentMethod" className="font-medium">Payment Method</Label>
                <Select
                  value={(formData as any).paymentMethod || 'Cash'}
                  onValueChange={(value) => handleInputChange('paymentMethod', value)}
                >
                  <SelectTrigger className="border-primary/20 hover:border-primary/50 focus:ring-primary/20 transition-all font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
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
                  value={parseFloat(formData.totalAmount || '0')}
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
