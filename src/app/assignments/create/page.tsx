"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { useProfile } from "@/domains/auth/hooks";
import { useTeacherAccessibleSubjects, useCreateAssignmentForClassSubject } from "@/domains/assignments/hooks";
import type { AssignmentType } from "@/domains/assignments/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ListChecks } from "lucide-react";

export default function AssignmentCreatePage() {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const role = profile?.role;
  const userType = profile?.user_type;
  const canCreate = role === "admin" || userType === "teacher";

  const subjectsQuery = useTeacherAccessibleSubjects(canCreate);
  const subjects = subjectsQuery.data?.subjects ?? [];

  const [subjectId, setSubjectId] = useState<string>("");
  const [classId, setClassId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<AssignmentType>("assignment");
  const [maxScore, setMaxScore] = useState("100");
  const [dueDate, setDueDate] = useState("");

  const createMutation = useCreateAssignmentForClassSubject();

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.subject_id === subjectId),
    [subjects, subjectId]
  );

  const availableClasses = selectedSubject?.classes ?? [];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!subjectId || !classId || !title.trim()) return;

    const parsedMax = parseFloat(maxScore || "0");
    const max = Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : 100;

    await createMutation.mutateAsync({
      classId,
      subjectId,
      payload: {
        title: title.trim(),
        description: description || undefined,
        type,
        max_score: max,
        due_date: dueDate || undefined,
        is_published: true,
      },
    });

    router.push("/assignments");
  };

  if (profileLoading || subjectsQuery.isLoading) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Skeleton className="h-6 w-40" />
        </div>
      </AppLayout>
    );
  }

  if (!canCreate) {
    return (
      <AppLayout>
        <div className="container mx-auto max-w-xl p-6">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="text-lg font-semibold text-slate-900">Access denied</h1>
            <p className="text-xs text-muted-foreground">
              Only teachers and administrators can create assignments.
            </p>
            <Button size="sm" variant="outline" onClick={() => router.back()}>
              Go back
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-sky-50">
        <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 md:py-8">
          <header className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 text-white shadow-sm">
              <ListChecks className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                New assignment
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">Create assignment</h1>
              <p className="text-xs text-muted-foreground">
                Choose a subject and class, then enter the assignment details.
              </p>
            </div>
          </header>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-700">Subject</p>
                <Select
                  value={subjectId}
                  onValueChange={(value) => {
                    setSubjectId(value);
                    setClassId("");
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.subject_id} value={s.subject_id}>
                        {s.subject_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-700">Class</p>
                <Select
                  value={classId}
                  onValueChange={(value) => setClassId(value)}
                  disabled={!selectedSubject}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder={selectedSubject ? "Select class" : "Select subject first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClasses.map((c) => (
                      <SelectItem key={c.class_id} value={c.class_id}>
                        {c.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-700">Title</p>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Assignment title"
                className="h-9 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-700">Description</p>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description or instructions"
                className="text-sm"
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-700">Type</p>
                <Select value={type} onValueChange={(v) => setType(v as AssignmentType)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="test">Test</SelectItem>
                    <SelectItem value="final_exam">Final exam</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-700">Max score</p>
                <Input
                  type="number"
                  min={1}
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-700">Due date</p>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating…" : "Create assignment"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
