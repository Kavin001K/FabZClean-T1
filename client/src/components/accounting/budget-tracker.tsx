import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus,
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

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
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { formatUSD } from '@/lib/format';

interface BudgetLine {
  id: string;
  category: string;
  accountId: string;
  accountName: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: 'under' | 'over' | 'on-track';
}

interface Budget {
  id: string;
  name: string;
  period: string;
  startDate: string;
  endDate: string;
  totalBudgeted: number;
  totalActual: number;
  totalVariance: number;
  lines: BudgetLine[];
}

interface ChartData {
  category: string;
  budgeted: number;
  actual: number;
}

export function BudgetTracker() {
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<BudgetLine | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch budgets list
  const { data: budgets = [] } = useQuery<Budget[]>({
    queryKey: ['budgets'],
    queryFn: async () => {
      const response = await fetch('/api/accounting/budgets');
      if (!response.ok) throw new Error('Failed to fetch budgets');
      return response.json();
    },
  });

  // Fetch selected budget details
  const { data: budget, isLoading } = useQuery<Budget>({
    queryKey: ['budget', selectedBudgetId],
    queryFn: async () => {
      const response = await fetch(`/api/accounting/budgets/${selectedBudgetId}`);
      if (!response.ok) throw new Error('Failed to fetch budget');
      return response.json();
    },
    enabled: !!selectedBudgetId,
  });

  // Create budget mutation
  const createBudgetMutation = useMutation({
    mutationFn: async (newBudget: Partial<Budget>) => {
      const response = await fetch('/api/accounting/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBudget),
      });
      if (!response.ok) throw new Error('Failed to create budget');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Budget created successfully' });
      setIsCreateDialogOpen(false);
    },
    onError: () => {
      toast({ title: 'Failed to create budget', variant: 'destructive' });
    },
  });

  // Update budget line mutation
  const updateBudgetLineMutation = useMutation({
    mutationFn: async (line: BudgetLine) => {
      const response = await fetch(`/api/accounting/budget-lines/${line.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(line),
      });
      if (!response.ok) throw new Error('Failed to update budget line');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', selectedBudgetId] });
      toast({ title: 'Budget line updated successfully' });
      setEditingLine(null);
    },
    onError: () => {
      toast({ title: 'Failed to update budget line', variant: 'destructive' });
    },
  });

  // Set initial selected budget
  React.useEffect(() => {
    if (budgets.length > 0 && !selectedBudgetId) {
      setSelectedBudgetId(budgets[0].id);
    }
  }, [budgets, selectedBudgetId]);

  // Prepare chart data
  const chartData: ChartData[] = budget?.lines?.map((line) => ({
    category: line.category,
    budgeted: line.budgeted,
    actual: line.actual,
  })) || [];

  const handleExport = () => {
    if (!budget) return;

    const csv = [
      ['Budget vs Actual Report'],
      [`Period: ${budget.period}`],
      [`${format(new Date(budget.startDate), 'MMM dd, yyyy')} - ${format(new Date(budget.endDate), 'MMM dd, yyyy')}`],
      [''],
      ['Category', 'Account', 'Budgeted', 'Actual', 'Variance', 'Variance %', 'Status'].join(','),
      ...budget.lines.map((line) =>
        [
          line.category,
          line.accountName,
          line.budgeted.toFixed(2),
          line.actual.toFixed(2),
          line.variance.toFixed(2),
          line.variancePercent.toFixed(1) + '%',
          line.status,
        ].join(',')
      ),
      [''],
      ['Total', '', budget.totalBudgeted.toFixed(2), budget.totalActual.toFixed(2), budget.totalVariance.toFixed(2)].join(','),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-${budget.name}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'under':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'over':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-green-600';
    if (variance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedBudgetId} onValueChange={setSelectedBudgetId}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select Budget" />
            </SelectTrigger>
            <SelectContent>
              {(budgets || []).map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name} - {b.period}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={!budget}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Budget
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading budget...</div>
      ) : !budget ? (
        <div className="text-center py-8 text-muted-foreground">
          Select a budget or create a new one
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Budgeted</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${formatUSD(budget.totalBudgeted)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Actual</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  ${formatUSD(budget.totalActual)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Variance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getVarianceColor(budget.totalVariance)}`}>
                  ${formatUSD(Math.abs(budget.totalVariance))}
                  {budget.totalVariance > 0 ? (
                    <TrendingDown className="inline h-5 w-5 ml-2" />
                  ) : budget.totalVariance < 0 ? (
                    <TrendingUp className="inline h-5 w-5 ml-2" />
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Budget Utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((budget.totalActual / budget.totalBudgeted) * 100).toFixed(1)}%
                </div>
                <Progress
                  value={(budget.totalActual / budget.totalBudgeted) * 100}
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Budget vs Actual</CardTitle>
                <CardDescription>Comparison by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `$${formatUSD(value)}`} />
                    <Legend />
                    <Bar dataKey="budgeted" fill="#3b82f6" name="Budgeted" />
                    <Bar dataKey="actual" fill="#10b981" name="Actual" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget Performance</CardTitle>
                <CardDescription>Utilization percentage by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {budget.lines.map((line) => {
                    const percentage = (line.actual / line.budgeted) * 100;
                    return (
                      <div key={line.id}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{line.category}</span>
                          <span className="text-sm text-muted-foreground">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={Math.min(percentage, 100)}
                          className={percentage > 100 ? 'bg-red-200' : ''}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Budget Lines Table */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Details</CardTitle>
              <CardDescription>
                {budget.period} ({format(new Date(budget.startDate), 'MMM dd')} -{' '}
                {format(new Date(budget.endDate), 'MMM dd, yyyy')})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Budgeted</TableHead>
                      <TableHead className="text-right">Actual</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead className="text-right">Variance %</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budget.lines.map((line) => (
                      <TableRow key={line.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{line.category}</TableCell>
                        <TableCell>{line.accountName}</TableCell>
                        <TableCell className="text-right">
                          ${formatUSD(line.budgeted)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${formatUSD(line.actual)}
                        </TableCell>
                        <TableCell className={`text-right ${getVarianceColor(line.variance)}`}>
                          ${formatUSD(Math.abs(line.variance))}
                        </TableCell>
                        <TableCell className={`text-right ${getVarianceColor(line.variance)}`}>
                          {line.variancePercent.toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(line.status)}
                            <span className="text-sm capitalize">{line.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingLine(line)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted/50 border-t-2">
                      <TableCell colSpan={2}>TOTAL</TableCell>
                      <TableCell className="text-right">
                        ${formatUSD(budget.totalBudgeted)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${formatUSD(budget.totalActual)}
                      </TableCell>
                      <TableCell className={`text-right ${getVarianceColor(budget.totalVariance)}`}>
                        ${formatUSD(Math.abs(budget.totalVariance))}
                      </TableCell>
                      <TableCell colSpan={3}></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Create Budget Dialog */}
      <CreateBudgetDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={(data) => createBudgetMutation.mutate(data)}
      />

      {/* Edit Budget Line Dialog */}
      {editingLine && (
        <EditBudgetLineDialog
          open={!!editingLine}
          onOpenChange={(open) => !open && setEditingLine(null)}
          line={editingLine}
          onSubmit={(data) => updateBudgetLineMutation.mutate(data)}
        />
      )}
    </div>
  );
}

interface CreateBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Budget>) => void;
}

function CreateBudgetDialog({ open, onOpenChange, onSubmit }: CreateBudgetDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    period: 'Monthly',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      name: '',
      period: 'Monthly',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Budget</DialogTitle>
          <DialogDescription>Set up a new budget period</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Budget Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Q1 2024 Budget"
                required
              />
            </div>
            <div>
              <Label htmlFor="period">Period</Label>
              <Select
                value={formData.period}
                onValueChange={(value) => setFormData({ ...formData, period: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Budget</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditBudgetLineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  line: BudgetLine;
  onSubmit: (data: BudgetLine) => void;
}

function EditBudgetLineDialog({ open, onOpenChange, line, onSubmit }: EditBudgetLineDialogProps) {
  const [budgeted, setBudgeted] = useState(line.budgeted.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...line,
      budgeted: parseFloat(budgeted),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Budget Line</DialogTitle>
          <DialogDescription>{line.category} - {line.accountName}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="budgeted">Budgeted Amount</Label>
              <Input
                id="budgeted"
                type="number"
                step="0.01"
                value={budgeted}
                onChange={(e) => setBudgeted(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Current Actual</p>
                <p className="text-lg font-semibold">
                  ${formatUSD(line.actual)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Variance</p>
                <p className="text-lg font-semibold">
                  ${formatUSD(Math.abs(line.variance))}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Update</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
