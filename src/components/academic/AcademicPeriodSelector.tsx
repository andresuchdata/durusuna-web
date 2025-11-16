"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Calendar, Check, ChevronsUpDown } from "lucide-react";
import { useAcademicPeriods } from "@/domains/academic/hooks";
import type { AcademicPeriodWithYearSummary } from "@/domains/academic/types";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface AcademicPeriodSelectorProps {
  value?: string;
  onChange: (id: string) => void;
}

export function AcademicPeriodSelector({ value, onChange }: AcademicPeriodSelectorProps) {
  const { data, isLoading } = useAcademicPeriods();
  const [open, setOpen] = useState(false);

  const periods: AcademicPeriodWithYearSummary[] = data?.academic_periods ?? [];

  const selected = useMemo(() => {
    if (!periods.length) return undefined;
    if (value) {
      const explicit = periods.find((p) => p.id === value);
      if (explicit) return explicit;
    }
    const current = periods.find((p) => p.is_current);
    if (current) return current;
    return periods[0];
  }, [periods, value]);

  useEffect(() => {
    if (!value && selected) {
      onChange(selected.id);
    }
  }, [value, selected, onChange]);

  if (isLoading) {
    return <div className="h-7 w-56 animate-pulse rounded-full bg-slate-100" />;
  }

  if (!periods.length) {
    return <span className="text-xs text-muted-foreground">No academic periods</span>;
  }

  const label = selected
    ? `${selected.name} · ${selected.academic_year.name}`
    : "Select academic period";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-[260px] justify-between rounded-full border-slate-300 bg-white px-3 text-xs font-normal text-slate-700"
        >
          <span className="inline-flex items-center gap-2 truncate">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">{label}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 text-slate-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="end">
        <div className="max-h-80 space-y-1 overflow-y-auto text-xs">
          {renderPeriodGroups(periods, selected, (id) => {
            onChange(id);
            setOpen(false);
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function renderPeriodGroups(
  periods: AcademicPeriodWithYearSummary[],
  selected: AcademicPeriodWithYearSummary | undefined,
  onSelect: (id: string) => void
): ReactNode {
  const items: ReactNode[] = [];
  let lastYearId: string | null = null;

  for (const period of periods) {
    const yearChanged = period.academic_year.id !== lastYearId;

    if (yearChanged) {
      lastYearId = period.academic_year.id;
      items.push(
        <div
          key={`year-${period.academic_year.id}`}
          className="mt-2 border-b border-slate-100 pb-1 text-[10px] font-semibold uppercase text-slate-500 first:mt-0"
        >
          {period.academic_year.name}
        </div>
      );
    }

    const isSelected = !!selected && selected.id === period.id;

    items.push(
      <button
        key={period.id}
        type="button"
        onClick={() => onSelect(period.id)}
        className={cn(
          "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition hover:bg-slate-50",
          isSelected && "bg-slate-100"
        )}
      >
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-slate-900">{period.name}</span>
          <span className="text-[10px] text-slate-500">
            {new Date(period.start_date).toLocaleDateString()} ·{" "}
            {new Date(period.end_date).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {period.is_current && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold uppercase text-emerald-700">
              Current
            </span>
          )}
          {isSelected && <Check className="h-3 w-3 text-slate-700" />}
        </div>
      </button>
    );
  }

  return items;
}

