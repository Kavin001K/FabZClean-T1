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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatUSD } from '@/lib/format';

interface AccountsPayable {
  id: string;
  billNumber: string;
  vendorId: string;
  vendorName: string;
  billDate: string;
  dueDate: string;
  amount: number;
  amountPaid: number;
  amountDue: number;
  status: 'Open' | 'Overdue' | 'Paid' | 'Partial' | 'Scheduled';
  daysPastDue: number;
  agingCategory: '0-30' | '31-60' | '61-90' | '90+';
  description: string;
}

interface AgingReport {
  current: number;
  days30: number;
  days60: number;
  days90: number;
  days90Plus: number;
  total: number;
}

export function AccountsPayable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isNewBillDialogOpen, setIsNewBillDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<AccountsPayable | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch AP data
  const { data: apData, isLoading } = useQuery({
    queryKey: ['accounts-payable'],
    queryFn: async () => {
      const response = await fetch('/api/accounting/accounts-payable');
      if (!response.ok) throw new Error('Failed to fetch accounts payable');
      return response.json();
    },
  });

  const payables = apData?.invoices || [];

  // Fetch aging report
  const { data: agingReport } = useQuery<AgingReport>({
    queryKey: ['ap-aging-report'],
    queryFn: async () => {
      const response = await fetch('/api/accounting/ap-aging-report');
      if (!response.ok) throw new Error('Failed to fetch aging report');
      return response.json();
    },
  });

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async (payment: { billId: string; amount: number; date: string }) => {
      const response = await fetch('/api/accounting/pay-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment),
      });
      if (!response.ok) throw new Error('Failed to record payment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['ap-aging-report'] });
      toast({ title: 'Payment recorded successfully' });
      setIsPaymentDialogOpen(false);
      setSelectedBill(null);
    },
    onError: () => {
      toast({ title: 'Failed to record payment', variant: 'destructive' });
    },
  });

  // Create bill mutation
  const createBillMutation = useMutation({
    mutationFn: async (bill: Partial<AccountsPayable>) => {
      const response = await fetch('/api/accounting/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bill),
      });
      if (!response.ok) throw new Error('Failed to create bill');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['ap-aging-report'] });
      toast({ title: 'Bill created successfully' });
      setIsNewBillDialogOpen(false);
    },
    onError: () => {
      toast({ title: 'Failed to create bill', variant: 'destructive' });
    },
  });

  const filteredPayables = (payables || []).filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    const csv = [
      ['Bill #', 'Vendor', 'Bill Date', 'Due Date', 'Amount', 'Paid', 'Due', 'Status', 'Days Past Due'].join(','),
      ...filteredPayables.map((item) =>
        [
          item.billNumber,
          item.vendorName,
          format(new Date(item.billDate), 'yyyy-MM-dd'),
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
    a.download = `accounts-payable-${format(new Date(), 'yyyy-MM-dd')}.csv`;
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
      case 'Scheduled':
        return <Badge className="bg-blue-600">Scheduled</Badge>;
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
            <CardDescription>Total Payable</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${agingReport?.total ? formatUSD(agingReport.total) : '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Current (0-30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${agingReport?.current ? formatUSD(agingReport.current) : '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Due Soon (31-60)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
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
              <CardTitle>Accounts Payable</CardTitle>
              <CardDescription>Manage bills and vendor payments</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => setIsNewBillDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Bill
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bills..."
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
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-8">Loading accounts payable...</div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Bill Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayables.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No bills found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayables.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell>
                          <code className="text-sm font-medium">{item.billNumber}</code>
                        </TableCell>
                        <TableCell>{item.vendorName}</TableCell>
                        <TableCell>{format(new Date(item.billDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {format(new Date(item.dueDate), 'MMM dd, yyyy')}
                            {item.daysPastDue > 0 && (
                              <Badge variant="destructive" className="text-xs">
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
                        <TableCell className="text-right font-medium text-red-600">
                          ${formatUSD(item.amountDue)}
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.status !== 'Paid' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedBill(item);
                                  setIsPaymentDialogOpen(true);
                                }}
                              >
                                <DollarSign className="h-4 w-4 text-green-600" />
                              </Button>
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
            <CardDescription>Breakdown of payables by age</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
                <p className="text-sm text-muted-foreground">Current</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ${formatUSD(agingReport.current)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">0-30 days</p>
              </div>
              <div className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-950">
                <p className="text-sm text-muted-foreground">31-60 Days</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${formatUSD(agingReport.days30)}
                </p>
              </div>
              <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950">
                <p className="text-sm text-muted-foreground">61-90 Days</p>
                <p className="text-2xl font-bold text-red-600">
                  ${formatUSD(agingReport.days60)}
                </p>
              </div>
              <div className="p-4 border rounded-lg bg-red-100 dark:bg-red-900">
                <p className="text-sm text-muted-foreground">91-120 Days</p>
                <p className="text-2xl font-bold text-red-700">
                  ${formatUSD(agingReport.days90)}
                </p>
              </div>
              <div className="p-4 border rounded-lg bg-red-200 dark:bg-red-800">
                <p className="text-sm text-muted-foreground">120+ Days</p>
                <p className="text-2xl font-bold text-red-800 dark:text-red-200">
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
        bill={selectedBill}
        onSubmit={(payment) => recordPaymentMutation.mutate(payment)}
      />

      {/* New Bill Dialog */}
      <NewBillDialog
        open={isNewBillDialogOpen}
        onOpenChange={setIsNewBillDialogOpen}
        onSubmit={(bill) => createBillMutation.mutate(bill)}
      />
    </div>
  );
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: AccountsPayable | null;
  onSubmit: (payment: { billId: string; amount: number; date: string }) => void;
}

function PaymentDialog({ open, onOpenChange, bill, onSubmit }: PaymentDialogProps) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  React.useEffect(() => {
    if (bill) {
      setAmount(bill.amountDue.toString());
    }
  }, [bill]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bill) return;

    onSubmit({
      billId: bill.id,
      amount: parseFloat(amount),
      date,
    });

    setAmount('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
  };

  if (!bill) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay Bill</DialogTitle>
          <DialogDescription>Bill {bill.billNumber}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Vendor</p>
              <p className="font-medium">{bill.vendorName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Bill Amount</p>
                <p className="font-medium">
                  ${formatUSD(bill.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount Due</p>
                <p className="font-medium text-red-600">
                  ${formatUSD(bill.amountDue)}
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

interface NewBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (bill: Partial<AccountsPayable>) => void;
}

function NewBillDialog({ open, onOpenChange, onSubmit }: NewBillDialogProps) {
  const [formData, setFormData] = useState({
    billNumber: '',
    vendorName: '',
    billDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
    });

    // Reset form
    setFormData({
      billNumber: '',
      vendorName: '',
      billDate: format(new Date(), 'yyyy-MM-dd'),
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      amount: '',
      description: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Bill</DialogTitle>
          <DialogDescription>Add a new bill to accounts payable</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="billNumber">Bill Number</Label>
              <Input
                id="billNumber"
                value={formData.billNumber}
                onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                placeholder="BILL-001"
                required
              />
            </div>
            <div>
              <Label htmlFor="vendorName">Vendor Name</Label>
              <Input
                id="vendorName"
                value={formData.vendorName}
                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                placeholder="Vendor name"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="billDate">Bill Date</Label>
                <Input
                  id="billDate"
                  type="date"
                  value={formData.billDate}
                  onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Bill description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Bill</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
