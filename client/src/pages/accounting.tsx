import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Scale,
  BarChart3,
  DollarSign,
  CreditCard,
  Receipt,
  TrendingUp,
  Wallet,
  PieChart,
} from 'lucide-react';

import { PageTransition } from '@/components/ui/page-transition';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import accounting components
import { ChartOfAccounts } from '@/components/accounting/chart-of-accounts';
import { JournalEntries } from '@/components/accounting/journal-entries';
import { GeneralLedger } from '@/components/accounting/general-ledger';
import { TrialBalance } from '@/components/accounting/trial-balance';
import { BalanceSheet } from '@/components/accounting/balance-sheet';
import { IncomeStatement } from '@/components/accounting/income-statement';
import { AccountsReceivable } from '@/components/accounting/accounts-receivable';
import { AccountsPayable } from '@/components/accounting/accounts-payable';
import { BudgetTracker } from '@/components/accounting/budget-tracker';
import { ExpenseTracker } from '@/components/accounting/expense-tracker';

interface DashboardMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  totalAssets: number;
  totalLiabilities: number;
  accountsReceivable: number;
  accountsPayable: number;
  cashBalance: number;
  revenueGrowth: number;
  expenseGrowth: number;
}

export default function Accounting() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Fetch dashboard metrics
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['accounting-dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/accounting/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard metrics');
      return response.json();
    },
  });

  return (
    <PageTransition>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounting</h1>
          <p className="text-muted-foreground">
            Comprehensive accounting and financial management system
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10 gap-2">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden lg:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="chart-of-accounts" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden lg:inline">Chart of Accounts</span>
            </TabsTrigger>
            <TabsTrigger value="journal-entries" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden lg:inline">Journal Entries</span>
            </TabsTrigger>
            <TabsTrigger value="general-ledger" className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              <span className="hidden lg:inline">General Ledger</span>
            </TabsTrigger>
            <TabsTrigger value="trial-balance" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden lg:inline">Trial Balance</span>
            </TabsTrigger>
            <TabsTrigger value="financial-statements" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <span className="hidden lg:inline">Financial Statements</span>
            </TabsTrigger>
            <TabsTrigger value="accounts-receivable" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden lg:inline">A/R</span>
            </TabsTrigger>
            <TabsTrigger value="accounts-payable" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden lg:inline">A/P</span>
            </TabsTrigger>
            <TabsTrigger value="budgets" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden lg:inline">Budgets</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden lg:inline">Expenses</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">Loading dashboard...</div>
            ) : (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardDescription>Total Revenue</CardDescription>
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          ${metrics?.totalRevenue?.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          }) || '0.00'}
                        </div>
                        {metrics?.revenueGrowth !== undefined && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {metrics.revenueGrowth > 0 ? '+' : ''}
                            {metrics.revenueGrowth.toFixed(1)}% from last period
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardDescription>Total Expenses</CardDescription>
                          <Receipt className="h-4 w-4 text-red-600" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                          ${metrics?.totalExpenses?.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          }) || '0.00'}
                        </div>
                        {metrics?.expenseGrowth !== undefined && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {metrics.expenseGrowth > 0 ? '+' : ''}
                            {metrics.expenseGrowth.toFixed(1)}% from last period
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardDescription>Net Income</CardDescription>
                          <BarChart3 className="h-4 w-4 text-blue-600" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div
                          className={`text-2xl font-bold ${
                            (metrics?.netIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          ${metrics?.netIncome?.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          }) || '0.00'}
                        </div>
                        {metrics?.netIncome !== undefined && metrics?.totalRevenue !== undefined && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Profit Margin:{' '}
                            {(() => {
                              const margin = ((metrics.netIncome || 0) / (metrics.totalRevenue || 1)) * 100;
                              return isNaN(margin) ? '0.0' : margin.toFixed(1);
                            })()}%
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardDescription>Cash Balance</CardDescription>
                          <Wallet className="h-4 w-4 text-purple-600" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                          ${metrics?.cashBalance?.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          }) || '0.00'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Available cash</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Financial Position */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Assets & Liabilities</CardTitle>
                      <CardDescription>Current financial position</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-950">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Assets</p>
                            <p className="text-2xl font-bold text-green-600">
                              ${metrics?.totalAssets?.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                              }) || '0.00'}
                            </p>
                          </div>
                          <DollarSign className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 dark:bg-red-950">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Liabilities</p>
                            <p className="text-2xl font-bold text-red-600">
                              ${metrics?.totalLiabilities?.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                              }) || '0.00'}
                            </p>
                          </div>
                          <CreditCard className="h-8 w-8 text-red-600" />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
                          <div>
                            <p className="text-sm text-muted-foreground">Net Worth (Equity)</p>
                            <p className="text-2xl font-bold text-blue-600">
                              ${((metrics?.totalAssets || 0) - (metrics?.totalLiabilities || 0)).toLocaleString(
                                'en-US',
                                { minimumFractionDigits: 2 }
                              )}
                            </p>
                          </div>
                          <Scale className="h-8 w-8 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Receivables & Payables</CardTitle>
                      <CardDescription>Outstanding amounts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950">
                          <div>
                            <p className="text-sm text-muted-foreground">Accounts Receivable</p>
                            <p className="text-2xl font-bold text-emerald-600">
                              ${metrics?.accountsReceivable?.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                              }) || '0.00'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Amount owed to us</p>
                          </div>
                          <DollarSign className="h-8 w-8 text-emerald-600" />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-orange-50 dark:bg-orange-950">
                          <div>
                            <p className="text-sm text-muted-foreground">Accounts Payable</p>
                            <p className="text-2xl font-bold text-orange-600">
                              ${metrics?.accountsPayable?.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                              }) || '0.00'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Amount we owe</p>
                          </div>
                          <CreditCard className="h-8 w-8 text-orange-600" />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-violet-50 dark:bg-violet-950">
                          <div>
                            <p className="text-sm text-muted-foreground">Working Capital</p>
                            <p className="text-2xl font-bold text-violet-600">
                              ${((metrics?.accountsReceivable || 0) - (metrics?.accountsPayable || 0)).toLocaleString(
                                'en-US',
                                { minimumFractionDigits: 2 }
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Net difference</p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-violet-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common accounting tasks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <button
                        onClick={() => setActiveTab('journal-entries')}
                        className="p-4 rounded-lg border hover:bg-muted transition-colors text-left"
                      >
                        <FileText className="h-6 w-6 mb-2 text-blue-600" />
                        <p className="font-medium">New Journal Entry</p>
                        <p className="text-xs text-muted-foreground">Record transaction</p>
                      </button>
                      <button
                        onClick={() => setActiveTab('expenses')}
                        className="p-4 rounded-lg border hover:bg-muted transition-colors text-left"
                      >
                        <Receipt className="h-6 w-6 mb-2 text-red-600" />
                        <p className="font-medium">Record Expense</p>
                        <p className="text-xs text-muted-foreground">Track spending</p>
                      </button>
                      <button
                        onClick={() => setActiveTab('financial-statements')}
                        className="p-4 rounded-lg border hover:bg-muted transition-colors text-left"
                      >
                        <BarChart3 className="h-6 w-6 mb-2 text-green-600" />
                        <p className="font-medium">View Reports</p>
                        <p className="text-xs text-muted-foreground">Financial statements</p>
                      </button>
                      <button
                        onClick={() => setActiveTab('budgets')}
                        className="p-4 rounded-lg border hover:bg-muted transition-colors text-left"
                      >
                        <Wallet className="h-6 w-6 mb-2 text-purple-600" />
                        <p className="font-medium">Manage Budgets</p>
                        <p className="text-xs text-muted-foreground">Budget tracking</p>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Chart of Accounts Tab */}
          <TabsContent value="chart-of-accounts">
            <ChartOfAccounts />
          </TabsContent>

          {/* Journal Entries Tab */}
          <TabsContent value="journal-entries">
            <JournalEntries />
          </TabsContent>

          {/* General Ledger Tab */}
          <TabsContent value="general-ledger">
            <GeneralLedger />
          </TabsContent>

          {/* Trial Balance Tab */}
          <TabsContent value="trial-balance">
            <TrialBalance />
          </TabsContent>

          {/* Financial Statements Tab */}
          <TabsContent value="financial-statements" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <BalanceSheet />
              </div>
              <div>
                <IncomeStatement />
              </div>
            </div>
          </TabsContent>

          {/* Accounts Receivable Tab */}
          <TabsContent value="accounts-receivable">
            <AccountsReceivable />
          </TabsContent>

          {/* Accounts Payable Tab */}
          <TabsContent value="accounts-payable">
            <AccountsPayable />
          </TabsContent>

          {/* Budgets Tab */}
          <TabsContent value="budgets">
            <BudgetTracker />
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses">
            <ExpenseTracker />
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
