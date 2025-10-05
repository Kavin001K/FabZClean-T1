import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  DollarSign,
  TrendingUp,
  CreditCard,
  PiggyBank,
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { formatUSD, formatINR } from '@/lib/format';

interface Account {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  accountSubType: string | null;
  parentAccountId?: string | null;
  balance: string;
  isActive: boolean;
  description?: string | null;
  currency?: string;
  taxId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  children?: Account[];
}

const accountTypeIcons: Record<string, any> = {
  asset: DollarSign,
  liability: CreditCard,
  equity: PiggyBank,
  revenue: TrendingUp,
  expense: TrendingUp,
};

const accountTypeColors: Record<string, string> = {
  asset: 'text-green-600',
  liability: 'text-red-600',
  equity: 'text-blue-600',
  revenue: 'text-emerald-600',
  expense: 'text-orange-600',
};

export function ChartOfAccounts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch accounts
  const { data: accounts = [], isLoading } = useQuery<Account[]>({
    queryKey: ['chart-of-accounts'],
    queryFn: async () => {
      const response = await fetch('/api/accounting/accounts');
      if (!response.ok) throw new Error('Failed to fetch accounts');
      return response.json();
    },
  });

  // Create account mutation
  const createAccountMutation = useMutation({
    mutationFn: async (newAccount: Partial<Account>) => {
      const response = await fetch('/api/accounting/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount),
      });
      if (!response.ok) throw new Error('Failed to create account');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      toast({ title: 'Account created successfully' });
      setIsCreateDialogOpen(false);
    },
    onError: () => {
      toast({ title: 'Failed to create account', variant: 'destructive' });
    },
  });

  // Update account mutation
  const updateAccountMutation = useMutation({
    mutationFn: async (account: Account) => {
      const response = await fetch(`/api/accounting/accounts/${account.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      });
      if (!response.ok) throw new Error('Failed to update account');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      toast({ title: 'Account updated successfully' });
      setEditingAccount(null);
    },
    onError: () => {
      toast({ title: 'Failed to update account', variant: 'destructive' });
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const response = await fetch(`/api/accounting/accounts/${accountId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete account');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      toast({ title: 'Account deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete account', variant: 'destructive' });
    },
  });

  // Build tree structure
  const accountTree = useMemo(() => {
    const tree: Account[] = [];
    const accountMap = new Map<string, Account>();

    accounts.forEach((account) => {
      accountMap.set(account.id, { ...account, children: [] });
    });

    accountMap.forEach((account) => {
      if (account.parentAccountId && accountMap.has(account.parentAccountId)) {
        accountMap.get(account.parentAccountId)!.children!.push(account);
      } else {
        tree.push(account);
      }
    });

    return tree;
  }, [accounts]);

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    const filterTree = (accounts: Account[]): Account[] => {
      return accounts
        .filter((account) => {
          const matchesSearch =
            searchQuery === '' ||
            account.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            account.accountCode.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesType = typeFilter === 'all' || account.accountType === typeFilter;
          return matchesSearch && matchesType;
        })
        .map((account) => ({
          ...account,
          children: account.children ? filterTree(account.children) : [],
        }));
    };

    return filterTree(accountTree);
  }, [accountTree, searchQuery, typeFilter]);

  const toggleExpand = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  const renderAccountRow = (account: Account, level: number = 0) => {
    const Icon = accountTypeIcons[account.accountType];
    const hasChildren = account.children && account.children.length > 0;
    const isExpanded = expandedAccounts.has(account.id);
    const balance = parseFloat(account.balance || '0');

    return (
      <React.Fragment key={account.id}>
        <motion.tr
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="hover:bg-lime-50/50 transition-colors border-b"
        >
          <TableCell style={{ paddingLeft: `${level * 2 + 1}rem` }}>
            <div className="flex items-center gap-2">
              {hasChildren && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleExpand(account.id)}
                  className="p-1 hover:bg-lime-100 rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </motion.button>
              )}
              {!hasChildren && <div className="w-6" />}
              <div className={`p-1.5 rounded-lg bg-opacity-10 ${accountTypeColors[account.accountType]}`}>
                <Icon className={`h-4 w-4 ${accountTypeColors[account.accountType]}`} />
              </div>
              <span className="font-medium">{account.accountName}</span>
            </div>
          </TableCell>
          <TableCell>
            <code className="text-sm bg-muted px-2 py-1 rounded">{account.accountCode}</code>
          </TableCell>
          <TableCell>
            <Badge variant="outline" className={`${accountTypeColors[account.accountType]} border-current`}>
              {account.accountType}
            </Badge>
          </TableCell>
          <TableCell className="text-muted-foreground">{account.accountSubType || '-'}</TableCell>
          <TableCell className="text-right font-semibold">
            <span className={balance !== 0 ? accountTypeColors[account.accountType] : ''}>
              ₹{formatINR(balance)}
            </span>
          </TableCell>
          <TableCell>
            <Badge variant={account.isActive ? 'default' : 'secondary'} className={account.isActive ? 'bg-lime-600' : ''}>
              {account.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingAccount(account)}
                className="hover:bg-lime-100"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this account?')) {
                    deleteAccountMutation.mutate(account.id);
                  }
                }}
                className="hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </TableCell>
        </motion.tr>
        {hasChildren && isExpanded && (
          <>
            {account.children!.map((child) => renderAccountRow(child, level + 1))}
          </>
        )}
      </React.Fragment>
    );
  };

  // Calculate summary stats
  const accountStats = useMemo(() => {
    const stats = {
      totalAccounts: accounts.length,
      activeAccounts: accounts.filter(a => a.isActive).length,
      totalAssets: accounts.filter(a => a.accountType === 'asset').reduce((sum, a) => sum + parseFloat(a.balance || '0'), 0),
      totalLiabilities: accounts.filter(a => a.accountType === 'liability').reduce((sum, a) => sum + parseFloat(a.balance || '0'), 0),
      totalEquity: accounts.filter(a => a.accountType === 'equity').reduce((sum, a) => sum + parseFloat(a.balance || '0'), 0),
    };
    return stats;
  }, [accounts]);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-l-4 border-l-lime-500">
            <CardHeader className="pb-3">
              <CardDescription>Total Accounts</CardDescription>
              <CardTitle className="text-3xl">{accountStats.totalAccounts}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{accountStats.activeAccounts} active</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardDescription>Total Assets</CardDescription>
              <CardTitle className="text-3xl text-green-600">₹{formatINR(accountStats.totalAssets)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Asset accounts</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardDescription>Total Liabilities</CardDescription>
              <CardTitle className="text-3xl text-red-600">₹{formatINR(accountStats.totalLiabilities)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Liability accounts</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardDescription>Total Equity</CardDescription>
              <CardTitle className="text-3xl text-blue-600">₹{formatINR(accountStats.totalEquity)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Equity accounts</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Chart of Accounts */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Chart of Accounts</CardTitle>
                <CardDescription>Manage your accounting accounts and view balances</CardDescription>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-lime-600 hover:bg-lime-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by account name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Account Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="asset">Assets</SelectItem>
                  <SelectItem value="liability">Liabilities</SelectItem>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="expense">Expenses</SelectItem>
                </SelectContent>
              </Select>
            </div>

        {/* Accounts Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-lime-600 border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading accounts...</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold">Account Name</TableHead>
                  <TableHead className="font-semibold">Code</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Sub Type</TableHead>
                  <TableHead className="text-right font-semibold">Balance</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <DollarSign className="h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">No accounts found</p>
                        <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Create your first account
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  (filteredAccounts || []).map((account) => renderAccountRow(account))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
        </Card>
      </motion.div>

      {/* Create/Edit Dialog */}
      <AccountDialog
        open={isCreateDialogOpen || !!editingAccount}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingAccount(null);
          }
        }}
        account={editingAccount}
        onSubmit={(data) => {
          if (editingAccount) {
            updateAccountMutation.mutate({ ...editingAccount, ...data });
          } else {
            createAccountMutation.mutate(data);
          }
        }}
        accounts={accounts}
      />
    </div>
  );
}

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
  onSubmit: (data: Partial<Account>) => void;
  accounts: Account[];
}

