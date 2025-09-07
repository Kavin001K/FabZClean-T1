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
const SERVICES_DATA = [
    {
      id: "SRV001",
      name: "Dry Cleaning - Suit",
      category: "Dry Cleaning",
      price: 150.00,
      duration: "2-3 days",
      status: "Active",
    },
    {
      id: "SRV002",
      name: "Wash & Press - Shirt",
      category: "Wash & Press",
      price: 25.00,
      duration: "1 day",
      status: "Active",
    },
    {
      id: "SRV003",
      name: "Alterations - Hemming",
      category: "Alterations",
      price: 50.00,
      duration: "3-5 days",
      status: "Active",
    },
    {
      id: "SRV004",
      name: "Leather Cleaning",
      category: "Specialty",
      price: 200.00,
      duration: "5-7 days",
      status: "Inactive",
    },
];

export default function Services() {
  return (
    <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
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
                <Button size="sm" className="h-8 gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add Service
                    </span>
                </Button>
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
              {SERVICES_DATA.map((service) => (
                <TableRow key={service.id} className="interactive-row">
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{service.category}</TableCell>
                  <TableCell className="hidden sm:table-cell">₹{service.price.toFixed(2)}</TableCell>
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
            Showing <strong>1-4</strong> of <strong>4</strong> services
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
