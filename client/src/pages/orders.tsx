import {
  File,
  ListFilter,
  MoreHorizontal,
  PlusCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useQuery } from "@tanstack/react-query"
import type { Order } from "@shared/schema"

const kpiData = [
    { title: "Total Orders", value: "5,231", change: "+12.5%", changeType: "positive" },
    { title: "Pending Orders", value: "128", change: "-2.1%", changeType: "negative" },
    { title: "Completed Orders", value: "4,890", change: "+8.2%", changeType: "positive" },
    { title: "Average Order Value", value: "₹2,450", change: "+5.7%", changeType: "positive" },
];

// NOTE: We'll use static data for now. We will reconnect this to the API later.
const ORDERS_DATA = [
    {
      orderId: "ORD001",
      customer: "Liam Johnson",
      email: "liam@example.com",
      type: "Sale",
      status: "Fulfilled",
      date: "2023-06-23",
      amount: 250.00,
    },
    {
      orderId: "ORD002",
      customer: "Olivia Smith",
      email: "olivia@example.com",
      type: "Refund",
      status: "Declined",
      date: "2023-06-24",
      amount: 150.00,
    },
    {
      orderId: "ORD003",
      customer: "Noah Williams",
      email: "noah@example.com",
      type: "Subscription",
      status: "Fulfilled",
      date: "2023-06-25",
      amount: 350.00,
    },
    {
      orderId: "ORD004",
      customer: "Emma Brown",
      email: "emma@example.com",
      type: "Sale",
      status: "Fulfilled",
      date: "2023-06-26",
      amount: 450.00,
    },
    {
      orderId: "ORD005",
      customer: "Lucas Jones",
      email: "lucas@example.com",
      type: "Subscription",
      status: "Unfulfilled",
      date: "2023-06-27",
      amount: 550.00,
    },
];


export default function Orders() {
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader>
              <CardTitle>{kpi.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className={`text-xs ${kpi.changeType === "positive" ? "text-green-500" : "text-red-500"}`}>{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="all">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="archived" className="hidden sm:flex">
              Archived
            </TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1">
                  <ListFilter className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Filter
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked>
                  Fulfilled
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Declined</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>
                  Refunded
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="outline" className="h-7 gap-1">
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Export
              </span>
            </Button>
            <Button size="sm" className="h-7 gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Order
              </span>
            </Button>
          </div>
        </div>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
              <CardDescription>
                Manage your orders and view their sales details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Date
                    </TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">Loading orders...</TableCell>
                    </TableRow>
                  ) : (
                    orders?.map((order) => (
                      <TableRow key={order.orderId} className="interactive-row">
                        <TableCell className="font-medium">
                          {order.orderId}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="hidden text-sm text-muted-foreground md:inline">
                            {order.customerEmail}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={order.status === 'completed' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'}
                            className={order.status === 'completed' ? 'bg-accent text-accent-foreground' : ''}
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">₹{parseFloat(order.totalAmount).toFixed(2)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                aria-haspopup="true"
                                size="icon"
                                variant="ghost"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <div className="text-xs text-muted-foreground">
                Showing <strong>1-{orders?.length || 0}</strong> of <strong>{orders?.length || 0}</strong> orders
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
