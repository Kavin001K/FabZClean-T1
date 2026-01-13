import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp, Filter } from 'lucide-react';
import { useFuzzySearch, useSearchSuggestions, useRecentSearches } from '../../hooks/use-fuzzy-search';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

export interface SearchResult<T> {
  item: T;
  score: number;
  matchedFields: string[];
  highlights: { [field: string]: string };
}

export interface SearchComponentProps<T> {
  data: T[];
  searchFields: string[];
  onResultSelect?: (result: T) => void;
  placeholder?: string;
  className?: string;
  showSuggestions?: boolean;
  showRecentSearches?: boolean;
  maxResults?: number;
  threshold?: number;
  debounceMs?: number;
  renderResult?: (result: SearchResult<T>) => React.ReactNode;
  renderSuggestion?: (suggestion: any) => React.ReactNode;
  emptyMessage?: string;
  loadingMessage?: string;
}

/**
 * Advanced Search Input Component
 */
export function SearchInput<T>({
  data,
  searchFields,
  onResultSelect,
  placeholder = "Search...",
  className = "",
  showSuggestions = true,
  showRecentSearches = true,
  maxResults = 10,
  threshold = 0.7,
  debounceMs = 300,
  renderResult,
  renderSuggestion,
  emptyMessage = "No results found",
  loadingMessage = "Searching..."
}: SearchComponentProps<T>) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const {
    results,
    isLoading,
    totalResults
  } = useFuzzySearch(data, query, searchFields, {
    threshold,
    maxResults,
    debounceMs
  });

  const {
    suggestions,
    isLoading: suggestionsLoading
  } = useSearchSuggestions(query, {
    types: ['orders', 'customers', 'products'],
    limit: 5
  });

  const {
    recentSearches,
    saveSearch
  } = useRecentSearches();

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleResultSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, results]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleResultSelect = (result: SearchResult<T>) => {
    onResultSelect?.(result.item);
    saveSearch(query);
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length > 0);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const defaultRenderResult = (result: SearchResult<T>) => (
    <div className="p-3 hover:bg-gray-50 cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium text-gray-900">
            {result.item && typeof result.item === 'object' && 'name' in result.item
              ? (result.item as any).name
              : String(result.item)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Score: {Math.round(result.score * 100)}%
          </div>
          {result.matchedFields.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {result.matchedFields.map(field => (
                <Badge key={field} variant="secondary" className="text-xs">
                  {field}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const defaultRenderSuggestion = (suggestion: any) => (
    <div className="p-2 hover:bg-gray-50 cursor-pointer">
      <div className="font-medium">{suggestion.text}</div>
      <div className="text-sm text-gray-500">{suggestion.type}</div>
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(query.length > 0)}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-hidden">
          <CardContent className="p-0">
            <div ref={resultsRef} className="max-h-96 overflow-y-auto">
              {/* Search Results */}
              {query && (
                <>
                  {isLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      {loadingMessage}
                    </div>
                  ) : results.length > 0 ? (
                    <div className="border-b">
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                        Results ({totalResults})
                      </div>
                      {results.map((result: SearchResult<T>, index: number) => (
                        <div
                          key={index}
                          className={`${
                            index === selectedIndex ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => handleResultSelect(result)}
                        >
                          {renderResult ? renderResult(result) : defaultRenderResult(result)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      {emptyMessage}
                    </div>
                  )}
                </>
              )}

              {/* Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="border-b">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" />
                    Suggestions
                  </div>
                  {suggestions.map((suggestion: any, index: number) => (
                    <div
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion.text)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      {renderSuggestion ? renderSuggestion(suggestion) : defaultRenderSuggestion(suggestion)}
                    </div>
                  ))}
                </div>
              )}

              {/* Recent Searches */}
              {showRecentSearches && recentSearches.length > 0 && !query && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Recent Searches
                  </div>
                  {recentSearches.slice(0, 5).map((search: any, index: number) => (
                    <div
                      key={index}
                      onClick={() => handleRecentSearchClick(search.query)}
                      className="p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="text-sm">{search.query}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(search.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Search Filters Component
 */
export function SearchFilters({
  filters,
  onFiltersChange,
  className = ""
}: {
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const activeFiltersCount = Object.keys(filters).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={className}>
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Search Filters</h4>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            )}
          </div>
          
          {/* Add your filter components here */}
          <div className="space-y-3">
            {/* Example: Date range filter */}
            <div>
              <label className="text-sm font-medium">Date Range</label>
              <div className="mt-1 space-y-2">
                <Input
                  type="date"
                  placeholder="From"
                  value={filters.dateFrom || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('dateFrom', e.target.value)}
                />
                <Input
                  type="date"
                  placeholder="To"
                  value={filters.dateTo || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>
            </div>

            {/* Example: Status filter */}
            <div>
              <label className="text-sm font-medium">Status</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {['pending', 'processing', 'completed', 'cancelled'].map(status => (
                  <Button
                    key={status}
                    variant={filters.status === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange('status', filters.status === status ? undefined : status)}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Search Results List Component
 */
export function SearchResultsList<T>({
  results,
  isLoading,
  onResultSelect,
  renderResult,
  emptyMessage = "No results found",
  loadingMessage = "Searching...",
  className = ""
}: {
  results: SearchResult<T>[];
  isLoading: boolean;
  onResultSelect?: (result: T) => void;
  renderResult?: (result: SearchResult<T>) => React.ReactNode;
  emptyMessage?: string;
  loadingMessage?: string;
  className?: string;
}) {
  if (isLoading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-500">{loadingMessage}</div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-500">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {results.map((result, index) => (
        <div key={index}>
          {renderResult ? renderResult(result) : (
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {result.item && typeof result.item === 'object' && 'name' in result.item
                        ? (result.item as any).name
                        : String(result.item)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Score: {Math.round(result.score * 100)}%
                    </div>
                    {result.matchedFields.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {result.matchedFields.map(field => (
                          <Badge key={field} variant="secondary" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Search Analytics Component
 */
export function SearchAnalytics({
  totalResults,
  searchTime,
  query,
  className = ""
}: {
  totalResults: number;
  searchTime: number;
  query: string;
  className?: string;
}) {
  return (
    <div className={`text-sm text-gray-500 ${className}`}>
      {query && (
        <>
          Found {totalResults} results for "{query}" in {searchTime}ms
        </>
      )}
    </div>
  );
}
