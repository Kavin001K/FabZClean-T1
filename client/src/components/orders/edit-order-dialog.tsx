import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, History, AlertTriangle, ShieldCheck, User } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import type { Order } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

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
  const [activeTab, setActiveTab] = useState("details");

  // Fetch Audit Logs
  const { data: auditLogs, isLoading: isAuditLoading } = useQuery({
    queryKey: ['audit-logs', order?.id],
    queryFn: async () => {
      if (!order?.id) return { data: [] };
      const response = await fetch(`/api/audit-logs?entityType=order&entityId=${order.id}&limit=50&sortBy=createdAt&sortOrder=desc`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      return response.json();
    },
    enabled: !!order?.id && isOpen && activeTab === 'history',
  });

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

      // Calculate unit price for the item
      const quantity = parseInt(String(updates.quantity || 1));
      const totalAmount = parseFloat(String(updates.totalAmount || 0));
      const unitPrice = quantity > 0 ? totalAmount / quantity : 0;

      // Construct items array if service is present
      if (updates.service) {
        updates.items = [{
          serviceName: updates.service,
          quantity: quantity,
          price: unitPrice.toString(),
          subtotal: totalAmount.toString(),
          description: updates.notes || ''
        }];
      }

      // Cleanup
      delete updates.service;
      delete updates.quantity;
      delete updates.priority;

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">Edit Order #{order.orderNumber}</DialogTitle>
              <DialogDescription>
                Manage order details, status, and view history.
              </DialogDescription>
            </div>
            <Badge variant={order.status === 'completed' ? 'default' : 'outline'} className="capitalize">
              {order.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-6 border-b">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Order Details</TabsTrigger>
                <TabsTrigger value="history">Audit History</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="details" className="flex-1 overflow-y-auto p-6 space-y-6 mt-0">
              <div className="grid grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" /> Customer Info
                  </h3>
                  <div className="space-y-3 pl-2 border-l-2 border-muted">
                    <div className="space-y-1">
                      <Label htmlFor="customerName">Name</Label>
                      <Input
                        id="customerName"
                        value={formData.customerName || ''}
                        onChange={(e) => handleInputChange('customerName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="pickupDate">Due Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !(formData as any).pickupDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {(formData as any).pickupDate ? (
                              format(new Date((formData as any).pickupDate), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
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

                {/* Order & Service */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Service Details
                  </h3>
                  <div className="space-y-3 pl-2 border-l-2 border-muted">
                    <div className="space-y-1">
                      <Label htmlFor="service">Service Type</Label>
                      <Input
                        id="service"
                        value={(formData as any).service || ''}
                        onChange={(e) => handleInputChange('service', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={(formData as any).quantity || 1}
                          onChange={(e) => handleInputChange('quantity', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="item-price">Total Amount</Label>
                        <Input
                          id="totalAmount"
                          type="number"
                          value={parseFloat(formData.totalAmount || '0')}
                          onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Inventory Deduction Notice */}
                    <div className="bg-yellow-50 text-yellow-800 text-xs p-2 rounded border border-yellow-200 flex items-start gap-2">
                      <AlertTriangle className="h-3 w-3 mt-0.5" />
                      <span>Updates to quantity will check inventory levels automatically.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Payment - Full Width */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Order Status</Label>
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
                      <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select
                    value={(formData as any).paymentStatus || 'pending'}
                    onValueChange={(value) => handleInputChange('paymentStatus', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="credit">Credit (Pay Later)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={(formData as any).notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Internal notes..."
                  rows={2}
                />
              </div>
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-hidden p-0 mt-0">
              <ScrollArea className="h-full p-6">
                {isAuditLoading ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    Loading history...
                  </div>
                ) : auditLogs?.data?.length > 0 ? (
                  <div className="relative border-l ml-3 space-y-6">
                    {auditLogs.data.map((log: any, index: number) => (
                      <div key={log.id} className="mb-6 ml-6 relative">
                        <div className="absolute -left-[31px] bg-background border rounded-full p-1">
                          <History className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <span className="capitalize">{log.action.replace(/_/g, ' ')}</span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {format(new Date(log.createdAt), "PP p")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            by {log.employeeId || 'System'}
                          </p>
                          {log.details && (
                            <div className="mt-1 text-xs bg-muted p-2 rounded">
                              <pre className="whitespace-pre-wrap font-mono">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    No history found for this order.
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="p-6 pt-2 border-t bg-muted/20">
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
