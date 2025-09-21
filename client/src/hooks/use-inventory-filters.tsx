import { useMemo, useState } from 'react';
import type { InventoryItem } from '@/lib/data-service';
import type { FilterType } from '@/components/inventory/inventory-toolbar';

export const useInventoryFilters = (inventory: InventoryItem[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterType[]>(['all']);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredAndSortedInventory = useMemo(() => {
    let filtered = inventory;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.sku?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.supplier?.toLowerCase().includes(query)
      );
    }

    // Apply status filters
    if (!activeFilters.includes('all')) {
      filtered = filtered.filter(item => {
        return activeFilters.some(filter => {
          switch (filter) {
            case 'in_stock':
              return item.status === 'In Stock';
            case 'low_stock':
              return item.status === 'Low Stock';
            case 'out_of_stock':
              return item.status === 'Out of Stock';
            default:
              return true;
          }
        });
      });
    }

    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'stock':
            aValue = a.stock;
            bValue = b.stock;
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          case 'price':
            aValue = a.price || 0;
            bValue = b.price || 0;
            break;
          case 'supplier':
            aValue = a.supplier || '';
            bValue = b.supplier || '';
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [inventory, searchQuery, activeFilters, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActiveFilters(['all']);
    setSortField('');
    setSortDirection('asc');
  };

  const getFilterStats = () => {
    const totalItems = inventory.length;
    const inStockItems = inventory.filter(item => item.status === 'In Stock').length;
    const lowStockItems = inventory.filter(item => item.status === 'Low Stock').length;
    const outOfStockItems = inventory.filter(item => item.status === 'Out of Stock').length;
    
    const categoryStats = inventory.reduce((acc, item) => {
      const category = item.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const supplierStats = inventory.reduce((acc, item) => {
      const supplier = item.supplier || 'Unknown';
      acc[supplier] = (acc[supplier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalItems,
      inStockItems,
      lowStockItems,
      outOfStockItems,
      categoryStats,
      supplierStats,
    };
  };

  return {
    searchQuery,
    setSearchQuery,
    activeFilters,
    setActiveFilters,
    filteredAndSortedInventory,
    clearFilters,
    getFilterStats,
    sortField,
    sortDirection,
    handleSort,
  };
};
