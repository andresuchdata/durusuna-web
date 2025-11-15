"use client";

import { useMemo } from "react";
import { Calendar as CalendarIcon, Plus, Search } from "lucide-react";
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
import { useClasses } from "@/domains/classes/hooks";
import { useContacts } from "@/domains/users/hooks";
import { useSubjects } from "@/domains/subjects/hooks";
import type { LessonInstanceStatus } from "@/domains/lessons/types";
import type { DateRange } from "react-day-picker";

const STATUS_OPTIONS: Array<{ label: string; value: LessonInstanceStatus | "all" }> = [
  { label: "All statuses", value: "all" },
  { label: "Planned", value: "planned" },
  { label: "In session", value: "in_session" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

type LessonsToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  status: LessonInstanceStatus | "all";
  onStatusChange: (value: LessonInstanceStatus | "all") => void;
  classId?: string;
  onClassChange: (value?: string) => void;
  subjectId?: string;
  onSubjectChange: (value?: string) => void;
  teacherId?: string;
  onTeacherChange: (value?: string) => void;
  fromDate?: Date;
  toDate?: Date;
  onFromDateChange: (value?: Date) => void;
  onToDateChange: (value?: Date) => void;
  canCreate: boolean;
  onCreate: () => void;
};

export function LessonsToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  classId,
  onClassChange,
  subjectId,
  onSubjectChange,
  teacherId,
  onTeacherChange,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  canCreate,
  onCreate,
}: LessonsToolbarProps) {
  const classesQuery = useClasses({ is_active: true });
  const teachersQuery = useContacts({ userType: "teacher", limit: 100 });
  const subjectsQuery = useSubjects();

  const teachers = teachersQuery.data?.contacts ?? [];
  const subjects = subjectsQuery.data?.subjects ?? [];

  const selectedDateLabel = useMemo(() => {
    if (fromDate && toDate) {
      return `${format(fromDate, "MMM dd, yyyy")} - ${format(toDate, "MMM dd, yyyy")}`;
    }
    if (fromDate) {
      return format(fromDate, "MMM dd, yyyy");
    }
    if (toDate) {
      return format(toDate, "MMM dd, yyyy");
    }
    return "Scheduled date range";
  }, [fromDate, toDate]);

  const handleDateSelect = (range: DateRange | undefined) => {
    if (!range) {
      onFromDateChange(undefined);
      onToDateChange(undefined);
      return;
    }
    onFromDateChange(range.from ?? undefined);
    onToDateChange(range.to ?? (range.from ? range.from : undefined));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 bg-white">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by title"
            className="pl-9"
          />
        </div>
        {canCreate && (
          <Button onClick={onCreate} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Create lesson
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={status} onValueChange={(value) => onStatusChange(value as LessonsToolbarProps["status"]) }>
          <SelectTrigger className="w-[160px] bg-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={classId ?? "all"}
          onValueChange={(value) => {
            const nextValue = value === "all" ? undefined : value;
            onClassChange(nextValue);
          }}
        >
          <SelectTrigger className="w-[200px] bg-white">
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {classesQuery.data?.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={subjectId ?? "all"}
          onValueChange={(value) => onSubjectChange(value === "all" ? undefined : value)}
          disabled={subjectsQuery.isLoading}
        >
          <SelectTrigger className="w-[200px] bg-white">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={teacherId ?? "all"}
          onValueChange={(value) => onTeacherChange(value === "all" ? undefined : value)}
        >
          <SelectTrigger className="w-[200px] bg-white">
            <SelectValue placeholder="Teacher" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All teachers</SelectItem>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {`${teacher.first_name ?? ""} ${teacher.last_name ?? ""}`.trim() || teacher.email || "Teacher"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[250px] justify-start text-left font-normal bg-white",
                !fromDate && !toDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDateLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              selected={{ from: fromDate, to: toDate }}
              onSelect={handleDateSelect}
              numberOfMonths={2}
            />
            {(fromDate || toDate) && (
              <div className="border-t p-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    onFromDateChange(undefined);
                    onToDateChange(undefined);
                  }}
                >
                  Clear range
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
