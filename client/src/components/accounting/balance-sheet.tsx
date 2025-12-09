import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Download, Calendar as CalendarIcon, RefreshCw, Printer, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { exportBalanceSheet } from '@/lib/enhanced-pdf-export';
import { formatUSD } from '@/lib/format';

interface BalanceSheetAccount {
  accountId: string;
  accountCode: string;
  accountName: string;
  balance: string;
  accountSubType: string;
}

interface BalanceSheetSection {
  title: string;
  accounts: BalanceSheetAccount[];
  subtotal: number;
}

interface BalanceSheetData {
  asOfDate: string;
  assets: {
    currentAssets: BalanceSheetSection;
    fixedAssets: BalanceSheetSection;
    otherAssets: BalanceSheetSection;
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: BalanceSheetSection;
    longTermLiabilities: BalanceSheetSection;
    totalLiabilities: number;
  };
  equity: {
    sections: BalanceSheetSection[];
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
}

export function BalanceSheet() {
  const [asOfDate, setAsOfDate] = useState<Date>(new Date());
  const { toast } = useToast();

  // Fetch balance sheet
  const { data, isLoading, refetch } = useQuery<BalanceSheetData>({
    queryKey: ['balance-sheet', asOfDate],
    queryFn: async () => {
      const response = await fetch(
        `/api/accounting/balance-sheet?asOfDate=${asOfDate.toISOString()}`
      );
      if (!response.ok) throw new Error('Failed to fetch balance sheet');
      return response.json();
    },
  });

  const handleExport = () => {
    if (!data) return;

    const csv = [
      ['Balance Sheet'],
      [`As of ${format(new Date(data.asOfDate), 'MMMM dd, yyyy')}`],
      [''],
      ['ASSETS'],
      ['Current Assets'],
      ...(data.assets?.currentAssets?.accounts || []).map((acc) => [
        `  ${acc.accountName}`,
        parseFloat(acc.balance).toFixed(2),
      ]),
      ['Total Current Assets', (data.assets?.currentAssets?.subtotal || 0).toFixed(2)],
      [''],
      ['Fixed Assets'],
      ...(data.assets?.fixedAssets?.accounts || []).map((acc) => [
        `  ${acc.accountName}`,
        parseFloat(acc.balance).toFixed(2),
      ]),
      ['Total Fixed Assets', (data.assets?.fixedAssets?.subtotal || 0).toFixed(2)],
      [''],
      ['TOTAL ASSETS', (data.assets?.totalAssets || 0).toFixed(2)],
      [''],
      ['LIABILITIES AND EQUITY'],
      ['Current Liabilities'],
      ...(data.liabilities?.currentLiabilities?.accounts || []).map((acc) => [
        `  ${acc.accountName}`,
        parseFloat(acc.balance).toFixed(2),
      ]),
      ['Total Current Liabilities', (data.liabilities?.currentLiabilities?.subtotal || 0).toFixed(2)],
      [''],
      ['Long-term Liabilities'],
      ...(data.liabilities?.longTermLiabilities?.accounts || []).map((acc) => [
        `  ${acc.accountName}`,
        parseFloat(acc.balance).toFixed(2),
      ]),
      ['Total Long-term Liabilities', (data.liabilities?.longTermLiabilities?.subtotal || 0).toFixed(2)],
      [''],
      ['TOTAL LIABILITIES', (data.liabilities?.totalLiabilities || 0).toFixed(2)],
      [''],
      ['EQUITY'],
      ...(data.equity?.sections || []).filter(Boolean).flatMap((section) => [
        [section.title || ''],
        ...(section.accounts || []).map((acc) => [`  ${acc.accountName}`, parseFloat(acc.balance).toFixed(2)]),
      ]),
      ['TOTAL EQUITY', (data.equity?.totalEquity || 0).toFixed(2)],
      [''],
      ['TOTAL LIABILITIES AND EQUITY', (data.totalLiabilitiesAndEquity || 0).toFixed(2)],
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balance-sheet-${format(asOfDate, 'yyyy-MM-dd')}.csv`;
    a.click();

    toast({ title: 'Balance sheet exported successfully' });
  };

  const handleExportPDF = () => {
    if (!data) return;

    // Prepare data for PDF export
    const pdfData = {
      asOfDate: format(new Date(data.asOfDate), 'MMMM dd, yyyy'),
      assets: [
        ...(data.assets?.currentAssets?.accounts || []).map((acc) => ({
          account: acc.accountCode,
          description: acc.accountName,
          amount: parseFloat(acc.balance),
        })),
        ...(data.assets?.fixedAssets?.accounts || []).map((acc) => ({
          account: acc.accountCode,
          description: acc.accountName,
          amount: parseFloat(acc.balance),
        })),
        ...(data.assets.otherAssets?.accounts || []).map((acc: any) => ({
          account: acc.accountCode,
          description: acc.accountName,
          amount: parseFloat(acc.balance),
        })),
      ],
      liabilities: [
        ...(data.liabilities?.currentLiabilities?.accounts || []).map((acc) => ({
          account: acc.accountCode,
          description: acc.accountName,
          amount: parseFloat(acc.balance),
        })),
        ...(data.liabilities?.longTermLiabilities?.accounts || []).map((acc) => ({
          account: acc.accountCode,
          description: acc.accountName,
          amount: parseFloat(acc.balance),
        })),
      ],
      equity: (data.equity?.sections || []).filter(Boolean).flatMap((section) =>
        (section.accounts || []).map((acc) => ({
          account: acc.accountCode,
          description: acc.accountName,
          amount: parseFloat(acc.balance),
        }))
      ),
    };

    exportBalanceSheet(pdfData);
    toast({ title: 'PDF exported successfully', description: 'Balance sheet has been downloaded as PDF' });
  };

  const renderSection = (section: BalanceSheetSection | null | undefined, level: number = 0) => {
    if (!section || !section.accounts) return null;

    return (
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
              ${formatUSD(account.balance)}
            </TableCell>
          </TableRow>
        ))}
        {section.subtotal > 0 && section.title && (
          <TableRow className="font-semibold bg-muted/20">
            <TableCell style={{ paddingLeft: `${level * 2 + 1}rem` }}>
              Total {section.title}
            </TableCell>
            <TableCell className="text-right">
              ${formatUSD(section.subtotal)}
            </TableCell>
          </TableRow>
        )}
      </>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Balance Sheet</CardTitle>
            <CardDescription>Statement of financial position</CardDescription>
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
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Balance Sheet Table */}
        {isLoading ? (
          <div className="text-center py-8">Loading balance sheet...</div>
        ) : !data ? (
          <div className="text-center py-8 text-muted-foreground">
            Failed to load balance sheet
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardDescription>Total Assets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${formatUSD(data.assets?.totalAssets || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardDescription>Total Liabilities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    ${formatUSD(data.liabilities?.totalLiabilities || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardDescription>Total Equity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    ${formatUSD(data.equity?.totalEquity || 0)}
                  </div>
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
                  {/* Assets Section */}
                  <TableRow className="bg-primary/10 font-bold">
                    <TableCell colSpan={2}>ASSETS</TableCell>
                  </TableRow>

                  {renderSection(data.assets?.currentAssets)}
                  {renderSection(data.assets?.fixedAssets)}
                  {data.assets?.otherAssets?.accounts && data.assets.otherAssets.accounts.length > 0 &&
                    renderSection(data.assets.otherAssets)}

                  <TableRow className="bg-primary/20 font-bold border-t-2">
                    <TableCell>TOTAL ASSETS</TableCell>
                    <TableCell className="text-right text-green-600">
                      ${formatUSD(data.assets?.totalAssets || 0)}
                    </TableCell>
                  </TableRow>

                  {/* Spacer */}
                  <TableRow>
                    <TableCell colSpan={2} className="h-4"></TableCell>
                  </TableRow>

                  {/* Liabilities Section */}
                  <TableRow className="bg-primary/10 font-bold">
                    <TableCell colSpan={2}>LIABILITIES AND EQUITY</TableCell>
                  </TableRow>

                  {renderSection(data.liabilities?.currentLiabilities)}
                  {renderSection(data.liabilities?.longTermLiabilities)}

                  <TableRow className="bg-muted/50 font-bold border-t">
                    <TableCell>TOTAL LIABILITIES</TableCell>
                    <TableCell className="text-right text-red-600">
                      ${formatUSD(data.liabilities?.totalLiabilities || 0)}
                    </TableCell>
                  </TableRow>

                  {/* Equity Section */}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={2}>EQUITY</TableCell>
                  </TableRow>

                  {(data.equity?.sections || []).filter(Boolean).map((section, index) => (
                    <React.Fragment key={index}>{renderSection(section, 1)}</React.Fragment>
                  ))}

                  <TableRow className="bg-muted/50 font-bold border-t">
                    <TableCell>TOTAL EQUITY</TableCell>
                    <TableCell className="text-right text-blue-600">
                      ${formatUSD(data.equity?.totalEquity || 0)}
                    </TableCell>
                  </TableRow>

                  {/* Total Liabilities and Equity */}
                  <TableRow className="bg-primary/20 font-bold border-t-2">
                    <TableCell>TOTAL LIABILITIES AND EQUITY</TableCell>
                    <TableCell className="text-right">
                      ${formatUSD(data.totalLiabilitiesAndEquity ?? 0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Financial Health Indicator */}
            <div className="mt-6 p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Balance Check</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Assets should equal Liabilities + Equity
                  </p>
                </div>
                <div className="text-right">
                  {Math.abs((data.assets?.totalAssets || 0) - (data.totalLiabilitiesAndEquity || 0)) < 0.01 ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <TrendingUp className="h-5 w-5" />
                      <span className="font-bold">Balanced</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <TrendingDown className="h-5 w-5" />
                      <span className="font-bold">
                        Out of Balance: $
                        {Math.abs(
                          (data.assets?.totalAssets || 0) - (data.totalLiabilitiesAndEquity || 0)
                        ).toFixed(2)}
                      </span>
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
