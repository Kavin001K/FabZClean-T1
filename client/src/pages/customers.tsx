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
import { useQuery } from "@tanstack/react-query"
import type { Customer } from "@shared/schema"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const kpiData = [
    { title: "Total Customers", value: "1,254", change: "+120 this month", changeType: "positive" },
    { title: "New Customers", value: "89", change: "+15 this week", changeType: "positive" },
    { title: "Repeat Customers", value: "78%", change: "+1.5% this month", changeType: "positive" },
    { title: "Average Spend", value: "₹2,450", change: "+₹150 from last month", changeType: "positive" },
];

export default function Customers() {
    const { data: customers, isLoading } = useQuery<Customer[]>({
        queryKey: ["/api/customers"],
    });
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  return (
    <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
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
                <Dialog>
                    <DialogTrigger asChild>
                        <Button size="sm" className="h-8 gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Add Customer
                            </span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Customer</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div>
                                <Label htmlFor="customerName">Name</Label>
                                <Input id="customerName" />
                            </div>
                            <div>
                                <Label htmlFor="customerEmail">Email</Label>
                                <Input id="customerEmail" type="email" />
                            </div>
                            <div>
                                <Label htmlFor="customerPhone">Phone</Label>
                                <Input id="customerPhone" type="tel" />
                            </div>
                            <Button>Save Customer</Button>
                        </div>
                    </DialogContent>
                </Dialog>
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
              {isLoading ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center">Loading customers...</TableCell>
                </TableRow>
              ) : (
                customers?.map((customer) => (
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
                        <AlertDialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => {
                                        setSelectedCustomer(customer);
                                        setIsViewDialogOpen(true);
                                    }}>View Details</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                        setSelectedCustomer(customer);
                                        setIsEditDialogOpen(true);
                                    }}>Edit</DropdownMenuItem>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-red-500" onSelect={(e) => e.preventDefault()}>Delete</DropdownMenuItem>
                                    </AlertDialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the customer.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>1-{customers?.length || 0}</strong> of <strong>{customers?.length || 0}</strong> customers
          </div>
        </CardFooter>
      </Card>
        {selectedCustomer && (
            <>
                <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selectedCustomer.name}</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-2">
                            <p><strong>Email:</strong> {selectedCustomer.email}</p>
                            <p><strong>Total Orders:</strong> {selectedCustomer.totalOrders}</p>
                            <p><strong>Total Spent:</strong> ₹{selectedCustomer.totalSpent.toFixed(2)}</p>
                            <p><strong>Last Order:</strong> {selectedCustomer.lastOrder}</p>
                        </div>
                    </DialogContent>
                </Dialog>
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Customer</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div>
                                <Label htmlFor="customerName">Name</Label>
                                <Input id="customerName" defaultValue={selectedCustomer.name} />
                            </div>
                            <div>
                                <Label htmlFor="customerEmail">Email</Label>
                                <Input id="customerEmail" type="email" defaultValue={selectedCustomer.email} />
                            </div>
                            <Button>Save Changes</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </>
        )}
    </div>
  )
}
