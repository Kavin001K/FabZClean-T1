import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import type { Customer } from '@shared/schema';

interface CustomerAutocompleteProps {
    customers?: Customer[];
    onSelect: (customer: Customer) => void;
    onCreateNew?: (query: string) => void;
    searchCustomers?: (query: string) => Promise<Customer[]>;
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
    if (customer.id?.toLowerCase().includes(queryLower)) score += 25;
    if (customer.name?.toLowerCase().includes(queryLower)) score += 25;
    if (normalizedCustomerPhone.includes(normalizedQuery)) score += 25;
    if (customer.email?.toLowerCase().includes(queryLower)) score += 25;

    // Fuzzy match gets low score
    if (fuzzyMatch(customer.id || '', query)) score += 10;
    if (fuzzyMatch(customer.name || '', query)) score += 10;
    if (fuzzyMatch(normalizedCustomerPhone, normalizedQuery)) score += 10;
    if (fuzzyMatch(customer.email || '', query)) score += 10;

    return score;
}

const EMPTY_CUSTOMERS: Customer[] = [];

export function CustomerAutocomplete({
    customers = EMPTY_CUSTOMERS,
    onSelect,
    onCreateNew,
    searchCustomers,
    placeholder = 'Search by Name, ID, Phone, or Email...',
    className = ''
}: CustomerAutocompleteProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(EMPTY_CUSTOMERS);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const requestIdRef = useRef(0);
    const ignoreNextSearchRef = useRef(false);

    // Filter and sort customers based on search query.
    // Remote search is used for the New Order flow to avoid loading the entire
    // customer list up front.
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredCustomers(EMPTY_CUSTOMERS);
            if (isOpen) setIsOpen(false);
            if (isSearching) setIsSearching(false);
            return;
        }

        // If selection was just made, ignore this trigger
        if (ignoreNextSearchRef.current) {
            ignoreNextSearchRef.current = false;
            return;
        }

        if (isOpen === false && searchQuery.trim().length > 0) {
            // Dropdown is closed, likely just selected or cleared
            return;
        }

        let isCancelled = false;
        const requestId = ++requestIdRef.current;

        const applyMatches = (matches: Customer[]) => {
            if (isCancelled || requestId !== requestIdRef.current) return;
            setFilteredCustomers(matches.slice(0, 10));
            setIsOpen(true);
            setHighlightedIndex(0);
        };

        const runSearch = async () => {
            if (searchCustomers) {
                setIsSearching(true);
                try {
                    // Internal debounce already handled by outer wrapper
                    if (isCancelled || requestId !== requestIdRef.current) return;
                    
                    const matches = await searchCustomers(searchQuery.trim());
                    applyMatches(Array.isArray(matches) ? matches : EMPTY_CUSTOMERS);
                } catch (error) {
                    console.error('[Autocomplete] Customer search failed:', error);
                    applyMatches(EMPTY_CUSTOMERS);
                } finally {
                    if (!isCancelled && requestId === requestIdRef.current) {
                        setIsSearching(false);
                    }
                }
                return;
            }

            const matches = customers
                .map(customer => ({
                    customer,
                    score: calculateRelevance(customer, searchQuery)
                }))
                .filter(({ score }) => score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 10)
                .map(({ customer }) => customer);

            applyMatches(matches);
        };

        const timer = window.setTimeout(runSearch, searchCustomers ? 400 : 50);

        return () => {
            isCancelled = true;
            window.clearTimeout(timer);
        };
    }, [searchQuery, customers, searchCustomers]);

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
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen) return;

        // If we have results, navigation includes them. If we have "Create New", it's the last item.
        const totalItems = filteredCustomers.length + (onCreateNew ? 1 : 0);

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < totalItems - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex < filteredCustomers.length) {
                    handleSelect(filteredCustomers[highlightedIndex]);
                } else if (onCreateNew) {
                    onCreateNew(searchQuery);
                    setIsOpen(false);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
        }
    };

    const handleSelect = (customer: Customer) => {
        ignoreNextSearchRef.current = true;
        onSelect(customer);
        setSearchQuery(customer.name || customer.phone || '');
        setIsOpen(false);
    };

    const handleClear = () => {
        setSearchQuery('');
        setFilteredCustomers(EMPTY_CUSTOMERS);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    // Highlight matching text with special handling for phone numbers
    const highlightMatch = (text: string, query: string, isPhone: boolean = false) => {
        if (!query) return text;

        const normalizedQuery = query.toLowerCase().replace(/[^\d]/g, '');
        const normalizedText = text.toLowerCase().replace(/[^\d]/g, '');

        // If it's a phone query and we're highlighting a phone number
        if (isPhone && normalizedQuery && normalizedText.includes(normalizedQuery)) {
            // Find the start and end of the matching sequence of digits in the original text
            let queryIdx = 0;
            let startIdx = -1;
            let endIdx = -1;

            for (let i = 0; i < text.length; i++) {
                if (/[0-9]/.test(text[i])) {
                    if (text[i] === normalizedQuery[queryIdx]) {
                        if (startIdx === -1) startIdx = i;
                        queryIdx++;
                        if (queryIdx === normalizedQuery.length) {
                            endIdx = i + 1;
                            break;
                        }
                    } else if (queryIdx > 0) {
                        // Reset if we broke the sequence
                        queryIdx = 0;
                        startIdx = -1;
                        i--; // Re-check this digit
                    }
                }
            }

            if (startIdx !== -1 && endIdx !== -1) {
                return (
                    <>
                        {text.substring(0, startIdx)}
                        <span className="bg-primary/20 font-bold text-primary px-0.5 rounded">
                            {text.substring(startIdx, endIdx)}
                        </span>
                        {text.substring(endIdx)}
                    </>
                );
            }
        }

        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) return text;

        return (
            <>
                {text.substring(0, index)}
                <span className="bg-primary/20 font-bold text-primary px-0.5 rounded">
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
                    onFocus={() => searchQuery && setIsOpen(true)}
                    placeholder={placeholder}
                    className="pl-9 pr-9"
                />
                {isSearching ? (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                ) : searchQuery ? (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                ) : null}
            </div>

            {/* Dropdown */}
            {isOpen && searchQuery && (
                <Card className="absolute z-[9999] w-full mt-1 max-h-80 overflow-y-auto shadow-xl border bg-popover text-popover-foreground">
                    <div className="p-2">
                        {isSearching && (
                            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Searching customers...
                            </div>
                        )}

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
                                                <div className="flex items-center gap-1.5 text-primary/80 font-medium">
                                                    <span className="text-muted-foreground w-3.5 text-center">🆔</span>
                                                    <span>{highlightMatch(customer.id, searchQuery)}</span>
                                                </div>
                                            {customer.phone && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-muted-foreground w-3.5 text-center">📞</span>
                                                    <span>{highlightMatch(customer.phone, searchQuery, true)}</span>
                                                </div>
                                            )}
                                            {customer.email && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-muted-foreground w-3.5 text-center">✉️</span>
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

                        {!isSearching && filteredCustomers.length === 0 && !onCreateNew && (
                            <div className="px-3 py-3 text-sm text-muted-foreground">
                                No matching customers found.
                            </div>
                        )}

                        {/* Create New Option */}
                        {onCreateNew && (
                            <button
                                onClick={() => {
                                    onCreateNew(searchQuery);
                                    setIsOpen(false);
                                }}
                                onMouseEnter={() => setHighlightedIndex(filteredCustomers.length)}
                                className={`w-full text-left px-3 py-3 rounded-md transition-colors border-t mt-1 ${highlightedIndex === filteredCustomers.length
                                    ? 'bg-primary/10 border border-primary'
                                    : 'hover:bg-muted'
                                    }`}
                            >
                                <div className="flex items-center gap-3 text-primary">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold flex-shrink-0">
                                        +
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">Create New Customer</div>
                                        <div className="text-xs text-muted-foreground">
                                            Create a new record for "{searchQuery}"
                                        </div>
                                    </div>
                                </div>
                            </button>
                        )}
                    </div>

                    {/* Keyboard hint */}
                    <div className="px-3 py-2 text-xs text-muted-foreground bg-muted border-t">
                        <span className="font-medium">Tip:</span> Use ↑↓ to navigate, Enter to select, Esc to close
                    </div>
                </Card>
            )}
        </div>
    );
}
