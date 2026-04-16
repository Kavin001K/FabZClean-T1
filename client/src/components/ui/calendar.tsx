import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "dropdown-buttons",
  fromYear = 1950,
  toYear = new Date().getFullYear() + 10,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      fromYear={fromYear}
      toYear={toYear}
      className={cn("p-4 sm:p-5 bg-background border border-border/50 rounded-2xl shadow-xl relative", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-5",
        caption: "flex justify-center pt-1 pb-4 relative items-center gap-2",
        caption_label: "text-sm font-semibold hidden", // Hidden manually as we are utilizing dropdowns
        caption_dropdowns: "flex justify-center gap-3 items-center w-full px-8", // Make room for nav buttons
        dropdown_month: "rdp-dropdown_month",
        dropdown_year: "rdp-dropdown_year",
        dropdown: "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-lg border border-input bg-background/50 hover:bg-accent/50 px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 bg-[url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-chevron-down\"><path d=\"m6 9 6 6 6-6\"/></svg>')] bg-no-repeat bg-[right_0.5rem_center] bg-[length:1em_1em] pr-8 appearance-none cursor-pointer transition-colors dark:bg-[url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"white\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-chevron-down\"><path d=\"m6 9 6 6 6-6\"/></svg>')]",
        dropdown_icon: "hidden", // Native icon hidden
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-9 w-9 bg-background/80 hover:bg-accent hover:text-accent-foreground p-0 opacity-80 hover:opacity-100 rounded-full border shadow-sm transition-all duration-200 z-10"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-2",
        head_row: "flex justify-between pb-3",
        head_cell: "text-muted-foreground w-11 font-bold text-[0.75rem] uppercase tracking-wider",
        row: "flex w-full mt-2 justify-between",
        cell: "h-11 w-11 text-center text-sm p-0 flex items-center justify-center relative [&:has([aria-selected].day-range-end)]:rounded-r-full [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-medium aria-selected:opacity-100 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-200"
        ),
        day_range_end: "day-range-end",
        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground hover:scale-110 focus:bg-primary focus:text-primary-foreground rounded-full shadow-lg font-bold text-base ring-offset-2 ring-2 ring-primary/20",
        day_today: "bg-accent/30 text-accent-foreground font-bold rounded-full ring-2 ring-primary/30 ring-offset-2",
        day_outside: "day-outside text-muted-foreground opacity-30 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-30",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground rounded-none",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
