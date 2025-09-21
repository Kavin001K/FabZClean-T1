import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, TrendingUp, Award, MessageCircle, Gift, Target,
  Calendar, DollarSign, Star, Phone, Mail, Smartphone
} from "lucide-react";

// Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Charts
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  totalRevenue: number;
  averageOrderValue: number;
  loyaltyMembers: number;
  customerLifetimeValue: number;
  retentionRate: number;
}

interface LoyaltyStats {
  tierDistribution: Array<{ tier: string; count: number; percentage: number; color: string }>;
  pointsDistribution: Array<{ range: string; count: number }>;
  redemptionRate: number;
  averagePointsPerCustomer: number;
}

interface CommunicationStats {
  totalSent: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  byChannel: Array<{ channel: string; sent: number; delivered: number; opened: number }>;
}

interface CustomerSegment {
  id: string;
  name: string;
  count: number;
  percentage: number;
  averageOrderValue: number;
  totalRevenue: number;
  color: string;
}

export default function CustomerAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [selectedSegment, setSelectedSegment] = useState("all");

  // Fetch customer metrics
  const { data: metrics } = useQuery<CustomerMetrics>({
    queryKey: ["customer-metrics", selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/customers?period=${selectedPeriod}`);
      return response.json();
    },
  });

  // Fetch loyalty stats
  const { data: loyaltyStats } = useQuery<LoyaltyStats>({
    queryKey: ["loyalty-stats"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/loyalty");
      return response.json();
    },
  });

  // Fetch communication stats
  const { data: communicationStats } = useQuery<CommunicationStats>({
    queryKey: ["communication-stats", selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/communications?period=${selectedPeriod}`);
      return response.json();
    },
  });

  // Fetch customer segments
  const { data: customerSegments } = useQuery<CustomerSegment[]>({
    queryKey: ["customer-segments"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/segments");
      return response.json();
    },
  });

  // Mock data for charts
  const customerGrowthData = [
    { month: "Jan", newCustomers: 45, totalCustomers: 234, revenue: 125000 },
    { month: "Feb", newCustomers: 52, totalCustomers: 286, revenue: 145000 },
    { month: "Mar", newCustomers: 48, totalCustomers: 334, revenue: 165000 },
    { month: "Apr", newCustomers: 61, totalCustomers: 395, revenue: 185000 },
    { month: "May", newCustomers: 55, totalCustomers: 450, revenue: 205000 },
    { month: "Jun", newCustomers: 67, totalCustomers: 517, revenue: 235000 },
  ];

  const revenueBySegmentData = [
    { segment: "VIP", revenue: 450000, customers: 45, avgOrder: 10000 },
    { segment: "Regular", revenue: 320000, customers: 156, avgOrder: 2050 },
    { segment: "New", revenue: 180000, customers: 234, avgOrder: 770 },
    { segment: "At Risk", revenue: 95000, customers: 67, avgOrder: 1420 },
    { segment: "Inactive", revenue: 45000, customers: 89, avgOrder: 505 },
  ];

  const loyaltyTierData = loyaltyStats?.tierDistribution || [
    { tier: "Bronze", count: 234, percentage: 45, color: "#cd7f32" },
    { tier: "Silver", count: 156, percentage: 30, color: "#c0c0c0" },
    { tier: "Gold", count: 89, percentage: 17, color: "#ffd700" },
    { tier: "Platinum", count: 32, percentage: 6, color: "#e5e4e2" },
    { tier: "Diamond", count: 12, percentage: 2, color: "#b9f2ff" },
  ];

  const communicationChannelData = communicationStats?.byChannel || [
    { channel: "Email", sent: 1250, delivered: 1180, opened: 590, clicked: 118 },
    { channel: "SMS", sent: 890, delivered: 876, opened: 654, clicked: 98 },
    { channel: "WhatsApp", sent: 456, delivered: 445, opened: 389, clicked: 67 },
    { channel: "Push", sent: 234, delivered: 198, opened: 123, clicked: 23 },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your customer base and engagement
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalCustomers?.toLocaleString() || "2,547"}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +{metrics?.newCustomers || 45} new this month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(metrics?.totalRevenue || 1250000).toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +12.5% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(metrics?.averageOrderValue || 1850).toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +8.2% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.retentionRate || 78.5}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +2.1% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="loyalty">Loyalty Program</TabsTrigger>
          <TabsTrigger value="segments">Customer Segments</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Customer Growth Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Customer Growth & Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={customerGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "revenue" ? `₹${value.toLocaleString()}` : value,
                        name === "revenue" ? "Revenue" : name === "newCustomers" ? "New Customers" : "Total Customers"
                      ]}
                    />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="newCustomers" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Area yAxisId="left" type="monotone" dataKey="totalCustomers" stackId="2" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                    <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#ffc658" fill="#ffc658" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Customer Segments */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Customer Segment</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueBySegmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="segment" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Revenue"]} />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Customer Lifetime Value */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Lifetime Value Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">₹0 - ₹5,000</span>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">₹5,000 - ₹15,000</span>
                    <span className="text-sm font-medium">30%</span>
                  </div>
                  <Progress value={30} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">₹15,000 - ₹50,000</span>
                    <span className="text-sm font-medium">20%</span>
                  </div>
                  <Progress value={20} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">₹50,000+</span>
                    <span className="text-sm font-medium">5%</span>
                  </div>
                  <Progress value={5} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="loyalty" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Loyalty Tier Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Loyalty Tier Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={loyaltyTierData}
                      dataKey="count"
                      nameKey="tier"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ tier, percentage }) => `${tier} (${percentage}%)`}
                    >
                      {loyaltyTierData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Loyalty Program Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Loyalty Program Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Loyalty Members</span>
                  <Badge variant="secondary">{loyaltyStats?.tierDistribution.reduce((sum, tier) => sum + tier.count, 0) || "523"}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Points Redemption Rate</span>
                  <Badge variant="outline">{loyaltyStats?.redemptionRate || 23.5}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Avg Points per Customer</span>
                  <Badge variant="outline">{loyaltyStats?.averagePointsPerCustomer || 1250}</Badge>
                </div>
                <div className="pt-4">
                  <h4 className="font-medium mb-2">Recent Tier Upgrades</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>John Doe → Gold</span>
                      <span className="text-muted-foreground">2 hours ago</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Sarah Smith → Silver</span>
                      <span className="text-muted-foreground">5 hours ago</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Mike Johnson → Platinum</span>
                      <span className="text-muted-foreground">1 day ago</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Segments Overview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Automatically categorized customer groups based on behavior and value
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {customerSegments?.map((segment) => (
                    <Card key={segment.id} className="border-l-4" style={{ borderLeftColor: segment.color }}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{segment.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Customers</span>
                          <span className="font-medium">{segment.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Percentage</span>
                          <span className="font-medium">{segment.percentage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Avg Order Value</span>
                          <span className="font-medium">₹{segment.averageOrderValue}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Revenue</span>
                          <span className="font-medium">₹{segment.totalRevenue.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )) || (
                    <>
                      {/* Mock segments */}
                      <Card className="border-l-4 border-green-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">VIP Customers</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Customers</span>
                            <span className="font-medium">45</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Percentage</span>
                            <span className="font-medium">8.7%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Avg Order Value</span>
                            <span className="font-medium">₹10,000</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Revenue</span>
                            <span className="font-medium">₹450,000</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-blue-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Regular Customers</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Customers</span>
                            <span className="font-medium">156</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Percentage</span>
                            <span className="font-medium">30.2%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Avg Order Value</span>
                            <span className="font-medium">₹2,050</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Revenue</span>
                            <span className="font-medium">₹320,000</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-orange-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">At Risk</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Customers</span>
                            <span className="font-medium">67</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Percentage</span>
                            <span className="font-medium">13.0%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Avg Order Value</span>
                            <span className="font-medium">₹1,420</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Revenue</span>
                            <span className="font-medium">₹95,000</span>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="communication" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Communication Channel Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Communication Channel Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={communicationChannelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sent" fill="#8884d8" name="Sent" />
                    <Bar dataKey="delivered" fill="#82ca9d" name="Delivered" />
                    <Bar dataKey="opened" fill="#ffc658" name="Opened" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Communication Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Communication Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{communicationStats?.totalSent || "2,847"}</div>
                    <div className="text-sm text-muted-foreground">Total Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{communicationStats?.deliveryRate || 94.2}%</div>
                    <div className="text-sm text-muted-foreground">Delivery Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{communicationStats?.openRate || 67.8}%</div>
                    <div className="text-sm text-muted-foreground">Open Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{communicationStats?.clickRate || 23.4}%</div>
                    <div className="text-sm text-muted-foreground">Click Rate</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Channel Preferences</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm">Email</span>
                      </div>
                      <span className="text-sm font-medium">78%</span>
                    </div>
                    <Progress value={78} className="h-2" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        <span className="text-sm">SMS</span>
                      </div>
                      <span className="text-sm font-medium">65%</span>
                    </div>
                    <Progress value={65} className="h-2" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm">WhatsApp</span>
                      </div>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}