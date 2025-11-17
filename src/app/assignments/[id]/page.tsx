"use client";

import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { useAssignmentDetails } from "@/domains/assignments/hooks";
import { useProfile } from "@/domains/auth/hooks";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft, Users } from "lucide-react";

export default function AssignmentDetailPage() {
  const params = useParams<{ id: string }>();
  const assignmentId = params?.id as string | undefined;
  const router = useRouter();

  const { data: profile } = useProfile();
  const query = useAssignmentDetails(assignmentId);

  const isTeacherOrAdmin = profile?.user_type === "teacher" || profile?.role === "admin";

  if (!assignmentId) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
          No assignment id provided.
        </div>
      </AppLayout>
    );
  }

  if (query.isLoading) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-32 w-full max-w-2xl" />
        </div>
      </AppLayout>
    );
  }

  if (query.error || !query.data) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="flex max-w-md flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-sm font-medium text-slate-900">Failed to load assignment.</p>
            <p className="text-xs text-muted-foreground">
              This assignment may have been removed or you don&apos;t have access to it.
            </p>
            <Button size="sm" variant="outline" onClick={() => router.back()}>
              Go back
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const { assignment, student_submissions: submissions, stats } = query.data;

  const dueLabel = assignment.due_date
    ? new Date(assignment.due_date).toLocaleString()
    : "No due date";

  const typeLabel = assignment.type.replace("_", " ");

  const visibleSubmissions = submissions;

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-sky-50">
        <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 md:py-8">
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

          <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">{typeLabel}</p>
                <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
                  {assignment.title}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {assignment.subject_name ?? "Subject"} · {assignment.class_name ?? "Class"}
                </p>
              </div>
              <div className="text-right text-xs">
                <p className="font-medium text-slate-900">Due</p>
                <p className="text-muted-foreground">{dueLabel}</p>
                <p className="mt-1 text-muted-foreground">
                  Max score: <span className="font-semibold">{assignment.max_score}</span>
                </p>
              </div>
            </div>
            {assignment.description && (
              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                {assignment.description}
              </p>
            )}
          </div>

          {isTeacherOrAdmin && (
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>Submission overview</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
                <div>
                  <p className="text-[11px] text-muted-foreground">Total students</p>
                  <p className="text-base font-semibold text-slate-900">{stats.total_students}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Submitted</p>
                  <p className="text-base font-semibold text-slate-900">
                    {stats.submitted_count}/{stats.total_students}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Graded</p>
                  <p className="text-base font-semibold text-slate-900">
                    {stats.graded_count}/{stats.submitted_count}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Average score</p>
                  <p className="text-base font-semibold text-slate-900">
                    {stats.average_score != null ? stats.average_score.toFixed(1) : "—"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>Student submissions</span>
              </div>
            </div>
            {visibleSubmissions.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No submissions yet for this assignment.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Graded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleSubmissions.map((s) => {
                    const submittedAt = s.submitted_at
                      ? new Date(s.submitted_at).toLocaleString()
                      : "—";
                    const gradedAt = s.graded_at
                      ? new Date(s.graded_at).toLocaleString()
                      : "—";
                    const scoreLabel =
                      s.score != null ? `${s.score}/${s.max_score}` : `—/${s.max_score}`;
                    const statusLabel = s.status.replace("_", " ");
                    return (
                      <TableRow key={s.student_id}>
                        <TableCell className="text-sm text-slate-900">
                          {s.student_name}
                          {s.student_number && (
                            <span className="ml-1 text-[11px] text-muted-foreground">
                              ({s.student_number})
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs capitalize text-muted-foreground">
                          {statusLabel}
                        </TableCell>
                        <TableCell className="text-right text-xs">{scoreLabel}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{submittedAt}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{gradedAt}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