function AccountDialog({ open, onOpenChange, account, onSubmit, accounts }: AccountDialogProps) {
  const [formData, setFormData] = useState<Partial<Account>>(
    account || {
      accountCode: '',
      accountName: '',
      accountType: 'asset',
      accountSubType: '',
      balance: '0.00',
      isActive: true,
    }
  );

  React.useEffect(() => {
    if (account) {
      setFormData(account);
    } else {
      setFormData({
        accountCode: '',
        accountName: '',
        accountType: 'asset',
        accountSubType: '',
        balance: '0.00',
        isActive: true,
      });
    }
  }, [account]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{account ? 'Edit Account' : 'Create Account'}</DialogTitle>
          <DialogDescription>
            {account ? 'Update account details' : 'Add a new account to your chart'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="accountCode">Account Code</Label>
              <Input
                id="accountCode"
                value={formData.accountCode || ''}
                onChange={(e) => setFormData({ ...formData, accountCode: e.target.value })}
                placeholder="e.g., 1000"
                required
              />
            </div>
            <div>
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                value={formData.accountName || ''}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                placeholder="e.g., Cash"
                required
              />
            </div>
            <div>
              <Label htmlFor="accountType">Account Type</Label>
              <Select
                value={formData.accountType}
                onValueChange={(value: any) => setFormData({ ...formData, accountType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="liability">Liability</SelectItem>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="accountSubType">Sub Type</Label>
              <Input
                id="accountSubType"
                value={formData.accountSubType || ''}
                onChange={(e) => setFormData({ ...formData, accountSubType: e.target.value })}
                placeholder="e.g., current_asset"
              />
            </div>
            <div>
              <Label htmlFor="parentAccountId">Parent Account (Optional)</Label>
              <Select
                value={formData.parentAccountId || 'none'}
                onValueChange={(value) =>
                  setFormData({ ...formData, parentAccountId: value === 'none' ? null : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {accounts
                    .filter((a) => a.id !== account?.id)
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.accountCode} - {a.accountName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{account ? 'Update' : 'Create'} Account</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
