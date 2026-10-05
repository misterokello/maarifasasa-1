import React, { useState } from "react";
import { format, subDays, startOfDay, endOfDay, startOfMonth, startOfYear } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DashboardRange = {
  from: Date | null; // null => all-time start
  to: Date | null; // null => now
  preset: PresetKey;
};

export type PresetKey =
  | "today"
  | "7d"
  | "30d"
  | "90d"
  | "mtd"
  | "ytd"
  | "365d"
  | "all"
  | "custom";

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "mtd", label: "Month to date" },
  { key: "ytd", label: "Year to date" },
  { key: "365d", label: "Last 12 months" },
  { key: "all", label: "All time" },
];

export function resolveRange(preset: PresetKey, custom?: DateRange): DashboardRange {
  const now = new Date();
  const to = endOfDay(now);
  switch (preset) {
    case "today":
      return { from: startOfDay(now), to, preset };
    case "7d":
      return { from: startOfDay(subDays(now, 6)), to, preset };
    case "30d":
      return { from: startOfDay(subDays(now, 29)), to, preset };
    case "90d":
      return { from: startOfDay(subDays(now, 89)), to, preset };
    case "365d":
      return { from: startOfDay(subDays(now, 364)), to, preset };
    case "mtd":
      return { from: startOfMonth(now), to, preset };
    case "ytd":
      return { from: startOfYear(now), to, preset };
    case "all":
      return { from: null, to: null, preset };
    case "custom":
      return {
        from: custom?.from ? startOfDay(custom.from) : null,
        to: custom?.to ? endOfDay(custom.to) : custom?.from ? endOfDay(custom.from) : null,
        preset,
      };
  }
}

export function rangeLabel(r: DashboardRange): string {
  if (r.preset !== "custom") {
    return PRESETS.find((p) => p.key === r.preset)?.label ?? "Custom range";
  }
  if (r.from && r.to) return `${format(r.from, "MMM d")} – ${format(r.to, "MMM d, yyyy")}`;
  return "Custom range";
}

export function daysInRange(r: DashboardRange): number {
  if (!r.from) return 0; // all-time
  const to = r.to ?? new Date();
  return Math.max(1, Math.ceil((to.getTime() - r.from.getTime()) / 86_400_000));
}

interface Props {
  value: DashboardRange;
  onChange: (range: DashboardRange) => void;
  className?: string;
}

const DashboardDateFilter: React.FC<Props> = ({ value, onChange, className }) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(
    value.from
      ? { from: value.from, to: value.to ?? undefined }
      : undefined,
  );

  const apply = (preset: PresetKey) => {
    onChange(resolveRange(preset));
    setOpen(false);
  };

  const applyCustom = () => {
    if (!draft?.from) return;
    onChange(resolveRange("custom", draft));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-9 gap-2 font-medium", className)}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          <span className="text-xs">{rangeLabel(value)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex flex-col sm:flex-row">
          <div className="border-b sm:border-b-0 sm:border-r p-2 min-w-[160px]">
            <p className="px-2 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Quick ranges
            </p>
            <div className="flex flex-col gap-0.5">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => apply(p.key)}
                  className={cn(
                    "text-left text-xs px-2.5 py-1.5 rounded-md transition-colors",
                    value.preset === p.key
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-muted text-foreground",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="p-2">
            <p className="px-2 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Custom range
            </p>
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={draft}
              onSelect={setDraft}
              defaultMonth={draft?.from ?? subDays(new Date(), 30)}
              className={cn("p-2 pointer-events-auto")}
            />
            <div className="flex items-center justify-between gap-2 px-2 pb-2">
              <span className="text-[11px] text-muted-foreground">
                {draft?.from
                  ? `${format(draft.from, "MMM d, yyyy")}${draft.to ? ` – ${format(draft.to, "MMM d, yyyy")}` : ""}`
                  : "Pick a start date"}
              </span>
              <Button size="sm" onClick={applyCustom} disabled={!draft?.from} className="h-7 text-xs">
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DashboardDateFilter;