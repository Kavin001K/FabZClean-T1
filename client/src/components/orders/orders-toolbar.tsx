import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ListFilter,
  Download,
  RefreshCw,
  PlusCircle,
  FileText,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface OrdersToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string[];
  onStatusFilterChange: (status: string, checked: boolean) => void;
  onClearFilters: () => void;
  selectedOrders: string[];
  onExportCSV: () => void;
  onExportPDF: () => void;
  onRefresh: () => void;
  onBulkActions: () => void;
  onClearSelection: () => void;
  totalOrders: number;
  filteredOrders: number;
  className?: string;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'text-yellow-600' },
  { value: 'processing', label: 'Processing', color: 'text-blue-600' },
  { value: 'completed', label: 'Completed', color: 'text-green-600' },
  { value: 'cancelled', label: 'Cancelled', color: 'text-red-600' },
];

export default React.memo(function OrdersToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
  selectedOrders,
  onExportCSV,
  onExportPDF,
  onRefresh,
  onBulkActions,
  onClearSelection,
  totalOrders,
  filteredOrders,
  className,
}: OrdersToolbarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const hasActiveFilters = searchQuery || statusFilter.length > 0;
  const selectedCount = selectedOrders.length;

  return (
    <div className={cn("flex items-center justify-between space-x-4 py-4", className)}>
      {/* Left side - Search and Filters */}
      <div className="flex items-center space-x-4 flex-1">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders... (⌘F)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => onSearchChange('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Status Filter Dropdown */}
        <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "gap-2",
                hasActiveFilters && "bg-primary/10 border-primary"
              )}
            >
              <ListFilter className="h-4 w-4" />
              <span>Filter</span>
              {statusFilter.length > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {statusFilter.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {STATUS_OPTIONS.map((status) => (
              <DropdownMenuCheckboxItem
                key={status.value}
                checked={statusFilter.includes(status.value)}
                onCheckedChange={(checked) => onStatusFilterChange(status.value, checked)}
              >
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", {
                    'bg-yellow-500': status.value === 'pending',
                    'bg-blue-500': status.value === 'processing',
                    'bg-green-500': status.value === 'completed',
                    'bg-red-500': status.value === 'cancelled',
                  })} />
                  {status.label}
                </div>
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onClearFilters} className="text-muted-foreground">
              <RefreshCw className="mr-2 h-4 w-4" />
              Clear All Filters
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Selection Button */}
        {selectedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear Selection ({selectedCount})
          </Button>
        )}
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-2">
        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Export Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Bulk Actions Button */}
        {selectedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkActions}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Bulk Actions ({selectedCount})
          </Button>
        )}

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>

        {/* Create Order Button */}
        <Button
          size="sm"
          onClick={() => window.location.href = '/create-order'}
          className="gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Create Order
        </Button>
      </div>
    </div>
  );
});
