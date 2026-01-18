import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search,
  Download,
  Plus,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
} from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatUSD } from '@/lib/format';

interface AccountsReceivable {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  amountPaid: number;
  amountDue: number;
  status: 'Open' | 'Overdue' | 'Paid' | 'Partial';
  daysPastDue: number;
  agingCategory: '0-30' | '31-60' | '61-90' | '90+';
}

interface AgingReport {
  current: number;
  days30: number;
  days60: number;
  days90: number;
  days90Plus: number;
  total: number;
}

export function AccountsReceivable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<AccountsReceivable | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch AR data
  const { data: arData, isLoading } = useQuery({
    queryKey: ['accounts-receivable'],
    queryFn: async () => {
      const response = await fetch('/api/accounting/accounts-receivable');
      if (!response.ok) throw new Error('Failed to fetch accounts receivable');
      return response.json();
    },
  });

  const receivables = arData?.invoices || [];

  // Fetch aging report
  const { data: agingReport } = useQuery<AgingReport>({
    queryKey: ['ar-aging-report'],
    queryFn: async () => {
      const response = await fetch('/api/accounting/ar-aging-report');
      if (!response.ok) throw new Error('Failed to fetch aging report');
      return response.json();
    },
  });

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async (payment: { invoiceId: string; amount: number; date: string }) => {
      const response = await fetch('/api/accounting/record-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment),
      });
      if (!response.ok) throw new Error('Failed to record payment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      queryClient.invalidateQueries({ queryKey: ['ar-aging-report'] });
      toast({ title: 'Payment recorded successfully' });
      setIsPaymentDialogOpen(false);
      setSelectedInvoice(null);
    },
    onError: () => {
      toast({ title: 'Failed to record payment', variant: 'destructive' });
    },
  });

  // Send reminder mutation
  const sendReminderMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await fetch(`/api/accounting/send-reminder/${invoiceId}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to send reminder');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Reminder sent successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to send reminder', variant: 'destructive' });
    },
  });

  const filteredReceivables = (receivables || []).filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    const csv = [
      ['Invoice #', 'Customer', 'Invoice Date', 'Due Date', 'Amount', 'Paid', 'Due', 'Status', 'Days Past Due'].join(','),
      ...filteredReceivables.map((item) =>
        [
          item.invoiceNumber,
          item.customerName,
          format(new Date(item.invoiceDate), 'yyyy-MM-dd'),
          format(new Date(item.dueDate), 'yyyy-MM-dd'),
          item.amount.toFixed(2),
          item.amountPaid.toFixed(2),
          item.amountDue.toFixed(2),
          item.status,
          item.daysPastDue,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accounts-receivable-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <Badge variant="default" className="bg-green-600">Paid</Badge>;
      case 'Overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'Partial':
        return <Badge variant="secondary">Partial</Badge>;
      default:
        return <Badge variant="outline">Open</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Outstanding</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${agingReport?.total ? formatUSD(agingReport.total) : '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Current (0-30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${agingReport?.current ? formatUSD(agingReport.current) : '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Past Due (31-60)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${agingReport?.days30 ? formatUSD(agingReport.days30) : '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Overdue (90+)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${agingReport?.days90Plus ? formatUSD(agingReport.days90Plus) : '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Accounts Receivable</CardTitle>
              <CardDescription>Manage outstanding invoices and payments</CardDescription>
            </div>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-8">Loading accounts receivable...</div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceivables.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No invoices found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReceivables.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell>
                          <code className="text-sm font-medium">{item.invoiceNumber}</code>
                        </TableCell>
                        <TableCell>{item.customerName}</TableCell>
                        <TableCell>{format(new Date(item.invoiceDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {format(new Date(item.dueDate), 'MMM dd, yyyy')}
                            {item.daysPastDue > 0 && (
                              <Badge variant="outline" className="text-xs">
                                +{item.daysPastDue}d
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          ${formatUSD(item.amount)}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          ${formatUSD(item.amountPaid)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${formatUSD(item.amountDue)}
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.status !== 'Paid' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedInvoice(item);
                                    setIsPaymentDialogOpen(true);
                                  }}
                                >
                                  <DollarSign className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => sendReminderMutation.mutate(item.id)}
                                >
                                  <Send className="h-4 w-4 text-blue-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aging Report */}
      {agingReport && (
        <Card>
          <CardHeader>
            <CardTitle>Aging Report</CardTitle>
            <CardDescription>Breakdown of receivables by age</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                <p className="text-sm text-muted-foreground">Current</p>
                <p className="text-2xl font-bold text-green-600">
                  ${formatUSD(agingReport.current)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">0-30 days</p>
              </div>
              <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                <p className="text-sm text-muted-foreground">31-60 Days</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${formatUSD(agingReport.days30)}
                </p>
              </div>
              <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
                <p className="text-sm text-muted-foreground">61-90 Days</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ${formatUSD(agingReport.days60)}
                </p>
              </div>
              <div className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-950">
                <p className="text-sm text-muted-foreground">91-120 Days</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${formatUSD(agingReport.days90)}
                </p>
              </div>
              <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950">
                <p className="text-sm text-muted-foreground">120+ Days</p>
                <p className="text-2xl font-bold text-red-600">
                  ${formatUSD(agingReport.days90Plus)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Dialog */}
      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        invoice={selectedInvoice}
        onSubmit={(payment) => recordPaymentMutation.mutate(payment)}
      />
    </div>
  );
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: AccountsReceivable | null;
  onSubmit: (payment: { invoiceId: string; amount: number; date: string }) => void;
}

function PaymentDialog({ open, onOpenChange, invoice, onSubmit }: PaymentDialogProps) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  React.useEffect(() => {
    if (invoice) {
      setAmount(invoice.amountDue.toString());
    }
  }, [invoice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    onSubmit({
      invoiceId: invoice.id,
      amount: parseFloat(amount),
      date,
    });

    setAmount('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>Invoice {invoice.invoiceNumber}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{invoice.customerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Invoice Amount</p>
                <p className="font-medium">
                  ${formatUSD(invoice.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount Due</p>
                <p className="font-medium text-red-600">
                  ${formatUSD(invoice.amountDue)}
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="amount">Payment Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="date">Payment Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Record Payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
