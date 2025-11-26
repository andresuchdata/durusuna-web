"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import AppLayout from "@/components/layout/AppLayout";
import { useProfile } from "@/domains/auth/hooks";
import { useTeacherLessonSummary } from "@/domains/teacher-dashboard/hooks";
import {
  useBulkUpdateAttendance,
  useFinalizeAttendanceSession,
  useOpenAttendanceSession,
  useSubmitTeacherAttendance,
  useTeacherAttendanceStatus,
} from "@/domains/attendance/hooks";
import type { AttendanceStatus } from "@/domains/attendance/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Layers3,
  ListChecks,
  Users,
} from "lucide-react";

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

function LessonStatusBadge({ status }: { status: "planned" | "in_session" | "completed" | "cancelled" }) {
  const variants: Record<"planned" | "in_session" | "completed" | "cancelled", { label: string; className: string }> = {
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

function StudentStatusPill({
  value,
  onChange,
}: {
  value: AttendanceStatus | undefined;
  onChange: (status: AttendanceStatus) => void;
}) {
  const options: { value: AttendanceStatus; label: string; className: string }[] = [
    {
      value: "present",
      label: "P",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    {
      value: "absent",
      label: "A",
      className: "bg-rose-100 text-rose-700 border-rose-200",
    },
    {
      value: "excused",
      label: "E",
      className: "bg-sky-100 text-sky-700 border-sky-200",
    },
    {
      value: "late",
      label: "L",
      className: "bg-amber-100 text-amber-700 border-amber-200",
    },
  ];

  return (
    <div className="inline-flex rounded-full bg-slate-50 p-0.5 border border-slate-200">
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`h-7 w-7 rounded-full border text-[11px] font-semibold flex items-center justify-center transition-all ${
              isActive
                ? opt.className + " shadow-sm scale-105"
                : "bg-white text-slate-500 border-transparent hover:bg-slate-50"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function LessonAttendanceDetailPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = params?.lessonId as string | undefined;
  const router = useRouter();

  const { data: profile } = useProfile();
  const lessonQuery = useTeacherLessonSummary(lessonId);

  const lesson = lessonQuery.data;

  const sessionDate = useMemo(() => {
    if (!lesson?.scheduled_start) return undefined;
    try {
      const d = new Date(lesson.scheduled_start);
      return d.toISOString().split("T")[0];
    } catch {
      return undefined;
    }
  }, [lesson?.scheduled_start]);

  const classId = lesson?.class?.id ?? null;

  const sessionQuery = useOpenAttendanceSession(classId ?? undefined, sessionDate, lessonId);
  const bulkMutation = useBulkUpdateAttendance();
  const teacherAttendanceQuery = useTeacherAttendanceStatus(sessionDate);
  const submitTeacherAttendanceMutation = useSubmitTeacherAttendance();
  const finalizeMutation = useFinalizeAttendanceSession();

  const [localStatuses, setLocalStatuses] = useState<Record<string, AttendanceStatus | undefined>>({});
  const [activeTab, setActiveTab] = useState<"students" | "teacher">("students");
  const [teacherStatusChoice, setTeacherStatusChoice] = useState<AttendanceStatus | undefined>(undefined);

  const students = sessionQuery.data?.students ?? [];
  const teacherAttendance = teacherAttendanceQuery.data?.attendance ?? null;

  const currentTeacherStatus: AttendanceStatus | undefined =
    teacherStatusChoice ?? teacherAttendance?.status ?? undefined;
  const isSessionFinalized = sessionQuery.data?.session.is_finalized ?? false;

  const isTeacherOrAdmin = profile?.user_type === "teacher" || profile?.role === "admin";

  const isLoadingInitial = lessonQuery.isLoading || sessionQuery.isLoading;

  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setLocalStatuses((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAllPresent = () => {
    const next: Record<string, AttendanceStatus> = {};
    for (const s of students) {
      next[s.user_id] = "present";
    }
    setLocalStatuses(next);
  };

  const handleSubmitMyAttendance = async () => {
    if (!sessionDate) return;
    const status = teacherStatusChoice;
    if (!status) return;

    await submitTeacherAttendanceMutation.mutateAsync({
      date: sessionDate,
      status,
      marked_via: "manual",
    });

    await teacherAttendanceQuery.refetch();
  };

  const handleFinalize = async () => {
    if (!sessionDate || !classId) return;

    await finalizeMutation.mutateAsync({
      classId,
      payload: { date: sessionDate },
    });

    await sessionQuery.refetch();
  };

  const handleSave = async () => {
    if (!sessionDate || !classId || students.length === 0) return;

    const records = students
      .map((s): { student_id: string; status: AttendanceStatus; notes?: string } | null => {
        const status = localStatuses[s.user_id] ?? s.attendance?.status;
        if (!status) return null;
        const notes = s.attendance?.notes ?? undefined;
        return notes != null
          ? { student_id: s.user_id, status, notes }
          : { student_id: s.user_id, status };
      })
      .filter((r): r is { student_id: string; status: AttendanceStatus; notes?: string } => r !== null);

    if (records.length === 0) return;

    await bulkMutation.mutateAsync({
      classId,
      payload: {
        date: sessionDate,
        records,
        marked_via: "manual",
      },
    });
  };

  if (!lessonId) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
          No lesson id provided.
        </div>
      </AppLayout>
    );
  }

  if (!isTeacherOrAdmin) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="flex max-w-md flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <p className="text-sm font-medium text-slate-900">Attendance is only available for teachers and admins.</p>
            <Button size="sm" variant="outline" onClick={() => router.push("/attendance")}>Back to attendance</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (lessonQuery.error || (!lesson && !lessonQuery.isLoading)) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="flex max-w-md flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-sm font-medium text-slate-900">Failed to load lesson attendance.</p>
            <p className="text-xs text-muted-foreground">This lesson may have been removed or you don&apos;t have access to it.</p>
            <Button size="sm" variant="outline" onClick={() => router.push("/attendance")}>
              Back to attendance
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-sky-50">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 md:py-8 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="inline-flex items-center gap-1"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-xs">Back</span>
            </Button>
          </div>

          <Card className="border border-slate-200/80 bg-white/90 shadow-sm">
            <CardContent className="space-y-3 p-4">
              {isLoadingInitial || !lesson ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                        Attendance · {lesson.subject?.name ?? lesson.subject_name ?? "Subject"}
                      </p>
                      <h1 className="text-lg font-semibold text-slate-900 md:text-xl">
                        {lesson.title || lesson.description || "Lesson attendance"}
                      </h1>
                      <p className="text-xs text-muted-foreground">
                        {lesson.class?.name ?? lesson.class_name ?? "Class"}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-2 text-xs md:items-end">
                      <LessonStatusBadge status={lesson.status} />
                      {lesson.scheduled_start && lesson.scheduled_end && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock3 className="h-3.5 w-3.5" />
                          <span>{formatTimeRange(lesson.scheduled_start, lesson.scheduled_end)}</span>
                        </div>
                      )}
                      {sessionDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" />
                          <span>{formatDateLabel(sessionDate)}</span>
                        </div>
                      )}
                      {lesson.class?.name && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Layers3 className="h-3.5 w-3.5" />
                          <span>{lesson.class.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {sessionQuery.data && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <ListChecks className="h-3.5 w-3.5" />
                        <span>
                          Attendance session {sessionQuery.data.session.is_finalized ? "finalized" : "open"}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>
                          {sessionQuery.data.students.length} students
                        </span>
                      </span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center gap-2 text-xs">
            <div className="inline-flex rounded-full bg-slate-100 p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("students")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  activeTab === "students"
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Students
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("teacher")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  activeTab === "teacher"
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                My attendance
              </button>
            </div>
          </div>

          {activeTab === "teacher" && (
            <Card className="border border-slate-200/80 bg-white/90 shadow-sm">
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">My attendance for this day</p>
                    <p className="text-[11px] text-muted-foreground">
                      Choose your status for this school day. This is separate from student attendance.
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StudentStatusPill
                      value={currentTeacherStatus}
                      onChange={(status) => setTeacherStatusChoice(status)}
                    />
                    {teacherAttendance && (
                      <p className="text-[11px] text-muted-foreground">
                        Last submitted: <span className="font-medium">{teacherAttendance.status}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleSubmitMyAttendance}
                    disabled={!currentTeacherStatus || submitTeacherAttendanceMutation.isPending}
                  >
                    {submitTeacherAttendanceMutation.isPending ? (
                      <span className="text-xs">Saving…</span>
                    ) : (
                      <span className="text-xs">Save my attendance</span>
                    )}
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleFinalize}
                    disabled={isSessionFinalized || finalizeMutation.isPending || !classId || !sessionDate}
                  >
                    {isSessionFinalized ? (
                      <span className="text-xs">Session finalized</span>
                    ) : finalizeMutation.isPending ? (
                      <span className="text-xs">Finalizing…</span>
                    ) : (
                      <span className="text-xs">Finalize session</span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "students" && (
            <Card className="border border-slate-200/80 bg-white/90 shadow-sm">
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>Students in this class</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleMarkAllPresent}
                      disabled={
                        students.length === 0 ||
                        isLoadingInitial ||
                        bulkMutation.isPending ||
                        isSessionFinalized ||
                        finalizeMutation.isPending
                      }
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      <span className="text-xs">Mark all present</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSave}
                      disabled={
                        students.length === 0 ||
                        isLoadingInitial ||
                        bulkMutation.isPending ||
                        isSessionFinalized ||
                        finalizeMutation.isPending
                      }
                    >
                      {bulkMutation.isPending ? (
                        <span className="text-xs">Saving…</span>
                      ) : (
                        <span className="text-xs">Save attendance</span>
                      )}
                    </Button>
                  </div>
                </div>

                {isLoadingInitial ? (
                  <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Skeleton key={index} className="h-14 w-full rounded-lg" />
                    ))}
                  </div>
                ) : students.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No students found in this class.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {students.map((s) => {
                      const studentName = `${s.user.first_name} ${s.user.last_name}`.trim();
                      const currentStatus = localStatuses[s.user_id] ?? s.attendance?.status;
                      return (
                        <div
                          key={s.user_id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">{studentName}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {s.user.student_id ? `ID: ${s.user.student_id}` : s.user.email}
                            </p>
                          </div>
                          <StudentStatusPill
                            value={currentStatus}
                            onChange={(status) => handleSetStatus(s.user_id, status)}
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
    </AppLayout>
  );
}
