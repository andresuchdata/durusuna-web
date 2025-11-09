"use client";

import { ChangeEvent } from "react";
import { Plus, Upload, Search, Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type UserToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  userType: "all" | "teacher" | "student" | "parent" | "admin";
  onUserTypeChange: (value: "all" | "teacher" | "student" | "parent" | "admin") => void;
  isActive?: boolean | null;
  onIsActiveChange: (value: boolean | null) => void;
  dobFrom?: Date;
  dobTo?: Date;
  onDobFromChange: (date: Date | undefined) => void;
  onDobToChange: (date: Date | undefined) => void;
  canCreate: boolean;
  onCreate?: () => void;
  onBatchCreate?: () => void;
};

const USER_TYPE_OPTIONS: Array<{ label: string; value: "all" | "teacher" | "student" | "parent" | "admin" }> = [
  { label: "All", value: "all" },
  { label: "Teachers", value: "teacher" },
  { label: "Students", value: "student" },
  { label: "Parents", value: "parent" },
  { label: "Admins", value: "admin" },
];

const STATUS_OPTIONS: Array<{ label: string; value: boolean | null }> = [
  { label: "All", value: null },
  { label: "Active", value: true },
  { label: "Inactive", value: false },
];

export function UserToolbar({
  search,
  onSearchChange,
  userType,
  onUserTypeChange,
  isActive,
  onIsActiveChange,
  dobFrom,
  dobTo,
  onDobFromChange,
  onDobToChange,
  canCreate,
  onCreate,
  onBatchCreate,
}: UserToolbarProps) {
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  const clearDateRange = () => {
    onDobFromChange(undefined);
    onDobToChange(undefined);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1 bg-white">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by name, email, or phone"
              className="pl-9"
            />
          </div>
        </div>

        {canCreate && (
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" onClick={onBatchCreate} className="hidden md:inline-flex">
              <Upload className="mr-2 h-4 w-4" />
              Batch Create
            </Button>
            <Button onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New User
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={userType} onValueChange={(value) => onUserTypeChange(value as typeof userType)}>
          <SelectTrigger className="w-[150px] bg-white">
            <SelectValue placeholder="User Type" />
          </SelectTrigger>
          <SelectContent>
            {USER_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={isActive === null ? "all" : isActive ? "active" : "inactive"}
          onValueChange={(value) => {
            if (value === "all") onIsActiveChange(null);
            else onIsActiveChange(value === "active");
          }}
        >
          <SelectTrigger className="w-[130px] bg-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem
                key={option.value === null ? "all" : option.value ? "active" : "inactive"}
                value={option.value === null ? "all" : option.value ? "active" : "inactive"}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[280px] justify-start text-left font-normal bg-white",
                !dobFrom && !dobTo && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dobFrom && dobTo ? (
                <>
                  {format(dobFrom, "MMM dd, yyyy")} - {format(dobTo, "MMM dd, yyyy")}
                </>
              ) : dobFrom ? (
                format(dobFrom, "MMM dd, yyyy")
              ) : (
                <span>Birth Date Range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: dobFrom, to: dobTo }}
              onSelect={(range) => {
                if (range?.from) {
                  onDobFromChange(range.from);
                }
                if (range?.to) {
                  onDobToChange(range.to);
                }
              }}
              numberOfMonths={2}
            />
            {(dobFrom || dobTo) && (
              <div className="border-t p-3">
                <Button variant="outline" size="sm" onClick={clearDateRange} className="w-full">
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
