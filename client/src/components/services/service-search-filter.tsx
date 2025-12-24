import React from 'react';
import { Search, ListFilter, Download, FileText } from 'lucide-react';
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
import type { Service } from '@shared/schema';

export type FilterType = 'all' | 'active' | 'inactive' | 'high_price' | 'low_price' | 'category';

interface ServiceSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilters: FilterType[];
  onFilterChange: (filters: FilterType[]) => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  services: Service[];
  filteredCount: number;
}

const filterOptions = [
  { value: 'all' as const, label: 'All Services' },
  { value: 'active' as const, label: 'Active Services' },
  { value: 'inactive' as const, label: 'Inactive Services' },
  { value: 'high_price' as const, label: 'High Price (>₹500)' },
  { value: 'low_price' as const, label: 'Low Price (<₹200)' },
];

const categoryOptions = [
  'Dry Cleaning',
  'Laundry',
  'Ironing',
  'Stain Removal',
  'Leather Care',
  'Premium Services'
];

export const ServiceSearchFilter: React.FC<ServiceSearchFilterProps> = React.memo(({
  searchQuery,
  onSearchChange,
  activeFilters,
  onFilterChange,
  onExportCSV,
  onExportPDF,
  services,
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

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search services..."
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
                  {filterOptions.find(opt => opt.value === filter)?.label || filter}
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
            <DropdownMenuLabel>Filter Services</DropdownMenuLabel>
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
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Categories</DropdownMenuLabel>
            {categoryOptions.map((category) => (
              <DropdownMenuCheckboxItem
                key={category}
                checked={activeFilters.includes(`category_${category.toLowerCase().replace(' ', '_')}` as FilterType)}
                onCheckedChange={() => handleFilterToggle(`category_${category.toLowerCase().replace(' ', '_')}` as FilterType)}
              >
                {category}
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
            <DropdownMenuCheckboxItem
              onClick={onExportCSV}
              className="cursor-pointer"
            >
              <Download className="h-4 w-4 mr-2" />
              Export as CSV
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              onClick={onExportPDF}
              className="cursor-pointer"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export as PDF
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Results Count */}
      <div className="text-xs text-muted-foreground">
        Showing <strong>{filteredCount}</strong> of <strong>{services.length}</strong> services
      </div>
    </div>
  );
});

export default ServiceSearchFilter;
