import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { formatUSD } from '@/lib/format';

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface LedgerEntry {
  id: string;
  date: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  type: string;
}

interface Account {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
}

export function GeneralLedger() {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), 0, 1)
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { toast } = useToast();

  // Fetch accounts for filter
  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['accounts-list'],
    queryFn: async () => {
      const response = await fetch('/api/accounting/accounts');
      if (!response.ok) throw new Error('Failed to fetch accounts');
      return response.json();
    },
  });

  // Fetch ledger entries
  const { data: entries = [], isLoading } = useQuery<LedgerEntry[]>({
    queryKey: ['general-ledger', selectedAccountId, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(selectedAccountId !== 'all' && { accountId: selectedAccountId }),
        ...(dateFrom && { from: dateFrom.toISOString() }),
        ...(dateTo && { to: dateTo.toISOString() }),
      });
      const response = await fetch(`/api/accounting/general-ledger?${params}`);
      if (!response.ok) throw new Error('Failed to fetch ledger entries');
      return response.json();
    },
  });

  // Filter and sort entries
  const filteredEntries = entries
    .filter((entry) => {
      const matchesSearch =
        searchQuery === '' ||
        entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.accountName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  // Calculate totals
  const totals = filteredEntries.reduce(
    (acc, entry) => ({
      debit: acc.debit + entry.debit,
      credit: acc.credit + entry.credit,
    }),
    { debit: 0, credit: 0 }
  );

  const handleExport = () => {
    const csv = [
      ['Date', 'Account', 'Reference', 'Description', 'Debit', 'Credit', 'Balance'].join(','),
      ...filteredEntries.map((entry) =>
        [
          format(new Date(entry.date), 'yyyy-MM-dd'),
          `${entry.accountCode} - ${entry.accountName}`,
          entry.reference,
          entry.description,
          entry.debit.toFixed(2),
          entry.credit.toFixed(2),
          entry.balance.toFixed(2),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `general-ledger-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>General Ledger</CardTitle>
            <CardDescription>View all accounting transactions</CardDescription>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.accountCode} - {account.accountName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">From:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[180px] justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, 'MMM dd, yyyy') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} disabled={(date) => date > new Date()} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">To:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[180px] justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, 'MMM dd, yyyy') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} disabled={(date) => date > new Date()} />
                </PopoverContent>
              </Popover>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'desc' ? (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Newest First
                </>
              ) : (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Oldest First
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Ledger Table */}
        {isLoading ? (
          <div className="text-center py-8">Loading ledger entries...</div>
        ) : (
          <>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No ledger entries found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEntries.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-muted/50">
                        <TableCell>{entry.date ? format(new Date(entry.date), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{entry.accountName}</p>
                            <p className="text-sm text-muted-foreground">{entry.accountCode}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm">{entry.reference}</code>
                        </TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="text-right">
                          {entry.debit && entry.debit > 0 ? (
                            <span className="font-medium text-green-600">
                              ${formatUSD(entry.debit)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.credit && entry.credit > 0 ? (
                            <span className="font-medium text-red-600">
                              ${formatUSD(entry.credit)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${formatUSD(entry.balance)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            {filteredEntries.length > 0 && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Period Totals:</span>
                  <div className="flex gap-8">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Debit</p>
                      <p className="text-lg font-bold text-green-600">
                        ${formatUSD(totals.debit)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Credit</p>
                      <p className="text-lg font-bold text-red-600">
                        ${formatUSD(totals.credit)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Difference</p>
                      <p className="text-lg font-bold">
                        ${formatUSD(Math.abs(totals.debit - totals.credit))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
