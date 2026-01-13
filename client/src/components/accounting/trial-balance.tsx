import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Download, Calendar as CalendarIcon, RefreshCw, Printer } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { formatUSD } from '@/lib/format';

interface TrialBalanceAccount {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  debit: number;
  credit: number;
}

interface TrialBalanceData {
  asOfDate: string;
  accounts: TrialBalanceAccount[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

export function TrialBalance() {
  const [asOfDate, setAsOfDate] = useState<Date>(new Date());
  const { toast } = useToast();

  // Fetch trial balance
  const { data, isLoading, refetch } = useQuery<TrialBalanceData>({
    queryKey: ['trial-balance', asOfDate],
    queryFn: async () => {
      const response = await fetch(
        `/api/accounting/trial-balance?asOfDate=${asOfDate.toISOString()}`
      );
      if (!response.ok) throw new Error('Failed to fetch trial balance');
      return response.json();
    },
  });

  const handleExport = () => {
    if (!data) return;

    const csv = [
      ['Trial Balance'],
      [`As of ${format(new Date(data.asOfDate), 'MMMM dd, yyyy')}`],
      [''],
      ['Account Code', 'Account Name', 'Type', 'Debit', 'Credit'].join(','),
      ...data.accounts.map((account) =>
        [
          account.accountCode,
          account.accountName,
          account.accountType,
          account.debit.toFixed(2),
          account.credit.toFixed(2),
        ].join(',')
      ),
      [''],
      ['Total', '', '', data.totalDebit.toFixed(2), data.totalCredit.toFixed(2)].join(','),
      ['Difference', '', '', '', Math.abs(data.totalDebit - data.totalCredit).toFixed(2)].join(','),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trial-balance-${format(asOfDate, 'yyyy-MM-dd')}.csv`;
    a.click();

    toast({ title: 'Trial balance exported successfully' });
  };

  const handlePrint = () => {
    window.print();
  };

  // Group accounts by type
  const accountsByType = data?.accounts?.reduce((acc, account) => {
    if (!acc[account.accountType]) {
      acc[account.accountType] = [];
    }
    acc[account.accountType].push(account);
    return acc;
  }, {} as Record<string, TrialBalanceAccount[]>) || {};

  const accountTypeOrder: Array<'asset' | 'liability' | 'equity' | 'revenue' | 'expense'> = [
    'asset',
    'liability',
    'equity',
    'revenue',
    'expense',
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Trial Balance</CardTitle>
            <CardDescription>Summary of all account balances</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Date Selector */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">As of Date:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(asOfDate, 'MMMM dd, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={asOfDate}
                  onSelect={(date) => date && setAsOfDate(date)}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Trial Balance Table */}
        {isLoading ? (
          <div className="text-center py-8">Loading trial balance...</div>
        ) : !data ? (
          <div className="text-center py-8 text-muted-foreground">
            Failed to load trial balance
          </div>
        ) : (
          <>
            {/* Balance Status */}
            <div className="mb-4 p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Balance Status</p>
                  <Badge
                    variant={data.isBalanced ? 'default' : 'destructive'}
                    className="mt-1"
                  >
                    {data.isBalanced ? 'Balanced' : 'Not Balanced'}
                  </Badge>
                </div>
                {!data.isBalanced && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Difference</p>
                    <p className="text-lg font-bold text-red-600">
                      ${formatUSD(Math.abs((data.totalDebit ?? 0) - (data.totalCredit ?? 0)))}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Code</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountTypeOrder.map((type) => {
                    const accounts = accountsByType?.[type] || [];
                    if (accounts.length === 0) return null;

                    const typeDebit = accounts.reduce((sum, acc) => sum + acc.debit, 0);
                    const typeCredit = accounts.reduce((sum, acc) => sum + acc.credit, 0);

                    return (
                      <React.Fragment key={type}>
                        {/* Type Header */}
                        <TableRow className="bg-muted/50 font-semibold">
                          <TableCell colSpan={5}>{type.charAt(0).toUpperCase() + type.slice(1)} Accounts</TableCell>
                        </TableRow>

                        {/* Account Rows */}
                        {accounts.map((account) => (
                          <TableRow key={account.accountId} className="hover:bg-muted/30">
                            <TableCell>
                              <code className="text-sm">{account.accountCode}</code>
                            </TableCell>
                            <TableCell>{account.accountName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {account.debit > 0 ? (
                                <span className="text-green-600">
                                  ${formatUSD(account.debit)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {account.credit > 0 ? (
                                <span className="text-red-600">
                                  ${formatUSD(account.credit)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}

                        {/* Type Subtotal */}
                        <TableRow className="bg-muted/30 font-semibold text-sm">
                          <TableCell colSpan={3} className="text-right">
                            {type.charAt(0).toUpperCase() + type.slice(1)} Subtotal:
                          </TableCell>
                          <TableCell className="text-right">
                            ${formatUSD(typeDebit)}
                          </TableCell>
                          <TableCell className="text-right">
                            ${formatUSD(typeCredit)}
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })}

                  {/* Grand Total */}
                  <TableRow className="bg-primary/10 font-bold border-t-2">
                    <TableCell colSpan={3} className="text-right">
                      TOTAL:
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                    ${formatUSD(data.totalDebit ?? 0)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                    ${formatUSD(data.totalCredit ?? 0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Debit</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                                          ${formatUSD(data.totalDebit ?? 0)}                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Credit</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                                          ${formatUSD(data.totalCredit ?? 0)}                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Difference</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      data.isBalanced ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    ${formatUSD(Math.abs((data.totalDebit ?? 0) - (data.totalCredit ?? 0)))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {data.isBalanced ? 'Books are balanced' : 'Books need adjustment'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
