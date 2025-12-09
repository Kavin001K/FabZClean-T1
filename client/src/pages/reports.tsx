import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Users, DollarSign, Package, Award, Download, FileText } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
    generateFranchisePerformanceReport,
    generateEmployeeDirectoryReport,
    generateDailySummaryReport,
    generateMonthlyReport
} from '@/lib/pdf-templates';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ReportsPage() {
    // Fetch franchise performance
    const { data: franchisePerformance, isLoading: loadingFranchise } = useQuery({
        queryKey: ['franchise-performance'],
        queryFn: async () => {
            const res = await fetch('/api/reports/franchise-performance');
            const json = await res.json();
            return json.data || [];
        }
    });

    // Fetch employee performance
    const { data: employeePerformance, isLoading: loadingEmployees } = useQuery({
        queryKey: ['employee-performance'],
        queryFn: async () => {
            const res = await fetch('/api/reports/employee-performance');
            const json = await res.json();
            return json.data || [];
        }
    });

    // Fetch daily summary
    const { data: dailySummary, isLoading: loadingDaily } = useQuery({
        queryKey: ['daily-summary'],
        queryFn: async () => {
            const res = await fetch('/api/reports/daily-summary?days=30');
            const json = await res.json();
            return json.data || [];
        }
    });

    // Calculate totals
    const totals = franchisePerformance?.reduce((acc: any, franchise: any) => ({
        orders: acc.orders + (franchise.total_orders || 0),
        revenue: acc.revenue + (franchise.total_revenue || 0),
        customers: acc.customers + (franchise.total_customers || 0),
        employees: acc.employees + (franchise.total_employees || 0),
    }), { orders: 0, revenue: 0, customers: 0, employees: 0 }) || { orders: 0, revenue: 0, customers: 0, employees: 0 };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // PDF Export Handlers
    const handleExportFranchisePerformance = () => {
        if (franchisePerformance && franchisePerformance.length > 0) {
            generateFranchisePerformanceReport(franchisePerformance);
        }
    };

    const handleExportEmployeeDirectory = () => {
        if (employeePerformance && employeePerformance.length > 0) {
            generateEmployeeDirectoryReport(employeePerformance);
        }
    };

    const handleExportDailySummary = () => {
        if (dailySummary && dailySummary.length > 0) {
            generateDailySummaryReport(dailySummary);
        }
    };

    const handleExportMonthlyReport = () => {
        if (franchisePerformance && employeePerformance && dailySummary) {
            generateMonthlyReport(franchisePerformance, employeePerformance, dailySummary);
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Franchise Analytics</h1>
                    <p className="text-muted-foreground">
                        Comprehensive performance metrics across all franchises
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleExportMonthlyReport} variant="outline">
                        <FileText className="w-4 h-4 mr-2" />
                        Monthly Report
                    </Button>
                    <Badge variant="outline" className="text-lg px-4 py-2">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Live Data
                    </Badge>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totals.revenue)}</div>
                        <p className="text-xs text-muted-foreground">
                            Across {franchisePerformance?.length || 0} franchises
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totals.orders.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            All-time orders
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totals.customers.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Active customers
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totals.employees}</div>
                        <p className="text-xs text-muted-foreground">
                            Team members
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="franchises" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="franchises">Franchise Performance</TabsTrigger>
                    <TabsTrigger value="employees">Employee Performance</TabsTrigger>
                    <TabsTrigger value="trends">Trends</TabsTrigger>
                </TabsList>

                {/* Franchise Performance Tab */}
                <TabsContent value="franchises" className="space-y-4">
                    {/* Revenue Chart */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Revenue by Franchise</CardTitle>
                                <CardDescription>Total revenue comparison across franchises</CardDescription>
                            </div>
                            <Button onClick={handleExportFranchisePerformance} variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Export PDF
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {loadingFranchise ? (
                                <div className="h-[300px] flex items-center justify-center">
                                    <p className="text-muted-foreground">Loading chart...</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={franchisePerformance}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="franchise_code" />
                                        <YAxis />
                                        <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                        <Legend />
                                        <Bar dataKey="total_revenue" fill="#8884d8" name="Total Revenue" />
                                        <Bar dataKey="revenue_last_30_days" fill="#82ca9d" name="Last 30 Days" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Orders Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Orders by Franchise</CardTitle>
                            <CardDescription>Order volume comparison</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingFranchise ? (
                                <div className="h-[300px] flex items-center justify-center">
                                    <p className="text-muted-foreground">Loading chart...</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={franchisePerformance}
                                            dataKey="total_orders"
                                            nameKey="franchise_name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            label={(entry) => `${entry.franchise_code}: ${entry.total_orders}`}
                                        >
                                            {franchisePerformance?.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Franchise Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Franchise Details</CardTitle>
                            <CardDescription>Detailed performance metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Franchise</TableHead>
                                        <TableHead className="text-right">Orders</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                        <TableHead className="text-right">Customers</TableHead>
                                        <TableHead className="text-right">Employees</TableHead>
                                        <TableHead className="text-right">Avg Order</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingFranchise ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : franchisePerformance?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                                                No data available
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        franchisePerformance?.map((franchise: any) => (
                                            <TableRow key={franchise.franchise_code}>
                                                <TableCell>
                                                    <Badge variant="outline">{franchise.franchise_code}</Badge>
                                                </TableCell>
                                                <TableCell className="font-medium">{franchise.franchise_name}</TableCell>
                                                <TableCell className="text-right">{franchise.total_orders?.toLocaleString() || 0}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(franchise.total_revenue || 0)}</TableCell>
                                                <TableCell className="text-right">{franchise.total_customers?.toLocaleString() || 0}</TableCell>
                                                <TableCell className="text-right">{franchise.total_employees || 0}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(franchise.avg_order_value || 0)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Employee Performance Tab */}
                <TabsContent value="employees" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Employee Directory</CardTitle>
                                <CardDescription>All employees with franchise codes</CardDescription>
                            </div>
                            <Button onClick={handleExportEmployeeDirectory} variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Export PDF
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee Code</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Position</TableHead>
                                        <TableHead>Franchise</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingEmployees ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : employeePerformance?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                No employees found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        employeePerformance?.map((employee: any) => (
                                            <TableRow key={employee.employee_code}>
                                                <TableCell>
                                                    <Badge variant="secondary">{employee.employee_code}</Badge>
                                                </TableCell>
                                                <TableCell className="font-medium">{employee.employee_name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {employee.role?.replace('_', ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{employee.position}</TableCell>
                                                <TableCell>
                                                    <Badge>{employee.franchise_code}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Trends Tab */}
                <TabsContent value="trends" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Daily Revenue Trend</CardTitle>
                                <CardDescription>Last 30 days revenue by franchise</CardDescription>
                            </div>
                            <Button onClick={handleExportDailySummary} variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Export PDF
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {loadingDaily ? (
                                <div className="h-[400px] flex items-center justify-center">
                                    <p className="text-muted-foreground">Loading chart...</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={400}>
                                    <LineChart data={dailySummary?.slice(0, 30).reverse()}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        />
                                        <YAxis />
                                        <Tooltip
                                            formatter={(value: any) => formatCurrency(value)}
                                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="total_revenue"
                                            stroke="#8884d8"
                                            strokeWidth={2}
                                            name="Revenue"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Orders Trend</CardTitle>
                            <CardDescription>Order volume over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingDaily ? (
                                <div className="h-[400px] flex items-center justify-center">
                                    <p className="text-muted-foreground">Loading chart...</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={dailySummary?.slice(0, 30).reverse()}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        />
                                        <YAxis />
                                        <Tooltip labelFormatter={(label) => new Date(label).toLocaleDateString()} />
                                        <Legend />
                                        <Bar dataKey="total_orders" fill="#82ca9d" name="Orders" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
