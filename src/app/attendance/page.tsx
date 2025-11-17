"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import AppLayout from "@/components/layout/AppLayout";
import { useProfile } from "@/domains/auth/hooks";
import { useTeacherDailyLessons } from "@/domains/teacher-dashboard/hooks";
import type { TeacherLessonSummary } from "@/domains/teacher-dashboard/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Clock3, Layers3, ListChecks } from "lucide-react";

function formatDateLabel(date: string) {
  try {
    return format(new Date(date), "EEEE, d MMMM yyyy");
  } catch {
    return date;
  }
}

function formatTimeRange(start: string, end: string) {
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${format(startDate, "HH:mm")} – ${format(endDate, "HH:mm")}`;
  } catch {
    return "--";
  }
}

function LessonStatusBadge({ status }: { status: TeacherLessonSummary["status"] }) {
  const variants: Record<TeacherLessonSummary["status"], { label: string; className: string }> = {
    planned: {
      label: "Planned",
      className: "bg-slate-100 text-slate-700 border-slate-200",
    },
    in_session: {
      label: "In Session",
      className: "bg-blue-100 text-blue-700 border-blue-200",
    },
    completed: {
      label: "Completed",
      className: "bg-green-100 text-green-700 border-green-200",
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-rose-100 text-rose-700 border-rose-200",
    },
  };

  const config = variants[status];
  return <Badge className={`text-xs font-medium ${config.className}`}>{config.label}</Badge>;
}

function AttendanceStatusBadge({ status }: { status?: TeacherLessonSummary["attendance_status"] }) {
  if (!status) return null;

  const config: Record<string, { label: string; className: string }> = {
    not_started: {
      label: "Attendance Pending",
      className: "bg-amber-100 text-amber-700 border-amber-200",
    },
    in_progress: {
      label: "Attendance Open",
      className: "bg-blue-100 text-blue-700 border-blue-200",
    },
    finalized: {
      label: "Attendance Finalized",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
  };

  const badge = config[status];
  if (!badge) return null;

  return <Badge className={`text-xs ${badge.className}`}>{badge.label}</Badge>;
}

function LessonAttendanceCard({ lesson, onOpen }: { lesson: TeacherLessonSummary; onOpen: () => void }) {
  const attendanceStatusText = lesson.attendance_status === "not_started"
    ? "Attendance not started"
    : lesson.attendance_status === "in_progress"
    ? "Attendance in progress"
    : lesson.attendance_status === "finalized"
    ? "Attendance finalized"
    : "Attendance status unavailable";

  const primaryCtaLabel =
    lesson.attendance_status === "not_started" || !lesson.attendance_status ? "Take attendance" : "Open attendance";

  return (
    <Card className="border border-slate-200/80 bg-white/90 shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {lesson.subject?.name ?? lesson.subject_name ?? "Lesson"}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {lesson.title || lesson.description || "No additional description."}
            </p>
          </div>
          <LessonStatusBadge status={lesson.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5" />
            {formatTimeRange(lesson.scheduled_start, lesson.scheduled_end)}
          </span>
          {lesson.class?.name && (
            <span className="inline-flex items-center gap-1">
              <Layers3 className="h-3.5 w-3.5" />
              {lesson.class.name}
            </span>
          )}
          <AttendanceStatusBadge status={lesson.attendance_status} />
        </div>
        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] text-muted-foreground">{attendanceStatusText}</p>
          <Button type="button" size="sm" variant="outline" onClick={onOpen}>
            <ListChecks className="mr-1.5 h-3.5 w-3.5" />
            <span className="text-xs font-medium">{primaryCtaLabel}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AttendancePage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const router = useRouter();

  const role =
    (profile?.user_type as "teacher" | "student" | "parent" | "admin" | undefined) ??
    (profile?.role === "admin" ? "admin" : undefined);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [currentDate, setCurrentDate] = useState(today);
  const [visibleStartDate, setVisibleStartDate] = useState(today);

  const { data, isLoading: lessonsLoading, isFetching } = useTeacherDailyLessons(
    currentDate === today ? undefined : currentDate
  );

  const lessons = data?.lessons ?? [];

  const dateStripDays = useMemo(() => {
    const start = new Date(visibleStartDate);
    return Array.from({ length: 7 }, (_, index) => {
      const d = new Date(start);
      d.setDate(start.getDate() + index);
      return d.toISOString().slice(0, 10);
    });
  }, [visibleStartDate]);

  const handleShiftDay = (delta: number) => {
    const current = new Date(currentDate);
    current.setDate(current.getDate() + delta);
    const nextDate = current.toISOString().slice(0, 10);
    setCurrentDate(nextDate);

    const start = new Date(visibleStartDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const next = new Date(nextDate);
    if (next < start || next > end) {
      setVisibleStartDate(nextDate);
    }
  };

  const isTeacher = role === "teacher" || role === "admin";

  const isLoadingInitial = profileLoading || lessonsLoading;

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-sky-50">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 md:py-8 space-y-6">
          {isTeacher ? (
            <>
              <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-sm">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">Teacher Attendance</p>
                    <h1 className="text-2xl font-semibold text-slate-900">Today's attendance</h1>
                    <p className="text-xs text-muted-foreground">
                      See and update attendance for the lessons you teach on a given day.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-stretch md:items-end">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Selected date</p>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm">
                    <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
                    <span>{formatDateLabel(currentDate)}</span>
                  </div>
                </div>
              </header>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>Pick a day to view its lessons.</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleShiftDay(-1)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95"
                      aria-label="Previous day"
                    >
                      <span className="sr-only">Previous day</span>
                      <span className="text-xs">&#x276E;</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShiftDay(1)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95"
                      aria-label="Next day"
                    >
                      <span className="sr-only">Next day</span>
                      <span className="text-xs">&#x276F;</span>
                    </button>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white/70 px-2 py-2">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white via-transparent to-white opacity-60" />
                  <div className="relative flex gap-1">
                    {dateStripDays.map((dateStr) => {
                      const isActive = dateStr === currentDate;
                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => setCurrentDate(dateStr)}
                          className={`flex-1 min-w-[3rem] rounded-lg border px-2 py-1.5 text-center text-xs transition-all duration-200 ease-out ${
                            isActive
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm scale-[1.02]"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <span className="block text-[10px] uppercase tracking-wide opacity-80">
                            {format(new Date(dateStr), "EEE")}
                          </span>
                          <span className="block text-sm font-semibold leading-tight">
                            {format(new Date(dateStr), "d")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <Card className="border border-slate-200/80 bg-white/90 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  {isLoadingInitial ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-20 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : lessons.length === 0 ? (
                    <div className="py-10 flex flex-col items-center justify-center text-center gap-3">
                      <CalendarDays className="h-10 w-10 text-slate-300" />
                      <p className="text-sm font-medium text-slate-800">No lessons for this day</p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Choose another date to see lessons and manage attendance.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lessons.map((lesson) => (
                        <LessonAttendanceCard
                          key={lesson.id}
                          lesson={lesson}
                          onOpen={() => router.push(`/attendance/${lesson.id}`)}
                        />
                      ))}
                    </div>
                  )}

                  {isFetching && !isLoadingInitial && (
                    <div className="pt-3 text-[11px] text-muted-foreground flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-slate-300 animate-pulse" />
                      <span>Refreshing lessons – Latest schedule will appear shortly.</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="container mx-auto p-4 md:p-6">
              <h1 className="text-2xl md:text-3xl font-bold mb-3">Attendance</h1>
              <p className="text-sm text-muted-foreground">
                Attendance views for students and parents will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
