import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import type { Customer } from '../../../shared/schema';

interface CustomerAutocompleteProps {
    customers: Customer[];
    onSelect: (customer: Customer) => void;
    placeholder?: string;
    className?: string;
}

// Fuzzy search algorithm - matches partial strings
function fuzzyMatch(str: string, pattern: string): boolean {
    if (!pattern) return true;
    if (!str) return false;

    const strLower = str.toLowerCase();
    const patternLower = pattern.toLowerCase();

    // Direct substring match (highest priority)
    if (strLower.includes(patternLower)) return true;

    // Fuzzy character-by-character match
    let patternIdx = 0;
    for (let i = 0; i < strLower.length && patternIdx < patternLower.length; i++) {
        if (strLower[i] === patternLower[patternIdx]) {
            patternIdx++;
        }
    }

    return patternIdx === patternLower.length;
}

// Calculate relevance score for sorting
function calculateRelevance(customer: Customer, query: string): number {
    const queryLower = query.toLowerCase();
    let score = 0;

    // Normalize phone numbers (remove spaces, dashes, leading zeros, country codes)
    const normalizePhone = (phone: string) => {
        return phone.replace(/[\s\-\(\)]/g, '').replace(/^0+/, '').replace(/^\+91/, '');
    };

    const normalizedQuery = normalizePhone(query);
    const normalizedCustomerPhone = customer.phone ? normalizePhone(customer.phone) : '';

    // Exact matches get highest score
    if (customer.name?.toLowerCase() === queryLower) score += 100;
    if (normalizedCustomerPhone === normalizedQuery) score += 100;
    if (customer.email?.toLowerCase() === queryLower) score += 100;

    // Starts with match gets high score
    if (customer.name?.toLowerCase().startsWith(queryLower)) score += 50;
    if (normalizedCustomerPhone.startsWith(normalizedQuery)) score += 50;
    if (customer.email?.toLowerCase().startsWith(queryLower)) score += 50;

    // Contains match gets medium score
    if (customer.name?.toLowerCase().includes(queryLower)) score += 25;
    if (normalizedCustomerPhone.includes(normalizedQuery)) score += 25;
    if (customer.email?.toLowerCase().includes(queryLower)) score += 25;

    // Fuzzy match gets low score
    if (fuzzyMatch(customer.name || '', query)) score += 10;
    if (fuzzyMatch(normalizedCustomerPhone, normalizedQuery)) score += 10;
    if (fuzzyMatch(customer.email || '', query)) score += 10;

    return score;
}

export function CustomerAutocomplete({
    customers,
    onSelect,
    placeholder = 'Search by name, phone, or email...',
    className = ''
}: CustomerAutocompleteProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debug: Log customers when they change
    React.useEffect(() => {
        console.log('[Autocomplete] Total customers:', customers.length);
        console.log('[Autocomplete] Sample customer:', customers[0]);
    }, [customers]);

    // Filter and sort customers based on search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredCustomers([]);
            setIsOpen(false);
            return;
        }

        const matches = customers
            .map(customer => ({
                customer,
                score: calculateRelevance(customer, searchQuery)
            }))
            .filter(({ score }) => score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10) // Show top 10 matches
            .map(({ customer }) => customer);

        console.log('[Autocomplete] Query:', searchQuery);
        console.log('[Autocomplete] Matches found:', matches.length);
        if (matches.length > 0) {
            console.log('[Autocomplete] First match:', matches[0]);
        }

        setFilteredCustomers(matches);
        setIsOpen(matches.length > 0);
        setHighlightedIndex(0);
    }, [searchQuery, customers]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredCustomers.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredCustomers[highlightedIndex]) {
                    handleSelect(filteredCustomers[highlightedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
        }
    };

    const handleSelect = (customer: Customer) => {
        onSelect(customer);
        setSearchQuery(customer.name || customer.phone || '');
        setIsOpen(false);
    };

    const handleClear = () => {
        setSearchQuery('');
        setFilteredCustomers([]);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    // Highlight matching text
    const highlightMatch = (text: string, query: string) => {
        if (!query) return text;

        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) return text;

        return (
            <>
                {text.substring(0, index)}
                <span className="bg-yellow-200 dark:bg-yellow-800 font-semibold">
                    {text.substring(index, index + query.length)}
                </span>
                {text.substring(index + query.length)}
            </>
        );
    };

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => searchQuery && filteredCustomers.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    className="pl-9 pr-9"
                />
                {searchQuery && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && filteredCustomers.length > 0 && (
                <Card className="absolute z-[9999] w-full mt-1 max-h-80 overflow-y-auto shadow-xl border bg-popover text-popover-foreground">
                    <div className="p-2">
                        {filteredCustomers.map((customer, index) => (
                            <button
                                key={customer.id}
                                onClick={() => handleSelect(customer)}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                className={`w-full text-left px-3 py-3 rounded-md transition-colors ${index === highlightedIndex
                                    ? 'bg-primary/10 border border-primary'
                                    : 'hover:bg-muted'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                                        {customer.name?.[0]?.toUpperCase() || 'C'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm">
                                            {highlightMatch(customer.name || 'Unknown', searchQuery)}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                            {customer.phone && (
                                                <div className="flex items-center gap-1">
                                                    <span>📞</span>
                                                    <span>{highlightMatch(customer.phone, searchQuery)}</span>
                                                </div>
                                            )}
                                            {customer.email && (
                                                <div className="flex items-center gap-1">
                                                    <span>✉️</span>
                                                    <span className="truncate">
                                                        {highlightMatch(customer.email, searchQuery)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Keyboard hint */}
                    <div className="px-3 py-2 text-xs text-muted-foreground bg-muted border-t">
                        <span className="font-medium">Tip:</span> Use ↑↓ to navigate, Enter to select, Esc to close
                    </div>
                </Card>
            )}

            {/* No results */}
            {isOpen && searchQuery && filteredCustomers.length === 0 && (
                <Card className="absolute z-[9999] w-full mt-1 shadow-xl border bg-popover text-popover-foreground">
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No customers found matching "{searchQuery}"
                    </div>
                </Card>
            )}
        </div>
    );
}
