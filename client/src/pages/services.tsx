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
import type { Service } from "../../shared/schema"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
    { title: "Total Services", value: "24", change: "+5 this month", changeType: "positive" },
    { title: "Most Popular", value: "Dry Cleaning", change: "1,200 orders", changeType: "positive" },
    { title: "Highest Revenue", value: "Premium Laundry", change: "₹150,000", changeType: "positive" },
    { title: "Newest Service", value: "Leather Care", change: "Added 2 weeks ago", changeType: "positive" },
];

export default function Services() {
  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["services"],
  });
  const [selectedService, setSelectedService] = useState<Service | null>(null);
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
          <div className="flex items-center">
            <div>
                <CardTitle>Services</CardTitle>
                <CardDescription>
                Manage your services and view their details.
                </CardDescription>
            </div>
            <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 gap-1">
                    <File className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Export
                    </span>
                </Button>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button size="sm" className="h-8 gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Add Service
                            </span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Service</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div>
                                <Label htmlFor="serviceName">Service Name</Label>
                                <Input id="serviceName" />
                            </div>
                            <div>
                                <Label htmlFor="servicePrice">Price</Label>
                                <Input id="servicePrice" type="number" />
                            </div>
                            <div>
                                <Label htmlFor="serviceDuration">Duration</Label>
                                <Input id="serviceDuration" />
                            </div>
                            <Button>Save Service</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
        <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search services..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              />
            </div>
            <Button variant="outline" size="sm" className="h-8 gap-1">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Filter
                </span>
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead className="hidden sm:table-cell">Price</TableHead>
                <TableHead className="hidden md:table-cell">Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center">Loading services...</TableCell>
                    </TableRow>
                ) : (
                    services?.map((service) => (
                        <TableRow key={service.id} className="interactive-row">
                            <TableCell className="font-medium">{service.name}</TableCell>
                            <TableCell className="hidden sm:table-cell">{service.category}</TableCell>
                            <TableCell className="hidden sm:table-cell">₹{parseFloat(service.price).toFixed(2)}</TableCell>
                            <TableCell className="hidden md:table-cell">{service.duration}</TableCell>
                            <TableCell>
                                <Badge 
                                  variant={service.status === 'Active' ? 'default' : 'secondary'}
                                  className={service.status === 'Active' ? 'bg-accent text-accent-foreground' : ''}
                                >
                                  {service.status}
                                </Badge>
                            </TableCell>
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
                                        <DropdownMenuItem onClick={() => {
                                            setSelectedService(service);
                                            setIsEditDialogOpen(true);
                                        }}>Edit</DropdownMenuItem>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem className="text-red-500" onSelect={(e) => e.preventDefault()}>Delete</DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                               <AlertDialogHeader>
                                                   <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                   <AlertDialogDescription>
                                                       This action cannot be undone. This will permanently delete the service.
                                                   </AlertDialogDescription>
                                               </AlertDialogHeader>
                                               <AlertDialogFooter>
                                                   <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                   <AlertDialogAction>Delete</AlertDialogAction>
                                               </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
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
              Showing <strong>1-{services?.length || 0}</strong> of <strong>{services?.length || 0}</strong> services
            </div>
          </CardFooter>
      </Card>
      {selectedService && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Service</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div>
                        <Label htmlFor="serviceName">Service Name</Label>
                        <Input id="serviceName" defaultValue={selectedService.name} />
                    </div>
                    <div>
                        <Label htmlFor="servicePrice">Price</Label>
                        <Input id="servicePrice" type="number" defaultValue={selectedService.price} />
                    </div>
                    <div>
                        <Label htmlFor="serviceDuration">Duration</Label>
                        <Input id="serviceDuration" defaultValue={selectedService.duration} />
                    </div>
                    <Button>Save Changes</Button>
                </div>
            </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
