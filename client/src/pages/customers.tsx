import {
  File,
  ListFilter,
  MoreHorizontal,
  PlusCircle,
  Search,
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
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// NOTE: We'll use static data for now. We will reconnect this to the API later.
const CUSTOMERS_DATA = [
    {
      id: "CUST001",
      name: "Liam Johnson",
      email: "liam@example.com",
      totalOrders: 5,
      totalSpent: 1250.00,
      lastOrder: "2023-06-23",
    },
    {
      id: "CUST002",
      name: "Olivia Smith",
      email: "olivia@example.com",
      totalOrders: 2,
      totalSpent: 300.00,
      lastOrder: "2023-06-24",
    },
    {
      id: "CUST003",
      name: "Noah Williams",
      email: "noah@example.com",
      totalOrders: 8,
      totalSpent: 2100.00,
      lastOrder: "2023-06-25",
    },
];

export default function Customers() {
  return (
    <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
          <CardDescription>
            Manage your customers and view their order history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search customers..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              />
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 gap-1">
                    <ListFilter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Filter
                    </span>
                </Button>
                <Button size="sm" className="h-8 gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add Customer
                    </span>
                </Button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden sm:table-cell">Total Orders</TableHead>
                <TableHead className="hidden sm:table-cell">Total Spent</TableHead>
                <TableHead className="hidden md:table-cell">Last Order</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CUSTOMERS_DATA.map((customer) => (
                <TableRow key={customer.id} className="interactive-row">
                  <TableCell>
                    <div className="font-medium">{customer.name}</div>
                    <div className="hidden text-sm text-muted-foreground md:inline">
                      {customer.email}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{customer.totalOrders}</TableCell>
                  <TableCell className="hidden sm:table-cell">₹{customer.totalSpent.toFixed(2)}</TableCell>
                  <TableCell className="hidden md:table-cell">{customer.lastOrder}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>1-3</strong> of <strong>3</strong> customers
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
