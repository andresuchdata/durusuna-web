"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useProfile } from "@/domains/auth/hooks";
import { useClasses, useCheckStudentsEnrollment } from "@/domains/classes/hooks";
import { useLessonInstancesByClass, useLessonInstancesByClassWithAttendance } from "@/domains/lessons/hooks";
import { useParentChildren } from "@/domains/attendance/hooks";
import type { AttendanceStatus } from "@/domains/attendance/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BookOpen, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, GraduationCap, Layers3, PlayCircle, Users } from "lucide-react";
import { format } from "date-fns";
import type { LessonInstance, LessonInstanceStatus } from "@/domains/lessons/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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

function LessonStatusBadge({ status }: { status: LessonInstance["status"] }) {
  const map: Record<LessonInstance["status"], { label: string; className: string }> = {
    planned: {
      label: "Planned",
      className: "bg-slate-100 text-slate-700 border-slate-200",
    },
    in_session: {
      label: "In session",
      className: "bg-blue-100 text-blue-700 border-blue-200",
    },
    completed: {
      label: "Completed",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-rose-100 text-rose-700 border-rose-200",
    },
  };

  const cfg = map[status];
  return (
    <Badge variant="outline" className={`text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}

function AttendanceStatusBadge({ status }: { status: AttendanceStatus | "not_taken" }) {
  const map: Record<AttendanceStatus | "not_taken", { label: string; className: string }> = {
    present: {
      label: "Present",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    absent: {
      label: "Absent",
      className: "bg-rose-100 text-rose-700 border-rose-200",
    },
    excused: {
      label: "Excused",
      className: "bg-sky-100 text-sky-700 border-sky-200",
    },
    late: {
      label: "Late",
      className: "bg-amber-100 text-amber-700 border-amber-200",
    },
    not_taken: {
      label: "Not yet taken",
      className: "bg-slate-100 text-slate-600 border-slate-200",
    },
  };
  const config = map[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

function LessonCard({ 
  lesson, 
  attendanceStatus, 
  role,
  onClick 
}: { 
  lesson: LessonInstance; 
  attendanceStatus?: AttendanceStatus | "not_taken";
  role?: "parent" | "student";
  onClick: () => void;
}) {
  const showAttendance = (role === "parent" || role === "student") && lesson.status === "completed";
  
  return (
    <Card 
      className="border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">{lesson.title || "Lesson"}</p>
            {lesson.description && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{lesson.description}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {showAttendance && attendanceStatus ? (
              <AttendanceStatusBadge status={attendanceStatus} />
            ) : (
              <LessonStatusBadge status={lesson.status} />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock3 className="h-3.5 w-3.5" />
          <span>{formatTimeRange(lesson.scheduled_start, lesson.scheduled_end)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function LessonDetailContent({
  lesson,
  onClose,
  role,
  attendanceStatus,
}: {
  lesson: LessonInstance;
  onClose: () => void;
  role?: string;
  attendanceStatus?: AttendanceStatus | "not_taken";
}) {
  const showAttendance = (role === "parent" || role === "student") && lesson.status === "completed";
  const hasObjectives = Array.isArray(lesson.objectives) && lesson.objectives.length > 0;
  const hasMaterials = Array.isArray(lesson.materials) && lesson.materials.length > 0;
  const hasNotes = typeof lesson.notes === "string" && lesson.notes.trim().length > 0;
  const showCancellationReason = lesson.status === "cancelled" && lesson.cancellation_reason;

  return (
    <SheetContent className="w-full max-w-md sm:max-w-xl overflow-y-auto">
      <SheetHeader className="mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <SheetTitle className="text-left text-lg font-semibold text-slate-900">
              {lesson.title || "Lesson details"}
            </SheetTitle>
            <SheetDescription className="text-left text-sm text-muted-foreground">
              {formatDateLabel(lesson.scheduled_start)}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="space-y-6 text-sm text-slate-700">
        <div className="grid gap-4 rounded-xl border border-slate-200/70 bg-white/70 p-4 text-xs text-slate-600 md:grid-cols-2">
          <div className="space-y-1">
            <p className="font-medium uppercase tracking-wide text-[11px] text-muted-foreground">Schedule</p>
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-slate-500" />
              <span>{formatTimeRange(lesson.scheduled_start, lesson.scheduled_end)}</span>
            </div>
            {lesson.actual_start && (
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <PlayCircle className="h-3.5 w-3.5" />
                <span>Started {format(new Date(lesson.actual_start), "HH:mm")}</span>
              </div>
            )}
            {lesson.actual_end && (
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Completed {format(new Date(lesson.actual_end), "HH:mm")}</span>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="font-medium uppercase tracking-wide text-[11px] text-muted-foreground">Status</p>
            <div className="flex flex-wrap items-center gap-2">
              <LessonStatusBadge status={lesson.status} />
              {showAttendance && attendanceStatus && (
                <AttendanceStatusBadge status={attendanceStatus} />
              )}
            </div>
            {showCancellationReason && (
              <p className="text-[11px] text-rose-600">Reason: {lesson.cancellation_reason}</p>
            )}
          </div>
        </div>

        {lesson.description && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</p>
            <p className="leading-relaxed text-slate-700">{lesson.description}</p>
          </div>
        )}

        {hasNotes && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs leading-relaxed text-slate-600">
              {lesson.notes}
            </div>
          </div>
        )}

        {hasObjectives && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Objectives</p>
            <ul className="list-disc space-y-1 pl-4 text-xs text-slate-600">
              {lesson.objectives.map((objective, index) => (
                <li key={`${objective}-${index}`}>{objective}</li>
              ))}
            </ul>
          </div>
        )}

        {hasMaterials && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Materials</p>
            <ul className="space-y-2 text-xs text-slate-600">
              {lesson.materials.map((material, index) => (
                <li
                  key={index}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  {typeof material === "string"
                    ? material
                    : JSON.stringify(material, null, 2)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {showAttendance && attendanceStatus && attendanceStatus !== "not_taken" && (
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Attendance</p>
            <div className="flex items-center gap-2">
              <span>
                Marked as
                <span className="ml-1 font-semibold capitalize">
                  {attendanceStatus}
                </span>
              </span>
            </div>
          </div>
        )}

        <div className="grid gap-2 rounded-lg border border-slate-100 bg-white/60 p-3 text-[11px] text-muted-foreground">
          <div className="flex justify-between">
            <span>Lesson ID</span>
            <span className="font-mono text-slate-600">{lesson.id}</span>
          </div>
          {lesson.schedule_slot_id && (
            <div className="flex justify-between">
              <span>Schedule slot</span>
              <span className="font-mono text-slate-600">{lesson.schedule_slot_id}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Created</span>
            <span>{format(new Date(lesson.created_at), "d MMM yyyy HH:mm")}</span>
          </div>
          <div className="flex justify-between">
            <span>Updated</span>
            <span>{format(new Date(lesson.updated_at), "d MMM yyyy HH:mm")}</span>
          </div>
        </div>
      </div>
    </SheetContent>
  );
}

export default function LessonsPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [currentDate, setCurrentDate] = useState(today);
  const [visibleStartDate, setVisibleStartDate] = useState(today);
  const [statusFilter, setStatusFilter] = useState<LessonInstanceStatus | "all">("all");
  const [selectedLesson, setSelectedLesson] = useState<{
    lesson: LessonInstance;
    attendanceStatus?: AttendanceStatus | "not_taken";
  } | null>(null);

  const classesQuery = useClasses();
  const classes = classesQuery.data ?? [];
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const role = profile?.user_type;
  const userId = profile?.id;

  // Use appropriate hook based on user role
  const lessonsQuery = (role === "student" || role === "parent")
    ? useLessonInstancesByClassWithAttendance(selectedClassId, userId, role)
    : useLessonInstancesByClass(selectedClassId);
  
  const allLessons: LessonInstance[] = lessonsQuery.data ?? [];

  // Fetch parent's children
  const parentChildrenQuery = useParentChildren(role);
  const children = parentChildrenQuery.data ?? [];

  // Get child IDs for enrollment checking
  const childIds = useMemo(() => {
    if (role !== "parent") return [];
    return children.map((child: any) => child.id);
  }, [role, children]);

  // Check enrollment of parent's children in the selected class
  const enrollmentCheckQuery = useCheckStudentsEnrollment(selectedClassId, childIds);
  const enrolledStudents = enrollmentCheckQuery.data?.enrolled_students ?? [];

  // Filter children to only include those enrolled in the selected class
  const enrolledChildren = useMemo(() => {
    if (role !== "parent") return [];
    
    const enrolledStudentIds = new Set(enrolledStudents.map((student: any) => student.student_id));
    return children.filter((child: any) => enrolledStudentIds.has(child.id));
  }, [role, children, enrolledStudents]);

  const dateStripDays = useMemo(() => {
    const start = new Date(visibleStartDate);
    return Array.from({ length: 7 }, (_, index) => {
      const d = new Date(start);
      d.setDate(start.getDate() + index);
      return d.toISOString().slice(0, 10);
    });
  }, [visibleStartDate]);

  const filteredLessons = useMemo(
    () =>
      allLessons.filter((lesson) => {
        try {
          const dateStr = new Date(lesson.scheduled_start).toISOString().slice(0, 10);
          if (dateStr !== currentDate) return false;
          if (statusFilter !== "all" && lesson.status !== statusFilter) return false;
          return true;
        } catch {
          return false;
        }
      }),
    [allLessons, currentDate, statusFilter]
  );

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

  const isLoadingInitial = profileLoading || classesQuery.isLoading;

  if (isLoadingInitial) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-sky-50">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 md:py-8 space-y-6">
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
              <div className="flex flex-col gap-2 items-stretch md:items-end">
                <Skeleton className="h-3 w-16" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-32" />
                </div>
              </div>
            </header>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-40" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <Skeleton className="h-7 w-7 rounded-full" />
                </div>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 7 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Skeleton className="h-3 w-24" />
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-7 w-24 rounded-full" />
                ))}
              </div>
            </div>

            <Card className="border border-slate-200/80 bg-white/90 shadow-sm">
              <CardContent className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full rounded-lg" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  const headerPill =
    role === "parent"
      ? "Parent · Lessons"
      : role === "teacher"
      ? "Teacher · Lessons"
      : role === "student"
      ? "Student · Lessons"
      : "Lessons";

  const headerTitle =
    role === "parent"
      ? "Lessons across classes"
      : "Your lesson schedule";

  const headerSubtitle =
    role === "parent"
      ? "Pick a class and date to see what was taught. Classes are shown once even if multiple children are in the same class."
      : "Pick a class and day, then filter by lesson status.";

  const HeaderIcon = role === "parent" ? Users : GraduationCap;

  const noClassesBody =
    role === "parent"
      ? "Once your children are enrolled in classes, you will see their lessons grouped by class here."
      : role === "student"
      ? "Once you are enrolled in classes, you will see their lessons here."
      : role === "teacher"
      ? "Once your teaching classes are set up, you will see their lessons here."
      : "Once classes are available, you will see their lessons here.";

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-sky-50">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 md:py-8 space-y-6">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-sm">
                <HeaderIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">{headerPill}</p>
                <h1 className="text-2xl font-semibold text-slate-900">{headerTitle}</h1>
                <p className="text-xs text-muted-foreground">{headerSubtitle}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-stretch md:items-end">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Filters</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-muted-foreground">Status</span>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as LessonInstanceStatus | "all")}
                    className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="all">All statuses</option>
                    <option value="planned">Planned</option>
                    <option value="in_session">In session</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </header>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{formatDateLabel(currentDate)}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleShiftDay(-1)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95"
                  aria-label="Previous day"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftDay(1)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95"
                  aria-label="Next day"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
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

          {classes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Classes</p>
                {selectedClassId && (
                  <p className="text-xs text-muted-foreground">
                    Showing {filteredLessons.length} lesson{filteredLessons.length === 1 ? "" : "s"} on {formatDateLabel(currentDate)}
                  </p>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {classes.map((cls) => {
                  const isActive = cls.id === selectedClassId;
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => setSelectedClassId(cls.id)}
                      className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-all ${
                        isActive
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {cls.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {classes.length === 0 && (
            <Card className="border-dashed border-slate-300 bg-white/80">
              <CardContent className="py-10 flex flex-col items-center justify-center text-center gap-3">
                <BookOpen className="h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-800">No classes found</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {noClassesBody}
                </p>
              </CardContent>
            </Card>
          )}

          {classes.length > 0 && (
            <Card className="border border-slate-200/80 bg-white/90 shadow-sm">
              <CardContent className="p-4">
                {lessonsQuery.isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-20 w-full rounded-lg" />
                    ))}
                  </div>
                ) : filteredLessons.length === 0 ? (
                  <div className="py-10 flex flex-col items-center justify-center text-center gap-3">
                    <BookOpen className="h-10 w-10 text-slate-300" />
                    <p className="text-sm font-medium text-slate-800">No lessons for this day</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Choose another date or class to see scheduled lessons.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredLessons.map((lesson) => {
                      // For students and parents, attendance is already included in the lesson data
                      const attendanceStatus = (role === "student" || role === "parent") 
                        ? (lesson as any).attendance_status ?? "not_taken"
                        : "not_taken";
                      
                      return (
                        <div key={lesson.id}>
                          <LessonCard 
                            lesson={lesson} 
                            attendanceStatus={attendanceStatus}
                            role={role as "parent" | "student"}
                            onClick={() => setSelectedLesson({ lesson, attendanceStatus })}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Sheet 
        open={!!selectedLesson} 
        onOpenChange={(open) => !open && setSelectedLesson(null)}
      >
        {selectedLesson && (
          <LessonDetailContent 
            lesson={selectedLesson.lesson} 
            onClose={() => setSelectedLesson(null)}
            role={role}
            attendanceStatus={selectedLesson.attendanceStatus}
          />
        )}
      </Sheet>
    </AppLayout>
  );
}
