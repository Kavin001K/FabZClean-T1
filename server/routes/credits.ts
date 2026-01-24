import { Router } from "express";
import { db as storage } from "../db";
import { z } from "zod";

const router = Router();

// Validation schema for the settlement request
const settleCreditSchema = z.object({
  amountPaid: z.coerce.number().positive("Amount must be greater than 0"),
  paymentMethod: z.enum(["cash", "upi", "wallet"]),
  notes: z.string().optional(),
});

router.patch("/:id/settle", async (req, res) => {
  try {
    const orderId = req.params.id;
    const validatedData = settleCreditSchema.parse(req.body);
    const currentUser = (req as any).user;

    // 1. Fetch current order state
    const order = await storage.getOrder(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const totalAmount = Number(order.totalAmount);
    const currentPaid = Number(order.amountPaid || 0);
    const remainingBalance = totalAmount - currentPaid;

    // 2. Prevent overpayment
    if (validatedData.amountPaid > remainingBalance + 0.01) { // 0.01 tolerance for float issues
      return res.status(400).json({ 
        message: `Payment exceeds balance. Remaining: ₹${remainingBalance.toFixed(2)}` 
      });
    }

    // 3. Handle Wallet Deduction (if applicable)
    if (validatedData.paymentMethod === "wallet") {
      if (!order.customerId) {
        return res.status(400).json({ message: "No customer linked to this order for wallet payment" });
      }

      const customer = await storage.getCustomer(order.customerId);
      if (!customer || Number(customer.walletBalance || 0) < validatedData.amountPaid) {
        return res.status(400).json({ message: "Insufficient wallet balance" });
      }

      // Deduct from customer wallet
      const newWalletBalance = Number(customer.walletBalance) - validatedData.amountPaid;
      await storage.updateCustomer(order.customerId, { 
        walletBalance: newWalletBalance.toFixed(2) 
      });
      
      // Also log the credit transaction for the customer
      await storage.processCreditTransaction({
        customerId: order.customerId,
        amount: validatedData.amountPaid,
        type: 'payment',
        reason: `Wallet payment for Order ${order.orderNumber}`,
        paymentMethod: 'wallet',
        orderId: order.id,
        franchiseId: order.franchiseId,
        employeeId: currentUser?.id,
        employeeName: currentUser?.name
      });
    }

    // 4. Update Order State
    const newAmountPaid = currentPaid + validatedData.amountPaid;
    const isFullyPaid = newAmountPaid >= totalAmount - 0.01;

    await storage.updateOrder(orderId, {
      amountPaid: newAmountPaid.toFixed(2),
      paymentStatus: isFullyPaid ? "paid" : "partial",
      lastPaymentMethod: validatedData.paymentMethod,
      updatedAt: new Date(),
    });

    // 5. Create Audit Log Entry for Reconciliation
    if (currentUser) {
      await storage.createAuditLog({
        employeeId: currentUser.id,
        franchiseId: order.franchiseId,
        action: "CREDIT_SETTLEMENT",
        entityType: "order",
        entityId: orderId,
        details: { 
          amountPaid: validatedData.amountPaid,
          newTotalPaid: newAmountPaid,
          previousPaid: currentPaid,
          status: isFullyPaid ? "paid" : "partial",
          method: validatedData.paymentMethod,
          notes: validatedData.notes
        },
        ipAddress: req.ip,
      });
    }

    res.json({ 
      success: true, 
      remainingBalance: Math.max(0, totalAmount - newAmountPaid).toFixed(2),
      status: isFullyPaid ? "paid" : "partial"
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error("Settlement Error:", error);
    res.status(500).json({ message: "Internal server error during settlement" });
  }
});

export default router;
