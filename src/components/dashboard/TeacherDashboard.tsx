"use client";

import { useMemo, useState, type ElementType } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  useTeacherDailyLessons,
  useTeacherLessonSummary,
  useUpdateTeacherLessonStatus,
} from "@/domains/teacher-dashboard/hooks";
import { TeacherLessonSummary } from "@/domains/teacher-dashboard/types";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  CalendarDays,
  Clock3,
  BookOpen,
  CheckCircle2,
  PlayCircle,
  Layers3,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

function formatTimeRange(start: string, end: string) {
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${format(startDate, "HH:mm")} – ${format(endDate, "HH:mm")}`;
  } catch {
    return "--";
  }
}

function formatDateLabel(date: string) {
  try {
    return format(new Date(date), "EEEE, d MMMM yyyy");
  } catch {
    return date;
  }
}

function StatusBadge({ status }: { status: TeacherLessonSummary["status"] }) {
  const variants: Record<typeof status, { label: string; className: string }> = {
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
  return <Badge className={cn("text-xs font-medium", config.className)}>{config.label}</Badge>;
}

function AttendanceBadge({ status }: { status?: TeacherLessonSummary["attendance_status"] }) {
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
  return badge ? <Badge className={cn("text-xs", badge.className)}>{badge.label}</Badge> : null;
}

function SummaryTile({ label, value, icon: Icon }: { label: string; value: number; icon: ElementType }) {
  return (
    <Card className="border-none shadow-sm bg-white">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
          <Icon className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function LessonCard({ lesson, onSelect }: { lesson: TeacherLessonSummary; onSelect: (lesson: TeacherLessonSummary) => void }) {
  return (
    <button type="button" onClick={() => onSelect(lesson)} className="text-left">
      <Card className="border border-slate-200/80 shadow-sm transition-all duration-150 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300">
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-slate-900 line-clamp-1">
              {lesson.subject?.name ?? lesson.subject_name ?? "Untitled lesson"}
            </div>
            <StatusBadge status={lesson.status} />
          </div>
          <div className="text-sm text-slate-600 line-clamp-2 min-h-[1.5rem]">
            {lesson.title || lesson.description || "No description provided."}
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
            <AttendanceBadge status={lesson.attendance_status} />
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

export default function TeacherDashboard() {
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedLesson, setSelectedLesson] = useState<TeacherLessonSummary | null>(null);
  const { toast } = useToast();

  const { data, isLoading, isFetching } = useTeacherDailyLessons(selectedDate === today ? undefined : selectedDate);
  const { mutateAsync: updateStatus, isPending: statusUpdating } = useUpdateTeacherLessonStatus();
  const { data: detailedLesson, isLoading: detailLoading } = useTeacherLessonSummary(selectedLesson?.id);

  const lessons = data?.lessons ?? [];

  const summary = useMemo(() => {
    const total = lessons.length;
    const planned = lessons.filter((l) => l.status === "planned").length;
    const ongoing = lessons.filter((l) => l.status === "in_session").length;
    const completed = lessons.filter((l) => l.status === "completed").length;
    return { total, planned, ongoing, completed };
  }, [lessons]);

  const handleLessonAction = async (lesson: TeacherLessonSummary) => {
    if (lesson.status === "completed" || statusUpdating) return;

    try {
      let updatedLesson: TeacherLessonSummary | null = null;
      if (lesson.status === "planned") {
        updatedLesson = await updateStatus({ lessonId: lesson.id, payload: { status: "in_session" } });
        toast({ description: "Lesson started." });
      } else if (lesson.status === "in_session") {
        updatedLesson = await updateStatus({ lessonId: lesson.id, payload: { status: "completed" } });
        toast({ description: "Lesson completed." });
      }
      if (updatedLesson) {
        setSelectedLesson(updatedLesson);
      }
    } catch (error) {
      console.error(error);
      toast({ description: "Unable to update lesson status.", variant: "destructive" });
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Today&apos;s Lessons</h1>
          <p className="text-sm text-muted-foreground">{formatDateLabel(selectedDate)}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="date-picker">
            Date
          </label>
          <div className="relative">
            <input
              id="date-picker"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
            <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryTile label="Total" value={summary.total} icon={Layers3} />
        <SummaryTile label="Planned" value={summary.planned} icon={PlayCircle} />
        <SummaryTile label="In Session" value={summary.ongoing} icon={Clock3} />
        <SummaryTile label="Completed" value={summary.completed} icon={CheckCircle2} />
      </div>

      <div className="mt-6">
        <Card className="border border-slate-200/80 shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col gap-3 p-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-20 rounded-lg bg-slate-100/70 animate-pulse" />
                ))}
              </div>
            ) : lessons.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                <BookOpen className="h-12 w-12 text-slate-300" />
                <p className="text-base font-medium text-slate-700">No lessons scheduled</p>
                <p className="text-sm text-muted-foreground">Lessons for the selected date will appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 p-4">
                {lessons.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} onSelect={(selected) => setSelectedLesson(selected)} />
                ))}
              </div>
            )}

            {isFetching && !isLoading && (
              <div className="flex items-center gap-2 border-t border-slate-200 px-4 py-3 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Refreshing schedule…
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={!!selectedLesson} onOpenChange={(open) => !open && setSelectedLesson(null)}>
        <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
          {selectedLesson && (
            <LessonDetailContent
              lesson={detailedLesson ?? selectedLesson}
              loading={detailLoading}
              onUpdateStatus={handleLessonAction}
              statusUpdating={statusUpdating}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function LessonDetailContent({
  lesson,
  loading,
  onUpdateStatus,
  statusUpdating,
}: {
  lesson: TeacherLessonSummary;
  loading: boolean;
  onUpdateStatus: (lesson: TeacherLessonSummary) => Promise<void> | void;
  statusUpdating: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 py-4">
      <SheetHeader>
        <SheetTitle className="text-lg font-semibold text-slate-900">
          {lesson.subject?.name ?? lesson.subject_name ?? "Lesson details"}
        </SheetTitle>
        <SheetDescription className="text-sm text-muted-foreground">
          {lesson.title || "No additional description provided."}
        </SheetDescription>
      </SheetHeader>

      {loading ? (
        <div className="space-y-3">
          <div className="h-6 w-40 rounded bg-slate-100 animate-pulse" />
          <div className="h-20 rounded bg-slate-100 animate-pulse" />
          <div className="h-6 w-32 rounded bg-slate-100 animate-pulse" />
        </div>
      ) : (
        <div className="space-y-3 text-sm text-slate-600">
          <div className="grid gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-slate-500" />
              <span>{formatTimeRange(lesson.scheduled_start, lesson.scheduled_end)}</span>
            </div>
            {lesson.actual_start && (
              <div className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-slate-500" />
                <span>Started {format(new Date(lesson.actual_start), "HH:mm")}</span>
              </div>
            )}
            {lesson.actual_end && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-slate-500" />
                <span>Completed {format(new Date(lesson.actual_end), "HH:mm")}</span>
              </div>
            )}
            {lesson.class?.name && (
              <div className="flex items-center gap-2">
                <Layers3 className="h-4 w-4 text-slate-500" />
                <span>{lesson.class.name}</span>
              </div>
            )}
          </div>
          {lesson.notes && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs leading-relaxed text-slate-600">
              {lesson.notes}
            </div>
          )}
          {lesson.objectives.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Objectives</p>
              <ul className="list-disc space-y-1 pl-4 text-xs text-slate-600">
                {lesson.objectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </div>
          )}
          {lesson.materials.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Materials</p>
              <ul className="space-y-1 text-xs text-slate-600">
                {lesson.materials.map((material, index) => (
                  <li key={index} className="rounded border border-slate-200 bg-white px-3 py-2">
                    {typeof material === "string" ? material : JSON.stringify(material)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <StatusBadge status={lesson.status} />
            <AttendanceBadge status={lesson.attendance_status} />
          </div>
        </div>
      )}

      <Separator />

      <div className="flex flex-col gap-2">
        {lesson.status === "planned" && (
          <Button onClick={() => onUpdateStatus(lesson)} className="w-full" disabled={statusUpdating}>
            {statusUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
            Start lesson
          </Button>
        )}
        {lesson.status === "in_session" && (
          <Button onClick={() => onUpdateStatus(lesson)} className="w-full" disabled={statusUpdating}>
            {statusUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Mark as completed
          </Button>
        )}
        {lesson.status === "completed" && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            This lesson is already completed.
          </div>
        )}
        {lesson.status === "cancelled" && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            This lesson has been cancelled.
          </div>
        )}
      </div>
    </div>
  );
}
