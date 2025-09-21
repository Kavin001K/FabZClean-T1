import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import type { Order } from "../../../shared/schema";

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
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        ...order,
      });
    }
  }, [order]);

  const handleSave = () => {
    if (order && formData) {
      onSave(order.id, formData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Order: {order.id}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Customer Information */}
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={formData.customerName || ''}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                placeholder="Enter customer name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderNumber">Order Number</Label>
              <Input
                id="orderNumber"
                value={formData.orderNumber || ''}
                onChange={(e) => handleInputChange('orderNumber', e.target.value)}
                placeholder="Enter order number"
              />
            </div>

            {/* Service Information */}
            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <Input
                id="service"
                value={(formData as any).service || ''}
                onChange={(e) => handleInputChange('service', e.target.value)}
                placeholder="Enter service type"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={(formData as any).quantity || 1}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                placeholder="Enter quantity"
              />
            </div>

            {/* Status and Priority */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || 'pending'}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={(formData as any).priority || 'Normal'}
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Financial Information */}
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total Amount</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                min="0"
                value={parseFloat(formData.totalAmount || '0')}
                onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                placeholder="Enter total amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={(formData as any).paymentMethod || 'Cash'}
                onValueChange={(value) => handleInputChange('paymentMethod', value)}
              >
                <SelectTrigger>
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

            {/* Dates */}
            <div className="space-y-2">
              <Label htmlFor="pickupDate">Pickup Date</Label>
              <Input
                id="pickupDate"
                type="date"
                value={(formData as any).pickupDate ? new Date((formData as any).pickupDate).toISOString().split('T')[0] : ''}
                onChange={(e) => handleInputChange('pickupDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="advancePaid">Advance Paid</Label>
              <Input
                id="advancePaid"
                type="number"
                step="0.01"
                min="0"
                value={(formData as any).advancePaid || 0}
                onChange={(e) => handleInputChange('advancePaid', e.target.value)}
                placeholder="Enter advance amount"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={(formData as any).notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Enter any additional notes..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
