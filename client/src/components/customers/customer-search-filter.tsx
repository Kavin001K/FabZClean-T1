import React, { useCallback, useMemo } from 'react';
import { Search, ListFilter, Download, FileText, X } from 'lucide-react';
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
import { TEST_IDS, getTestId } from '@/lib/test-ids';
import { useDebouncedSearch } from '@/hooks/use-debounce';
import { useStableCallback } from '@/hooks/use-memoization';
import type { Customer } from '../../../shared/schema';

/**
 * Customer search filter component with debounced search and multiple filter options
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.searchQuery - Current search query
 * @param {Function} props.onSearchChange - Search query change handler
 * @param {FilterType[]} props.activeFilters - Currently active filters
 * @param {Function} props.onFilterChange - Filter change handler
 * @param {Function} props.onExportCSV - CSV export handler
 * @param {Function} props.onExportPDF - PDF export handler
 * @param {Customer[]} props.customers - Array of customers
 * @param {number} props.filteredCount - Number of filtered customers
 * @returns {JSX.Element} Rendered search filter component
 * 
 * @example
 * ```tsx
 * <CustomerSearchFilter
 *   searchQuery={searchQuery}
 *   onSearchChange={setSearchQuery}
 *   activeFilters={filters}
 *   onFilterChange={setFilters}
 *   onExportCSV={handleExportCSV}
 *   onExportPDF={handleExportPDF}
 *   customers={customers}
 *   filteredCount={filteredCustomers.length}
 * />
 * ```
 */

export type FilterType = 'all' | 'new' | 'loyal' | 'high_value' | 'has_orders';

interface CustomerSearchFilterProps {
  /** Current search query */
  searchQuery: string;
  /** Search query change handler */
  onSearchChange: (query: string) => void;
  /** Currently active filters */
  activeFilters: FilterType[];
  /** Filter change handler */
  onFilterChange: (filters: FilterType[]) => void;
  /** CSV export handler */
  onExportCSV: () => void;
  /** PDF export handler */
  onExportPDF: () => void;
  /** Array of customers */
  customers: Customer[];
  /** Number of filtered customers */
  filteredCount: number;
}

const filterOptions = [
  { value: 'all' as const, label: 'All Customers', description: 'Show all customers' },
  { value: 'new' as const, label: 'New Customers', description: 'Customers joined in last 30 days' },
  { value: 'loyal' as const, label: 'Loyal Customers', description: 'Customers with 5+ orders' },
  { value: 'high_value' as const, label: 'High Value', description: 'Customers with ₹5000+ total spend' },
  { value: 'has_orders' as const, label: 'Has Orders', description: 'Customers with at least one order' },
] as const;

export const CustomerSearchFilter: React.FC<CustomerSearchFilterProps> = React.memo(({
  searchQuery,
  onSearchChange,
  activeFilters,
  onFilterChange,
  onExportCSV,
  onExportPDF,
  customers,
  filteredCount,
}) => {
  // Use debounced search for better performance
  const { debouncedQuery, isSearching } = useDebouncedSearch(searchQuery, 300);

  // Memoized filter toggle handler
  const handleFilterToggle = useStableCallback((filter: FilterType) => {
    if (filter === 'all') {
      onFilterChange(['all']);
    } else {
      const newFilters = activeFilters.includes(filter)
        ? activeFilters.filter(f => f !== filter && f !== 'all')
        : [...activeFilters.filter(f => f !== 'all'), filter];
      
      // If no filters selected, default to 'all'
      onFilterChange(newFilters.length === 0 ? ['all'] : newFilters);
    }
  }, [activeFilters, onFilterChange]);

  // Memoized active filter count
  const activeFilterCount = useMemo(() => {
    return activeFilters.filter(f => f !== 'all').length;
  }, [activeFilters]);

  // Memoized clear all filters handler
  const clearAllFilters = useStableCallback(() => {
    onFilterChange(['all']);
  }, [onFilterChange]);

  // Memoized search change handler
  const handleSearchChange = useStableCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  }, [onSearchChange]);

  // Memoized clear search handler
  const handleClearSearch = useStableCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);

  // Memoized filter options
  const memoizedFilterOptions = useMemo(() => filterOptions, []);

  return (
    <div 
      className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
      data-testid={getTestId(TEST_IDS.CUSTOMERS.FILTER)}
    >
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search 
          className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" 
          data-testid={getTestId(TEST_IDS.SEARCH.INPUT, 'icon')}
        />
        <Input
          type="search"
          placeholder="Search customers..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-8"
          data-testid={getTestId(TEST_IDS.SEARCH.INPUT)}
          aria-label="Search customers"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-6 w-6 p-0"
            onClick={handleClearSearch}
            data-testid={getTestId(TEST_IDS.SEARCH.CLEAR)}
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        {isSearching && (
          <div 
            className="absolute right-8 top-2.5 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
            data-testid={getTestId(TEST_IDS.LOADING.SPINNER, 'search')}
          />
        )}
      </div>

      {/* Filter and Export Controls */}
      <div className="flex items-center gap-2">
        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div 
            className="flex items-center gap-1"
            data-testid={getTestId(TEST_IDS.FILTER.CONTAINER, 'active')}
          >
            {activeFilters
              .filter(f => f !== 'all')
              .map((filter) => (
                <Badge 
                  key={filter} 
                  variant="secondary" 
                  className="text-xs cursor-pointer hover:bg-secondary/80"
                  onClick={() => handleFilterToggle(filter)}
                  data-testid={getTestId(TEST_IDS.FILTER.OPTION, filter)}
                  aria-label={`Remove ${filter} filter`}
                >
                  {memoizedFilterOptions.find(opt => opt.value === filter)?.label}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs text-muted-foreground hover:text-foreground"
              data-testid={getTestId(TEST_IDS.FILTER.CLEAR)}
              aria-label="Clear all filters"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1"
              data-testid={getTestId(TEST_IDS.FILTER.DROPDOWN, 'trigger')}
              aria-label={`Filter customers${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
            >
              <ListFilter className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Filter
                {activeFilterCount > 0 && ` (${activeFilterCount})`}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-56"
            data-testid={getTestId(TEST_IDS.FILTER.DROPDOWN, 'content')}
          >
            <DropdownMenuLabel>Filter Customers</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {memoizedFilterOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={activeFilters.includes(option.value)}
                onCheckedChange={() => handleFilterToggle(option.value)}
                data-testid={getTestId(TEST_IDS.FILTER.OPTION, option.value)}
                title={option.description}
              >
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </div>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 gap-1"
              data-testid={getTestId(TEST_IDS.EXPORT.BUTTON, 'trigger')}
              aria-label="Export options"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Export
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end"
            data-testid={getTestId(TEST_IDS.EXPORT.BUTTON, 'content')}
          >
            <DropdownMenuLabel>Export Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              onClick={onExportCSV}
              className="cursor-pointer"
              data-testid={getTestId(TEST_IDS.EXPORT.CSV)}
              aria-label="Export as CSV"
            >
              <Download className="h-4 w-4 mr-2" />
              Export as CSV
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              onClick={onExportPDF}
              className="cursor-pointer"
              data-testid={getTestId(TEST_IDS.EXPORT.PDF)}
              aria-label="Export as PDF"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export as PDF
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Results Count */}
      <div 
        className="text-xs text-muted-foreground"
        data-testid={getTestId(TEST_IDS.DATA.EMPTY, 'count')}
      >
        Showing <strong>{filteredCount}</strong> of <strong>{customers.length}</strong> customers
      </div>
    </div>
  );
});

export default CustomerSearchFilter;
