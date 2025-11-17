"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { useProfile } from "@/domains/auth/hooks";
import { useUserAssignments } from "@/domains/assignments/hooks";
import type { AssignmentSummary, AssignmentType } from "@/domains/assignments/types";
import { useSubjects } from "@/domains/subjects/hooks";
import { useClasses } from "@/domains/classes/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortableTable, type ColumnConfig } from "@/components/ui/sortable-table";
import { ListChecks, Plus, Search } from "lucide-react";

type TypeFilter = AssignmentType | "all";

type AssignmentRow = AssignmentSummary & { _dueDate?: Date | null };

function AssignmentsHeader() {
  const { data: profile } = useProfile();
  const role = profile?.user_type;

  const pill =
    role === "teacher"
      ? "Teacher · Assignments"
      : role === "student"
      ? "Student · Assignments"
      : role === "parent"
      ? "Parent · Assignments"
      : "Assignments";

  return (
    <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 text-white shadow-sm">
          <ListChecks className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">{pill}</p>
          <h1 className="text-2xl font-semibold text-slate-900">Assignments</h1>
          <p className="text-xs text-muted-foreground">Browse assignments you can access.</p>
        </div>
      </div>
    </header>
  );
}

function AssignmentsTable({ assignments, isLoading }: { assignments: AssignmentSummary[]; isLoading: boolean }) {
  const router = useRouter();
  const rows: AssignmentRow[] = useMemo(
    () =>
      assignments.map((a) => ({
        ...a,
        _dueDate: a.due_date ? new Date(a.due_date) : null,
      })),
    [assignments]
  );

  const columns: ColumnConfig<AssignmentRow>[] = useMemo(
    () => [
      {
        key: "title",
        header: "Title",
        sortable: true,
        sticky: true,
        minWidth: "220px",
        render: (a) => (
          <div className="flex flex-col">
            <span className="font-medium text-sm text-slate-900">{a.title}</span>
            {(a.subject_name || a.class_name) && (
              <span className="text-[11px] text-muted-foreground">
                {a.subject_name ?? "Subject"}
                {a.class_name ? ` · ${a.class_name}` : ""}
              </span>
            )}
          </div>
        ),
      },
      {
        key: "subject_name",
        header: "Subject",
        sortable: true,
        minWidth: "140px",
        render: (a) => a.subject_name ?? "–",
      },
      {
        key: "class_name",
        header: "Class",
        sortable: true,
        minWidth: "140px",
        render: (a) => a.class_name ?? "–",
      },
      {
        key: "type",
        header: "Type",
        sortable: true,
        minWidth: "120px",
        render: (a) => a.type.replace("_", " "),
      },
      {
        key: "due_date",
        header: "Due",
        sortable: true,
        sortKey: "_dueDate",
        minWidth: "140px",
        render: (a) => (a.due_date ? new Date(a.due_date).toLocaleDateString() : "—"),
      },
    ],
    []
  );

  return (
    <SortableTable
      data={rows}
      columns={columns}
      loading={isLoading}
      emptyMessage="No assignments found."
      defaultSort={{ key: "due_date", direction: "asc" }}
      stickyHeader
      onRowClick={(row) => router.push(`/assignments/${row.id}`)}
      containerClassName="border-none shadow-none"
    />
  );
}

export default function AssignmentsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [dueFrom, setDueFrom] = useState("");
  const [dueTo, setDueTo] = useState("");

  const subjectsQuery = useSubjects();
  const classesQuery = useClasses({ is_active: true });

  const params = useMemo(
    () => ({
      page,
      limit: 50,
      type,
      search: search || undefined,
      subject_id: subjectFilter !== "all" ? subjectFilter : undefined,
      class_id: classFilter !== "all" ? classFilter : undefined,
      due_date_from: dueFrom || undefined,
      due_date_to: dueTo || undefined,
    }),
    [page, type, search, subjectFilter, classFilter, dueFrom, dueTo]
  );

  useEffect(() => {
    setPage(1);
  }, [type, search, subjectFilter, classFilter, dueFrom, dueTo]);

  const assignmentsQuery = useUserAssignments(params);
  const assignments = assignmentsQuery.data?.assignments ?? [];
  const pagination = assignmentsQuery.data?.pagination;

  const total = pagination?.total ?? 0;
  const pageSize = pagination?.limit ?? params.limit ?? 50;
  const currentPageDisplay = pagination?.page ?? page;
  const totalPages =
    pagination?.totalPages ?? (pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1);
  const start = total === 0 ? 0 : (currentPageDisplay - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(total, currentPageDisplay * pageSize);

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-sky-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-8 space-y-5">
          <AssignmentsHeader />

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 items-center gap-2">
                <div className="relative w-full max-w-md">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search assignments by title or subject"
                    className="h-9 pl-9 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select value={type} onValueChange={(v) => setType(v as TypeFilter)}>
                  <SelectTrigger className="h-9 w-40 text-xs">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="assignment">Assignments</SelectItem>
                    <SelectItem value="test">Tests</SelectItem>
                    <SelectItem value="final_exam">Final exams</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="hidden md:inline-flex"
                  onClick={() => router.push("/assignments/create")}
                >
                  <Plus className="h-4 w-4" />
                  <span className="ml-1 text-xs">New</span>
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Filters
                </span>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subjects</SelectItem>
                    {subjectsQuery.data?.subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All classes</SelectItem>
                    {classesQuery.data?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-500">Due from</span>
                  <Input
                    type="date"
                    value={dueFrom}
                    onChange={(e) => setDueFrom(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-500">to</span>
                  <Input
                    type="date"
                    value={dueTo}
                    onChange={(e) => setDueTo(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                {(subjectFilter !== "all" || classFilter !== "all" || dueFrom || dueTo) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-slate-500"
                    onClick={() => {
                      setSubjectFilter("all");
                      setClassFilter("all");
                      setDueFrom("");
                      setDueTo("");
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm">
            <AssignmentsTable
              assignments={assignments}
              isLoading={assignmentsQuery.isLoading}
            />

            {pagination && (
              <div className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
                <div>
                  {total > 0 ? (
                    <span>
                      Showing
                      {" "}
                      <span className="font-medium text-slate-700">{start}</span>
                      –
                      <span className="font-medium text-slate-700">{end}</span>
                      {" "}
                      of
                      {" "}
                      <span className="font-medium text-slate-700">{total}</span>
                      {" "}
                      assignments
                    </span>
                  ) : (
                    <span>No assignments to display</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden md:inline">
                    Page
                    {" "}
                    <span className="font-medium text-slate-700">{currentPageDisplay}</span>
                    {" "}
                    of
                    {" "}
                    <span className="font-medium text-slate-700">{totalPages}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      disabled={
                        assignmentsQuery.isLoading || !pagination || currentPageDisplay <= 1
                      }
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      disabled={
                        assignmentsQuery.isLoading ||
                        !pagination ||
                        currentPageDisplay >= totalPages
                      }
                      onClick={() => setPage((prev) => prev + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
