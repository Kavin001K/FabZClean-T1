import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Calendar as CalendarIcon,
  Download,
  Trash2,
  Edit,
  FileText,
} from 'lucide-react';

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { formatUSD } from '@/lib/format';

interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  status: 'Draft' | 'Posted' | 'Void';
  createdBy: string;
  lines: JournalLine[];
}

interface JournalLine {
  id: string;
  accountId: string;
  accountName: string;
  accountCode: string;
  debit: number;
  credit: number;
  description: string;
}

interface Account {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
}

export function JournalEntries() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch journal entries
  const { data: entries = [], isLoading } = useQuery<JournalEntry[]>({
    queryKey: ['journal-entries'],
    queryFn: async () => {
      const response = await fetch('/api/accounting/journal-entries');
      if (!response.ok) throw new Error('Failed to fetch journal entries');
      return response.json();
    },
  });

  // Fetch accounts for dropdown
  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['accounts-list'],
    queryFn: async () => {
      const response = await fetch('/api/accounting/accounts');
      if (!response.ok) throw new Error('Failed to fetch accounts');
      return response.json();
    },
  });

  // Create journal entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (entry: Partial<JournalEntry>) => {
      const response = await fetch('/api/accounting/journal-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      if (!response.ok) throw new Error('Failed to create journal entry');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast({ title: 'Journal entry created successfully' });
      setIsCreateDialogOpen(false);
    },
    onError: () => {
      toast({ title: 'Failed to create journal entry', variant: 'destructive' });
    },
  });

  // Post journal entry mutation
  const postEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const response = await fetch(`/api/accounting/journal-entries/${entryId}/post`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to post journal entry');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast({ title: 'Journal entry posted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to post journal entry', variant: 'destructive' });
    },
  });

  // Delete journal entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const response = await fetch(`/api/accounting/journal-entries/${entryId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete journal entry');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast({ title: 'Journal entry deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete journal entry', variant: 'destructive' });
    },
  });

  const filteredEntries = (entries || []).filter((entry) => {
    const matchesSearch =
      searchQuery === '' ||
      entry.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    const csv = [
      ['Date', 'Reference', 'Description', 'Status', 'Debit', 'Credit'].join(','),
      ...filteredEntries.map((entry) => {
        const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
        const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit, 0);
        return [
          entry.date,
          entry.reference,
          entry.description,
          entry.status,
          totalDebit.toFixed(2),
          totalCredit.toFixed(2),
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-entries-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Journal Entries</CardTitle>
            <CardDescription>Create and manage journal entries</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Entry
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
              placeholder="Search entries..."
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
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Posted">Posted</SelectItem>
              <SelectItem value="Void">Void</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Entries Table */}
        {isLoading ? (
          <div className="text-center py-8">Loading journal entries...</div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No journal entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => {
                    const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
                    const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit, 0);

                    return (
                      <TableRow key={entry.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>{format(new Date(entry.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <code className="text-sm">{entry.reference}</code>
                        </TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="text-right font-medium">
                          ${formatUSD(totalDebit)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${formatUSD(totalCredit)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              entry.status === 'Posted'
                                ? 'default'
                                : entry.status === 'Draft'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingEntry(entry)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            {entry.status === 'Draft' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => postEntryMutation.mutate(entry.id)}
                                >
                                  <Edit className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteEntryMutation.mutate(entry.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Create Entry Dialog */}
      <JournalEntryDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={(data) => createEntryMutation.mutate(data)}
        accounts={accounts}
      />

      {/* View Entry Dialog */}
      <ViewEntryDialog
        entry={viewingEntry}
        onClose={() => setViewingEntry(null)}
      />
    </Card>
  );
}

interface JournalEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<JournalEntry>) => void;
  accounts: Account[];
}

function JournalEntryDialog({ open, onOpenChange, onSubmit, accounts }: JournalEntryDialogProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<Partial<JournalLine>[]>([
    { accountId: '', debit: 0, credit: 0, description: '' },
    { accountId: '', debit: 0, credit: 0, description: '' },
  ]);

  const addLine = () => {
    setLines([...lines, { accountId: '', debit: 0, credit: 0, description: '' }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof JournalLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      return;
    }

    const processedLines = lines.map((line) => {
      const account = accounts.find((a) => a.id === line.accountId);
      return {
        ...line,
        accountName: account?.accountName || '',
        accountCode: account?.accountCode || '',
      };
    });

    onSubmit({
      date: date.toISOString(),
      reference,
      description,
      status: 'Draft',
      lines: processedLines as JournalLine[],
    });

    // Reset form
    setDate(new Date());
    setReference('');
    setDescription('');
    setLines([
      { accountId: '', debit: 0, credit: 0, description: '' },
      { accountId: '', debit: 0, credit: 0, description: '' },
    ]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Journal Entry</DialogTitle>
          <DialogDescription>Add a new journal entry with debits and credits</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(date, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="JE-001"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description..."
                required
              />
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Journal Lines</h4>
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Line
                </Button>
              </div>

              <div className="space-y-2">
                {lines.map((line, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <Label className="text-xs">Account</Label>
                      <Select
                        value={line.accountId}
                        onValueChange={(value) => updateLine(index, 'accountId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.accountCode} - {account.accountName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Debit</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.debit || 0}
                        onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Credit</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.credit || 0}
                        onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">Description</Label>
                      <Input
                        value={line.description || ''}
                        onChange={(e) => updateLine(index, 'description', e.target.value)}
                        placeholder="Line description"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLine(index)}
                        disabled={lines.length <= 2}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Totals:</span>
                  <div className="flex gap-8">
                    <span>Debit: ${totalDebit.toFixed(2)}</span>
                    <span>Credit: ${totalCredit.toFixed(2)}</span>
                  </div>
                </div>
                {!isBalanced && (
                  <p className="text-sm text-red-600 mt-2">
                    Entry is not balanced. Debits and credits must be equal.
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isBalanced}>
              Create Entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ViewEntryDialogProps {
  entry: JournalEntry | null;
  onClose: () => void;
}

function ViewEntryDialog({ entry, onClose }: ViewEntryDialogProps) {
  if (!entry) return null;

  const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit, 0);

  return (
    <Dialog open={!!entry} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Journal Entry Details</DialogTitle>
          <DialogDescription>Reference: {entry.reference}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{format(new Date(entry.date), 'PPP')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant={
                  entry.status === 'Posted'
                    ? 'default'
                    : entry.status === 'Draft'
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {entry.status}
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Description</p>
            <p className="font-medium">{entry.description}</p>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entry.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{line.accountName}</p>
                        <p className="text-sm text-muted-foreground">{line.accountCode}</p>
                      </div>
                    </TableCell>
                    <TableCell>{line.description}</TableCell>
                    <TableCell className="text-right">
                      {line.debit > 0 ? `$${line.debit.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {line.credit > 0 ? `$${line.credit.toFixed(2)}` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right">${totalDebit.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${totalCredit.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
