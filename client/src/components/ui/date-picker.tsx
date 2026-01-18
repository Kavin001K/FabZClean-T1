import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
    date?: Date
    setDate: (date?: Date) => void
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function DatePicker({
    date,
    setDate,
    placeholder = "Pick a date",
    className,
    disabled
}: DatePickerProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal transition-all hover:border-primary/50",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary/70" />
                    {date ? format(date, "PPP") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}

// Date Range Picker variant
interface DateRangePickerProps {
    dateFrom?: Date
    dateTo?: Date
    setDateFrom: (date?: Date) => void
    setDateTo: (date?: Date) => void
    placeholderFrom?: string
    placeholderTo?: string
    className?: string
    disabled?: boolean
}

export function DateRangePicker({
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    placeholderFrom = "Start date",
    placeholderTo = "End date",
    className,
    disabled
}: DateRangePickerProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        disabled={disabled}
                        className={cn(
                            "flex-1 justify-start text-left font-normal transition-all hover:border-primary/50",
                            !dateFrom && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary/70" />
                        {dateFrom ? format(dateFrom, "PPP") : <span>{placeholderFrom}</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
            <span className="text-muted-foreground">→</span>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        disabled={disabled}
                        className={cn(
                            "flex-1 justify-start text-left font-normal transition-all hover:border-primary/50",
                            !dateTo && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary/70" />
                        {dateTo ? format(dateTo, "PPP") : <span>{placeholderTo}</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        disabled={(date) => dateFrom ? date < dateFrom : false}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
