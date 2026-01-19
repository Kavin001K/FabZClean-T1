import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
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

interface CustomerAutocompleteProps {
    onSelect: (customer: any) => void;
    value?: string; // ID
}

export function CustomerAutocomplete({ onSelect, value }: CustomerAutocompleteProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const { data: customers } = useQuery({
        queryKey: ["customers-search", search],
        queryFn: async () => {
            // Use your global search or customer list endpoint
            const res = await fetch(`/api/customers?search=${search}`);
            const json = await res.json();
            return json.data || [];
        },
        enabled: open // Only fetch when open
    });

    const selectedCustomer = customers?.find((c: any) => c.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {selectedCustomer ? selectedCustomer.name : "Select customer..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command shouldFilter={false}> {/* Server-side filtering */}
                    <CommandInput
                        placeholder="Search customer..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup>
                            {customers?.map((customer: any) => (
                                <CommandItem
                                    key={customer.id}
                                    value={customer.id}
                                    onSelect={() => {
                                        onSelect(customer);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === customer.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{customer.name}</span>
                                        <span className="text-xs text-muted-foreground">{customer.phone}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
