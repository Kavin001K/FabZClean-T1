import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Download,
  Calendar as CalendarIcon,
  RefreshCw,
  Printer,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

import { Button } from '@/components/ui/button';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { exportIncomeStatement } from '@/lib/enhanced-pdf-export';
import { formatUSD } from '@/lib/format';

interface IncomeStatementAccount {
  accountId: string;
  accountCode: string;
  accountName: string;
  amount: number;
}

interface IncomeStatementSection {
  title: string;
  accounts: IncomeStatementAccount[];
  subtotal: number;
}

interface IncomeStatementData {
  startDate: string;
  endDate: string;
  revenue: {
    sections: IncomeStatementSection[];
    totalRevenue: number;
  };
  costOfGoodsSold: {
    sections: IncomeStatementSection[];
    totalCOGS: number;
  };
  grossProfit: number;
  grossProfitMargin: number;
  operatingExpenses: {
    sections: IncomeStatementSection[];
    totalOperatingExpenses: number;
  };
  operatingIncome: number;
  operatingMargin: number;
  otherIncomeExpenses: {
    sections: IncomeStatementSection[];
    totalOther: number;
  };
  netIncome: number;
  netProfitMargin: number;
}

export function IncomeStatement() {
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const { toast } = useToast();

  // Handle date range preset changes
  const handleDateRangeChange = (range: string) => {
    const now = new Date();
    setDateRange(range as any);

    switch (range) {
      case 'month':
        setStartDate(startOfMonth(now));
        setEndDate(endOfMonth(now));
        break;
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(quarterStart);
        quarterEnd.setMonth(quarterEnd.getMonth() + 3);
        quarterEnd.setDate(0);
        setStartDate(quarterStart);
        setEndDate(quarterEnd);
        break;
      case 'year':
        setStartDate(startOfYear(now));
        setEndDate(endOfYear(now));
        break;
    }
  };

  // Fetch income statement
  const { data, isLoading, refetch } = useQuery<IncomeStatementData>({
    queryKey: ['income-statement', startDate, endDate],
    queryFn: async () => {
      const response = await fetch(
        `/api/accounting/income-statement?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      if (!response.ok) throw new Error('Failed to fetch income statement');
      return response.json();
    },
  });

  const handleExport = () => {
    if (!data) return;

    const csv = [
      ['Income Statement'],
      [
        `Period: ${format(new Date(data.startDate), 'MMM dd, yyyy')} - ${format(
          new Date(data.endDate),
          'MMM dd, yyyy'
        )}`,
      ],
      [''],
      ['REVENUE'],
      ...data.revenue.sections.flatMap((section) => [
        [section.title],
        ...section.accounts.map((acc) => [`  ${acc.accountName}`, acc.amount.toFixed(2)]),
      ]),
      ['Total Revenue', data.revenue.totalRevenue.toFixed(2)],
      [''],
      ['COST OF GOODS SOLD'],
      ...data.costOfGoodsSold.sections.flatMap((section) => [
        [section.title],
        ...section.accounts.map((acc) => [`  ${acc.accountName}`, acc.amount.toFixed(2)]),
      ]),
      ['Total Cost of Goods Sold', data.costOfGoodsSold.totalCOGS.toFixed(2)],
      [''],
      ['GROSS PROFIT', data.grossProfit.toFixed(2)],
      ['Gross Profit Margin', `${data.grossProfitMargin.toFixed(2)}%`],
      [''],
      ['OPERATING EXPENSES'],
      ...data.operatingExpenses.sections.flatMap((section) => [
        [section.title],
        ...section.accounts.map((acc) => [`  ${acc.accountName}`, acc.amount.toFixed(2)]),
      ]),
      ['Total Operating Expenses', data.operatingExpenses.totalOperatingExpenses.toFixed(2)],
      [''],
      ['OPERATING INCOME', data.operatingIncome.toFixed(2)],
      ['Operating Margin', `${data.operatingMargin.toFixed(2)}%`],
      [''],
      ['NET INCOME', data.netIncome.toFixed(2)],
      ['Net Profit Margin', `${data.netProfitMargin.toFixed(2)}%`],
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `income-statement-${format(startDate, 'yyyy-MM-dd')}-to-${format(
      endDate,
      'yyyy-MM-dd'
    )}.csv`;
    a.click();

    toast({ title: 'Income statement exported successfully' });
  };

  const handleExportPDF = () => {
    if (!data) return;

    // Prepare data for PDF export
    const pdfData = {
      period: `${format(new Date(data.startDate), 'MMM dd, yyyy')} - ${format(
        new Date(data.endDate),
        'MMM dd, yyyy'
      )}`,
      revenue: data.revenue.sections.flatMap((section) =>
        section.accounts.map((acc) => ({
          account: acc.accountCode,
          description: acc.accountName,
          amount: acc.amount,
        }))
      ),
      expenses: [
        ...data.costOfGoodsSold.sections.flatMap((section) =>
          section.accounts.map((acc) => ({
            account: acc.accountCode,
            description: `COGS - ${acc.accountName}`,
            amount: acc.amount,
          }))
        ),
        ...data.operatingExpenses.sections.flatMap((section) =>
          section.accounts.map((acc) => ({
            account: acc.accountCode,
            description: acc.accountName,
            amount: acc.amount,
          }))
        ),
        ...(data.otherIncomeExpenses?.sections || []).flatMap((section: any) =>
          section.accounts.map((acc: any) => ({
            account: acc.accountCode,
            description: acc.accountName,
            amount: acc.amount,
          }))
        ),
      ],
    };

    exportIncomeStatement(pdfData);
    toast({ title: 'PDF exported successfully', description: 'Income statement has been downloaded as PDF' });
  };

  const renderSection = (section: IncomeStatementSection, level: number = 0) => (
    <>
      {section.title && (
        <TableRow className={level === 0 ? 'bg-muted/50 font-semibold' : 'bg-muted/30'}>
          <TableCell colSpan={2} style={{ paddingLeft: `${level * 2 + 1}rem` }}>
            {section.title}
          </TableCell>
        </TableRow>
      )}
      {section.accounts.map((account) => (
        <TableRow key={account.accountId} className="hover:bg-muted/20">
          <TableCell style={{ paddingLeft: `${(level + 1) * 2 + 1}rem` }}>
            {account.accountName}
          </TableCell>
          <TableCell className="text-right font-medium">
            ${formatUSD(account.amount)}
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Income Statement</CardTitle>
            <CardDescription>Profit and Loss Statement</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Date Range Selector */}
        <div className="flex gap-4 mb-6">
          <Select value={dateRange} onValueChange={handleDateRangeChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {dateRange === 'custom' && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[180px] justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, 'MMM dd, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                  />
                </PopoverContent>
              </Popover>

              <span className="flex items-center">to</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[180px] justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, 'MMM dd, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                  />
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>

        {/* Income Statement Table */}
        {isLoading ? (
          <div className="text-center py-8">Loading income statement...</div>
        ) : !data ? (
          <div className="text-center py-8 text-muted-foreground">
            Failed to load income statement
          </div>
        ) : (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardDescription>Total Revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-green-600">
                    ${formatUSD(data.revenue.totalRevenue)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardDescription>Gross Profit</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-blue-600">
                    ${formatUSD(data.grossProfit)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Margin: {data.grossProfitMargin.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardDescription>Operating Income</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-purple-600">
                    ${formatUSD(data.operatingIncome)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Margin: {data.operatingMargin.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardDescription>Net Income</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-xl font-bold ${
                      data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    ${formatUSD(data.netIncome)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Margin: {data.netProfitMargin.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Revenue Section */}
                  <TableRow className="bg-primary/10 font-bold">
                    <TableCell colSpan={2}>REVENUE</TableCell>
                  </TableRow>

                  {data.revenue.sections.map((section, index) => (
                    <React.Fragment key={index}>{renderSection(section)}</React.Fragment>
                  ))}

                  <TableRow className="bg-primary/20 font-bold border-t">
                    <TableCell>Total Revenue</TableCell>
                    <TableCell className="text-right text-green-600">
                      ${formatUSD(data.revenue.totalRevenue)}
                    </TableCell>
                  </TableRow>

                  {/* Cost of Goods Sold */}
                  {data.costOfGoodsSold.sections.length > 0 && (
                    <>
                      <TableRow>
                        <TableCell colSpan={2} className="h-4"></TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={2}>COST OF GOODS SOLD</TableCell>
                      </TableRow>

                      {data.costOfGoodsSold.sections.map((section, index) => (
                        <React.Fragment key={index}>{renderSection(section)}</React.Fragment>
                      ))}

                      <TableRow className="bg-muted/50 font-bold border-t">
                        <TableCell>Total Cost of Goods Sold</TableCell>
                        <TableCell className="text-right text-red-600">
                          ${formatUSD(data.costOfGoodsSold.totalCOGS)}
                        </TableCell>
                      </TableRow>

                      <TableRow className="bg-blue-50 dark:bg-blue-950 font-bold border-t-2">
                        <TableCell>GROSS PROFIT</TableCell>
                        <TableCell className="text-right text-blue-600">
                          ${formatUSD(data.grossProfit)}{' '}
                          <span className="text-sm">({data.grossProfitMargin.toFixed(1)}%)</span>
                        </TableCell>
                      </TableRow>
                    </>
                  )}

                  {/* Operating Expenses */}
                  <TableRow>
                    <TableCell colSpan={2} className="h-4"></TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={2}>OPERATING EXPENSES</TableCell>
                  </TableRow>

                  {data.operatingExpenses.sections.map((section, index) => (
                    <React.Fragment key={index}>{renderSection(section)}</React.Fragment>
                  ))}

                  <TableRow className="bg-muted/50 font-bold border-t">
                    <TableCell>Total Operating Expenses</TableCell>
                    <TableCell className="text-right text-red-600">
                      ${formatUSD(data.operatingExpenses.totalOperatingExpenses)}
                    </TableCell>
                  </TableRow>

                  <TableRow className="bg-purple-50 dark:bg-purple-950 font-bold border-t-2">
                    <TableCell>OPERATING INCOME</TableCell>
                    <TableCell className="text-right text-purple-600">
                      ${formatUSD(data.operatingIncome)}{' '}
                      <span className="text-sm">({data.operatingMargin.toFixed(1)}%)</span>
                    </TableCell>
                  </TableRow>

                  {/* Other Income/Expenses */}
                  {data.otherIncomeExpenses.sections.length > 0 && (
                    <>
                      <TableRow>
                        <TableCell colSpan={2} className="h-4"></TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={2}>OTHER INCOME/EXPENSES</TableCell>
                      </TableRow>

                      {data.otherIncomeExpenses.sections.map((section, index) => (
                        <React.Fragment key={index}>{renderSection(section)}</React.Fragment>
                      ))}
                    </>
                  )}

                  {/* Net Income */}
                  <TableRow className="bg-primary/20 font-bold border-t-2">
                    <TableCell>NET INCOME</TableCell>
                    <TableCell
                      className={`text-right ${
                        data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      ${formatUSD(data.netIncome)}{' '}
                      <span className="text-sm">({data.netProfitMargin.toFixed(1)}%)</span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Profitability Indicator */}
            <div className="mt-6 p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Profitability Status</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Period: {format(new Date(data.startDate), 'MMM dd')} -{' '}
                    {format(new Date(data.endDate), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  {data.netIncome >= 0 ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <TrendingUp className="h-5 w-5" />
                      <span className="font-bold">Profitable</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <TrendingDown className="h-5 w-5" />
                      <span className="font-bold">Loss</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
