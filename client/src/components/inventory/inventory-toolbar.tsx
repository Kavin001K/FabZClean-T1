import React from 'react';
import { Search, ListFilter, Download, FileText, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { InventoryItem } from '@/lib/data-service';

export type FilterType = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

interface InventoryToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilters: FilterType[];
  onFilterChange: (filters: FilterType[]) => void;
  onExportCSV: (data: InventoryItem[]) => void;
  onExportPDF: (data: InventoryItem[]) => void;
  onExportExcel?: (data: InventoryItem[]) => void;
  onAddItem: () => void;
  onBulkDelete: () => void;
  selectedItems: string[];
  inventory: InventoryItem[];
  filteredCount: number;
}

const filterOptions = [
  { value: 'all' as const, label: 'All Items' },
  { value: 'in_stock' as const, label: 'In Stock' },
  { value: 'low_stock' as const, label: 'Low Stock' },
  { value: 'out_of_stock' as const, label: 'Out of Stock' },
];

export const InventoryToolbar: React.FC<InventoryToolbarProps> = React.memo(({
  searchQuery,
  onSearchChange,
  activeFilters,
  onFilterChange,
  onExportCSV,
  onExportPDF,
  onExportExcel,
  onAddItem,
  onBulkDelete,
  selectedItems,
  inventory,
  filteredCount,
}) => {
  const handleFilterToggle = (filter: FilterType) => {
    if (filter === 'all') {
      onFilterChange(['all']);
    } else {
      const newFilters = activeFilters.includes(filter)
        ? activeFilters.filter(f => f !== filter && f !== 'all')
        : [...activeFilters.filter(f => f !== 'all'), filter];
      
      // If no filters selected, default to 'all'
      onFilterChange(newFilters.length === 0 ? ['all'] : newFilters);
    }
  };

  const getActiveFilterCount = () => {
    return activeFilters.filter(f => f !== 'all').length;
  };

  const clearAllFilters = () => {
    onFilterChange(['all']);
  };

  const hasSelectedItems = selectedItems.length > 0;

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search inventory..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-6 w-6 p-0"
            onClick={() => onSearchChange('')}
          >
            ×
          </Button>
        )}
      </div>

      {/* Filter and Export Controls */}
      <div className="flex items-center gap-2">
        {/* Active Filters Display */}
        {getActiveFilterCount() > 0 && (
          <div className="flex items-center gap-1">
            {activeFilters
              .filter(f => f !== 'all')
              .map((filter) => (
                <Badge 
                  key={filter} 
                  variant="secondary" 
                  className="text-xs cursor-pointer hover:bg-secondary/80"
                  onClick={() => handleFilterToggle(filter)}
                >
                  {filterOptions.find(opt => opt.value === filter)?.label}
                  <span className="ml-1">×</span>
                </Badge>
              ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <ListFilter className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Filter
                {getActiveFilterCount() > 0 && ` (${getActiveFilterCount()})`}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filter Inventory</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {filterOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={activeFilters.includes(option.value)}
                onCheckedChange={() => handleFilterToggle(option.value)}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 gap-1">
              <Download className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Export
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Export Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onExportCSV(inventory)}
              className="cursor-pointer"
            >
              <Download className="h-4 w-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onExportPDF(inventory)}
              className="cursor-pointer"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
            {onExportExcel && (
              <DropdownMenuItem
                onClick={() => onExportExcel(inventory)}
                className="cursor-pointer"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Bulk Actions */}
        {hasSelectedItems && (
          <Button
            size="sm"
            variant="destructive"
            onClick={onBulkDelete}
            className="h-8 gap-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Delete ({selectedItems.length})
            </span>
          </Button>
        )}

        {/* Add Item Button */}
        <Button size="sm" onClick={onAddItem} className="h-8 gap-1">
          <Plus className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Add Item
          </span>
        </Button>
      </div>

      {/* Results Count */}
      <div className="text-xs text-muted-foreground">
        Showing <strong>{filteredCount}</strong> of <strong>{inventory.length}</strong> items
        {hasSelectedItems && (
          <span className="ml-2 text-primary">
            • {selectedItems.length} selected
          </span>
        )}
      </div>
    </div>
  );
});
