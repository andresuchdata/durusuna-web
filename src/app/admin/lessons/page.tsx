"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import AppLayout from "@/components/layout/AppLayout";
import { LessonsToolbar } from "@/components/admin/LessonsToolbar";
import { SortableTable, type ColumnConfig } from "@/components/ui/sortable-table";
import type { SortConfig } from "@/lib/tableUtils";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Pencil, Trash2, MoreHorizontal, AlertCircle } from "lucide-react";
import { useProfile } from "@/domains/auth/hooks";
import { useAdminLessonsDashboard, useDeleteLesson } from "@/domains/lessons/hooks";
import type { AdminLessonSummary, LessonInstanceStatus } from "@/domains/lessons/types";
import { PageSizeSelect } from "@/components/ui/page-size-select";

const formatDateTime = (dateString?: string | null) => {
  if (!dateString) return "—";
  try {
    return format(new Date(dateString), "MMM dd, yyyy • HH:mm");
  } catch {
    return "—";
  }
};

const toISOStartOfDay = (date?: Date) => {
  if (!date) return undefined;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

const toISOEndOfDay = (date?: Date) => {
  if (!date) return undefined;
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
};

const renderStatusBadge = (status: LessonInstanceStatus) => {
  const map: Record<LessonInstanceStatus, string> = {
    planned: "bg-blue-100 text-blue-700 border-blue-200",
    in_session: "bg-amber-100 text-amber-700 border-amber-200",
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    cancelled: "bg-rose-100 text-rose-700 border-rose-200",
  };
  const label = status.replace("_", " ");
  return (
    <Badge variant="outline" className={"capitalize text-xs " + (map[status] ?? "")}>{`
      ${label}
    `}</Badge>
  );
};

export default function AdminLessonsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<LessonInstanceStatus | "all">("all");
  const [classId, setClassId] = useState<string | undefined>(undefined);
  const [subjectId, setSubjectId] = useState<string | undefined>(undefined);
  const [teacherId, setTeacherId] = useState<string | undefined>(undefined);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({
    key: "scheduled_start",
    direction: "desc",
  });
  const [pendingDelete, setPendingDelete] = useState<AdminLessonSummary | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, classId, subjectId, teacherId, fromDate, toDate, pageSize]);

  const queryParams = useMemo(
    () => ({
      page,
      limit: pageSize,
      search: debouncedSearch || undefined,
      status: status === "all" ? undefined : status,
      class_id: classId,
      subject_id: subjectId,
      teacher_id: teacherId,
      from: fromDate ? toISOStartOfDay(fromDate) : undefined,
      to: toDate ? toISOEndOfDay(toDate) : undefined,
    }),
    [page, debouncedSearch, status, classId, subjectId, teacherId, fromDate, toDate, pageSize]
  );

  const lessonsQuery = useAdminLessonsDashboard(queryParams);
  const deleteLesson = useDeleteLesson();

  const lessons = lessonsQuery.data?.lessons ?? [];
  const pagination = lessonsQuery.data?.pagination;
  const total = pagination?.total ?? 0;
  const effectivePageSize = pagination?.limit ?? pageSize;
  const totalPages =
    effectivePageSize > 0 ? Math.max(1, Math.ceil(total / effectivePageSize)) : 1;
  const currentPage = pagination?.page ?? page;
  const start = total === 0 ? 0 : (currentPage - 1) * effectivePageSize + 1;
  const end = total === 0 ? 0 : Math.min(total, currentPage * effectivePageSize);

  const isAdmin = profile?.role === "admin" || profile?.user_type === "admin";
  const canView = isAdmin;
  const canEdit = isAdmin;
  const canDelete = isAdmin;

  const columns: ColumnConfig<AdminLessonSummary>[] = [
    {
      key: "title",
      header: "Title",
      sortable: true,
      minWidth: "200px",
      sticky: true,
      render: (lesson) => (
        <div className="space-y-1">
          <Link
            href={`/admin/lessons/${lesson.id}`}
            className="font-medium text-sm text-primary hover:underline"
          >
            {lesson.title || "(No title)"}
          </Link>
          <p className="text-xs text-muted-foreground">ID: {lesson.id}</p>
        </div>
      ),
    },
    {
      key: "subject_name",
      header: "Subject",
      sortable: true,
      minWidth: "160px",
      render: (lesson) => lesson.subject_name || "—",
    },
    {
      key: "class_name",
      header: "Class",
      sortable: true,
      minWidth: "160px",
      render: (lesson) => lesson.class_name || "—",
    },
    {
      key: "teacher_name",
      header: "Teacher",
      sortable: true,
      minWidth: "160px",
      render: (lesson) => {
        if (!lesson.teacher_name) {
          return "—";
        }

        if (!lesson.teacher_id) {
          return lesson.teacher_name;
        }

        return (
          <Link href={`/users/${lesson.teacher_id}`} className="text-primary hover:underline">
            {lesson.teacher_name}
          </Link>
        );
      },
    },
    {
      key: "scheduled_start",
      header: "Start",
      sortable: true,
      minWidth: "180px",
      render: (lesson) => formatDateTime(lesson.scheduled_start),
    },
    {
      key: "scheduled_end",
      header: "End",
      sortable: true,
      minWidth: "180px",
      render: (lesson) => formatDateTime(lesson.scheduled_end),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      minWidth: "140px",
      render: (lesson) => renderStatusBadge(lesson.status),
    },
  ];

  const renderActions = (lesson: AdminLessonSummary) => {
    if (!canEdit && !canDelete) return null;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canEdit && (
            <DropdownMenuItem onClick={() => router.push(`/admin/lessons/${lesson.id}`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setPendingDelete(lesson)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteLesson.mutateAsync(pendingDelete.id);
      toast({ title: "Lesson deleted", description: `${pendingDelete.title ?? "Lesson"} has been removed.` });
    } catch (error) {
      toast({
        title: "Failed to delete lesson",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setPendingDelete(null);
    }
  };

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>
      </AppLayout>
    );
  }

  if (!canView) {
    return (
      <AppLayout>
        <div className="container mx-auto max-w-xl p-6">
          <Card className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-semibold">Access denied</h1>
            <p className="text-sm text-muted-foreground">Only administrators can manage lessons.</p>
            <Button variant="outline" onClick={() => router.back()}>
              Go back
            </Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-8 space-y-6">
        <div className="flex flex-col gap-1">
          <p className="text-sm uppercase tracking-wider text-muted-foreground">Admin · Lessons</p>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Lessons overview</h1>
              <p className="text-sm text-muted-foreground">Search, filter, and manage lesson instances across the school.</p>
            </div>
          </div>
        </div>

        <LessonsToolbar
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          classId={classId}
          onClassChange={setClassId}
          subjectId={subjectId}
          onSubjectChange={setSubjectId}
          teacherId={teacherId}
          onTeacherChange={setTeacherId}
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          canCreate={canEdit}
          onCreate={() => router.push("/admin/lessons/new")}
        />

        <div className="rounded-xl border bg-white shadow-sm">
          <SortableTable
            data={lessons}
            columns={columns}
            loading={lessonsQuery.isLoading}
            emptyMessage={lessonsQuery.isError ? "Failed to load lessons." : "No lessons match your filters."}
            defaultSort={sortConfig ?? undefined}
            onSortChange={setSortConfig}
            renderActions={canEdit || canDelete ? renderActions : undefined}
            tableKey={`lessons-${currentPage}`}
          />

          <div className="flex flex-col gap-2 border-t px-4 py-3 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-3">
              <div>
                {total > 0 ? (
                  <span>
                    Showing{" "}
                    <span className="font-medium text-slate-700">{start}</span>
                    –
                    <span className="font-medium text-slate-700">{end}</span>
                    {" "}of{" "}
                    <span className="font-medium text-slate-700">{total}</span>
                    {" "}lessons
                  </span>
                ) : (
                  <span>No lessons to display</span>
                )}
              </div>
              <PageSizeSelect
                value={effectivePageSize}
                onChange={setPageSize}
                disabled={lessonsQuery.isLoading}
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <span className="hidden md:inline">
                Page{" "}
                <span className="font-medium text-slate-700">{currentPage}</span>
                {" "}of{" "}
                <span className="font-medium text-slate-700">{totalPages}</span>
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1 || lessonsQuery.isLoading}
                  className="h-7 px-2"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages || lessonsQuery.isLoading}
                  className="h-7 px-2"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>

        <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && !deleteLesson.isPending && setPendingDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete lesson</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The lesson "{pendingDelete?.title || "Untitled"}" will be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteLesson.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteLesson.isPending}
                onClick={handleConfirmDelete}
              >
                {deleteLesson.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
