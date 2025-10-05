import React from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  exportChartOfAccountsToExcel,
  exportJournalEntriesToExcel,
  exportTrialBalanceToExcel,
  exportIncomeStatementToExcel,
  exportBalanceSheetToExcel,
} from '@/lib/excel-exports';
import { useToast } from '@/hooks/use-toast';

interface AccountingExportButtonProps {
  type: 'chart-of-accounts' | 'journal-entries' | 'trial-balance' | 'income-statement' | 'balance-sheet';
  data: any;
  onExportPDF?: () => void;
}

export function AccountingExportButton({ type, data, onExportPDF }: AccountingExportButtonProps) {
  const { toast } = useToast();

  const handleExportExcel = () => {
    try {
      switch (type) {
        case 'chart-of-accounts':
          exportChartOfAccountsToExcel(data);
          break;
        case 'journal-entries':
          exportJournalEntriesToExcel(data);
          break;
        case 'trial-balance':
          exportTrialBalanceToExcel(data);
          break;
        case 'income-statement':
          exportIncomeStatementToExcel(data);
          break;
        case 'balance-sheet':
          exportBalanceSheetToExcel(data);
          break;
      }

      toast({
        title: "Excel Export Successful",
        description: "Your data has been exported to Excel.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting to Excel.",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {onExportPDF && (
          <DropdownMenuItem onClick={onExportPDF}>
            <FileText className="mr-2 h-4 w-4" />
            Export as PDF
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleExportExcel}>
          <FileText className="mr-2 h-4 w-4" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
