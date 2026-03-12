"use client"

import * as React from "react";
import { type DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface Props {
  value?: { from?: string | null; to?: string | null };
  onChange?: (value: { from?: string | null; to?: string | null }) => void;
  placeholder?: string;
}

export default function DateRangePicker({ value, onChange, placeholder }: Props) {
  const [open, setOpen] = React.useState(false);
  const [range, setRange] = React.useState<DateRange | undefined>(() => {
    const from = value?.from ? new Date(value.from) : undefined;
    const to = value?.to ? new Date(value.to) : undefined;
    return { from, to } as DateRange | undefined;
  });

  React.useEffect(() => {
    const from = value?.from ? new Date(value.from) : undefined;
    const to = value?.to ? new Date(value.to) : undefined;
    setRange({ from, to } as DateRange | undefined);
  }, [value]);

  const formatDisplay = (r?: DateRange) => {
    if (!r || !r.from) return '';
    if (r.from && !r.to) return format(r.from, 'yyyy-MM-dd');
    return `${format(r.from!, 'yyyy-MM-dd')} → ${format(r.to!, 'yyyy-MM-dd')}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full text-left">
          <span className="truncate">{formatDisplay(range) || placeholder || 'Select date range'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="p-2">
          <Calendar
            mode="range"
            selected={range}
            onSelect={(r) => {
              setRange(r as DateRange);
            }}
            numberOfMonths={2}
          />

          <div className="flex gap-2 mt-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setRange(undefined);
                onChange?.({ from: null, to: null });
                setOpen(false);
              }}
            >
              Clear
            </Button>
            <Button
              onClick={() => {
                onChange?.({ from: range?.from ? range.from.toISOString().slice(0, 10) : null, to: range?.to ? range.to.toISOString().slice(0, 10) : null });
                setOpen(false);
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
