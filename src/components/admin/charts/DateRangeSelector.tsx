import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";

export type DateRangeOption = 
  | "7d" 
  | "14d" 
  | "30d" 
  | "90d" 
  | "180d" 
  | "365d";

export interface DateRangeConfig {
  value: DateRangeOption;
  label: string;
  days: number;
}

export const DATE_RANGE_OPTIONS: DateRangeConfig[] = [
  { value: "7d", label: "Last 7 Days", days: 7 },
  { value: "14d", label: "Last 2 Weeks", days: 14 },
  { value: "30d", label: "Last Month", days: 30 },
  { value: "90d", label: "Last Quarter", days: 90 },
  { value: "180d", label: "Last 6 Months", days: 180 },
  { value: "365d", label: "Last 1 Year", days: 365 },
];

export const getDaysFromRange = (range: DateRangeOption): number => {
  return DATE_RANGE_OPTIONS.find(opt => opt.value === range)?.days || 7;
};

interface DateRangeSelectorProps {
  value: DateRangeOption;
  onChange: (value: DateRangeOption) => void;
  className?: string;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  value,
  onChange,
  className = "",
}) => {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as DateRangeOption)}>
      <SelectTrigger className={`w-[160px] h-8 text-sm ${className}`}>
        <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {DATE_RANGE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default DateRangeSelector;
