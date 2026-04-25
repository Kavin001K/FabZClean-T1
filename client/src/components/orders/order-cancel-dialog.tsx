import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { XCircle, AlertTriangle, Loader2 } from "lucide-react";
import type { Order } from "@shared/schema";

// Predefined cancellation reasons
export const CANCELLATION_REASONS = [
  "Order Error",
  "Customer Request",
  "Service Unavailable",
  "Out of Stock",
  "Payment Failed",
  "Duplicate Order",
  "Incorrect Details",
  "Delivery Not Serviceable",
  "Operational Issue",
  "Technical Issue",
  "Other",
] as const;

export type CancellationReason = typeof CANCELLATION_REASONS[number];

interface OrderCancelDialogProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orderId: string, reason: string) => void;
  isLoading?: boolean;
}

export default function OrderCancelDialog({
  order,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: OrderCancelDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState("");

  const isOtherSelected = selectedReason === "Other";
  const finalReason = isOtherSelected ? customReason.trim() : selectedReason;
  const canSubmit = finalReason.length > 0 && !isLoading;

  const handleClose = useCallback(() => {
    setSelectedReason("");
    setCustomReason("");
    onClose();
  }, [onClose]);

  const handleConfirm = useCallback(() => {
    if (!order || !canSubmit) return;
    onConfirm(order.id, finalReason);
    setSelectedReason("");
    setCustomReason("");
  }, [order, canSubmit, finalReason, onConfirm]);

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-inner">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Cancel Order
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500">
                Order <span className="font-bold text-primary">#{order.orderNumber || order.id.substring(0, 8).toUpperCase()}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Warning Banner */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-100 dark:border-rose-900/30">
            <XCircle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-rose-800 dark:text-rose-300">
                This action cannot be undone
              </p>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                The customer will be notified via WhatsApp about the cancellation.
              </p>
            </div>
          </div>

          {/* Reason Dropdown */}
          <div className="space-y-2.5">
            <Label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest text-[11px]">
              Cancellation Reason <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={selectedReason}
              onValueChange={(value) => {
                setSelectedReason(value);
                if (value !== "Other") setCustomReason("");
              }}
            >
              <SelectTrigger className="h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-semibold text-sm focus:border-primary focus:ring-primary/20">
                <SelectValue placeholder="Select a reason for cancellation..." />
              </SelectTrigger>
              <SelectContent>
                {CANCELLATION_REASONS.map((reason) => (
                  <SelectItem
                    key={reason}
                    value={reason}
                    className="font-medium text-sm py-2.5"
                  >
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Reason Input (visible only when "Other" is selected) */}
          {isOtherSelected && (
            <div className="space-y-2.5 animate-in slide-in-from-top-2 duration-200">
              <Label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest text-[11px]">
                Specify Reason <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                placeholder="Please describe the reason for cancellation..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="min-h-[100px] rounded-xl border-2 border-slate-200 dark:border-slate-700 font-medium text-sm resize-none focus:border-primary focus:ring-primary/20"
                autoFocus
              />
            </div>
          )}

          {/* Order Summary */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Customer</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {order.customerName || "Guest"}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-slate-500 font-medium">Amount</span>
              <span className="font-black text-primary">
                Rs. {parseFloat(order.totalAmount || "0").toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="h-11 rounded-xl font-bold text-sm border-2"
          >
            Go Back
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="h-11 rounded-xl font-black text-sm uppercase tracking-wider bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/25 min-w-[160px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Order
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
