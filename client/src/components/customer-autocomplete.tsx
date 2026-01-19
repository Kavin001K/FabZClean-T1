import { useState, useEffect, useMemo } from "react";
import { Check, ChevronsUpDown, Loader2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";

interface Customer {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
}

interface CustomerAutocompleteProps {
    onSelect: (customer: Customer) => void;
    value?: string; // Customer ID
    placeholder?: string;
    className?: string;
}

export function CustomerAutocomplete({
    onSelect,
    value,
    placeholder = "Select customer...",
    className
}: CustomerAutocompleteProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    // Fetch customers when popover opens
    const { data: customersRaw, isLoading, error, refetch } = useQuery({
        queryKey: ["customers-autocomplete"],
        queryFn: async () => {
            const res = await fetch("/api/customers");
            if (!res.ok) {
                throw new Error("Failed to fetch customers");
            }
            const json = await res.json();
            // Handle both array response and { data: [] } response
            return Array.isArray(json) ? json : (json.data || []);
        },
        enabled: open, // Only fetch when popover opens
        staleTime: 30000, // Cache for 30 seconds
    });

    const customers: Customer[] = customersRaw || [];

    // Client-side filtering for instant search
    const filteredCustomers = useMemo(() => {
        if (!search.trim()) return customers;

        const searchLower = search.toLowerCase().trim();
        const searchDigits = search.replace(/\D/g, "");

        return customers.filter((customer) => {
            // Search by name
            if (customer.name?.toLowerCase().includes(searchLower)) return true;

            // Search by phone (normalize both)
            if (searchDigits.length >= 3 && customer.phone) {
                const phoneDigits = customer.phone.replace(/\D/g, "");
                if (phoneDigits.includes(searchDigits) || searchDigits.includes(phoneDigits)) {
                    return true;
                }
            }

            // Search by email
            if (customer.email?.toLowerCase().includes(searchLower)) return true;

            return false;
        });
    }, [customers, search]);

    // Find selected customer for display
    const selectedCustomer = customers.find((c) => c.id === value);

    // Refetch when opened
    useEffect(() => {
        if (open) {
            refetch();
        }
    }, [open, refetch]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between font-normal", className)}
                >
                    {selectedCustomer ? (
                        <span className="flex items-center gap-2">
                            <span className="font-medium">{selectedCustomer.name}</span>
                            {selectedCustomer.phone && (
                                <span className="text-muted-foreground text-xs">
                                    ({selectedCustomer.phone})
                                </span>
                            )}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search by name, phone, or email..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList className="max-h-[300px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">Loading customers...</span>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-6 text-destructive">
                                <span className="text-sm">Failed to load customers</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => refetch()}
                                    className="mt-2"
                                >
                                    Try again
                                </Button>
                            </div>
                        ) : filteredCustomers.length === 0 ? (
                            <CommandEmpty>
                                <div className="flex flex-col items-center gap-2 py-4">
                                    <span>No customer found.</span>
                                    {search && (
                                        <span className="text-xs text-muted-foreground">
                                            Try a different search term
                                        </span>
                                    )}
                                </div>
                            </CommandEmpty>
                        ) : (
                            <CommandGroup heading={`${filteredCustomers.length} customer${filteredCustomers.length !== 1 ? 's' : ''} found`}>
                                {filteredCustomers.slice(0, 50).map((customer) => (
                                    <CommandItem
                                        key={customer.id}
                                        value={customer.id}
                                        onSelect={() => {
                                            onSelect(customer);
                                            setOpen(false);
                                            setSearch("");
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4 flex-shrink-0",
                                                value === customer.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="font-medium truncate">{customer.name}</span>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                {customer.phone && (
                                                    <span className="truncate">{customer.phone}</span>
                                                )}
                                                {customer.phone && customer.email && (
                                                    <span>•</span>
                                                )}
                                                {customer.email && (
                                                    <span className="truncate">{customer.email}</span>
                                                )}
                                            </div>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
