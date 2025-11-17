import { cn } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

export interface PageSizeSelectProps {
  value: number;
  options?: number[];
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export function PageSizeSelect({
  value,
  options = [DEFAULT_PAGE_SIZE, 25, 50, 100],
  onChange,
  disabled,
  className,
}: PageSizeSelectProps) {
  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <span className="whitespace-nowrap">Per page</span>
      <Select
        value={String(value)}
        onValueChange={(v) => onChange(Number(v))}
        disabled={disabled}
      >
        <SelectTrigger className="h-8 w-[84px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
