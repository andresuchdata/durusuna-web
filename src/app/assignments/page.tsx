"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { useProfile } from "@/domains/auth/hooks";
import { useUserAssignments } from "@/domains/assignments/hooks";
import type { AssignmentSummary, AssignmentType } from "@/domains/assignments/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ListChecks, Plus, Search } from "lucide-react";

type TypeFilter = AssignmentType | "all";

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

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!assignments.length) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">No assignments found.</div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Class</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Due</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assignments.map((a) => {
          const due = a.due_date ? new Date(a.due_date).toLocaleDateString() : "—";
          const typeLabel = a.type.replace("_", " ");
          return (
            <TableRow
              key={a.id}
              className="cursor-pointer hover:bg-slate-50"
              onClick={() => router.push(`/assignments/${a.id}`)}
            >
              <TableCell className="font-medium text-sm text-slate-900">{a.title}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{a.subject_name ?? "–"}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{a.class_name ?? "–"}</TableCell>
              <TableCell className="text-xs capitalize text-muted-foreground">{typeLabel}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{due}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default function AssignmentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TypeFilter>("all");

  const params = useMemo(
    () => ({
      page: 1,
      limit: 50,
      type,
      search: search || undefined,
    }),
    [type, search]
  );

  const assignmentsQuery = useUserAssignments(params);

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
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm">
            <AssignmentsTable
              assignments={assignmentsQuery.data?.assignments ?? []}
              isLoading={assignmentsQuery.isLoading}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
