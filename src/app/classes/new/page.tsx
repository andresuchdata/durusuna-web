"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AcademicPeriodSelector } from "@/components/academic/AcademicPeriodSelector";
import { useProfile } from "@/domains/auth/hooks";
import { useCreateClass } from "@/domains/classes/hooks";
import { useAcademicPeriods } from "@/domains/academic/hooks";
import { useUsers } from "@/domains/users/hooks";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, ArrowLeft, Calendar, Loader2, Search, Sparkles, Users } from "lucide-react";

const GRADE_LEVELS = [
  "Preschool",
  "Kindergarten",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
];

export default function CreateClassPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const createClass = useCreateClass();
  const { data: periodsData, isLoading: periodsLoading } = useAcademicPeriods();
  const [studentSearch, setStudentSearch] = useState("");
  const { data: studentResponse, isLoading: studentsLoading } = useUsers({
    userType: "student",
    search: studentSearch || undefined,
    limit: 50,
  });

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    description: "",
    grade_level: "",
    section: "",
    academicYear: new Date().getFullYear().toString(),
    room: "",
    capacity: "",
    notes: "",
  });

  const periods = periodsData?.academic_periods ?? [];
  const selectedPeriod = useMemo(
    () => periods.find((period) => period.id === selectedPeriodId),
    [periods, selectedPeriodId]
  );

  useEffect(() => {
    if (!selectedPeriodId && periods.length) {
      const fallback = periods.find((period) => period.is_current) ?? periods[0];
      setSelectedPeriodId(fallback.id);
      setForm((prev) => ({ ...prev, academicYear: fallback.academic_year.name }));
    }
  }, [periods, selectedPeriodId]);

  useEffect(() => {
    if (selectedPeriod) {
      setForm((prev) => ({ ...prev, academicYear: selectedPeriod.academic_year.name }));
    }
  }, [selectedPeriod]);

  const students = studentResponse?.users ?? [];
  const selectedStudents = students.filter((student) => selectedStudentIds.includes(student.id));

  const role = profile?.role;
  const userType = profile?.user_type;
  const isAdmin = role === "admin" || userType === "admin";
  const isTeacher = userType === "teacher";
  const canManageClasses = isAdmin || isTeacher;

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((studentId) => studentId !== id) : [...prev, id]
    );
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) {
      nextErrors.name = "Class name is required";
    }
    if (!form.academicYear.trim()) {
      nextErrors.academicYear = "Academic year is required";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      await createClass.mutateAsync({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        grade_level: form.grade_level || undefined,
        section: form.section || undefined,
        academic_year: form.academicYear.trim(),
        settings: {
          room: form.room.trim() || undefined,
          capacity: form.capacity ? Number(form.capacity) : undefined,
          notes: form.notes.trim() || undefined,
          preferred_period_id: selectedPeriodId,
          preselected_student_ids: selectedStudentIds,
        },
      });

      toast({ title: "Class created", description: "You can now add teachers, subjects, and lessons." });
      router.push("/classes");
    } catch (error) {
      toast({
        title: "Failed to create class",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>
      </AppLayout>
    );
  }

  if (!canManageClasses) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-md text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-semibold">Access denied</h1>
            <p className="text-muted-foreground text-sm">
              Only admins and teachers can create classes. Please contact your administrator if you need help.
            </p>
            <Button variant="secondary" asChild>
              <Link href="/classes">Back to classes</Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Button variant="ghost" size="sm" asChild className="gap-2 px-0 text-sm font-medium text-slate-700">
              <Link href="/classes">
                <ArrowLeft className="h-4 w-4" />
                Back to classes
              </Link>
            </Button>
            <span>·</span>
            <span>Create a new class</span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Class details</h1>
                  <p className="text-sm text-muted-foreground">Keep it short and clear so students recognize it instantly.</p>
                </div>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <Label htmlFor="class-name">Class name *</Label>
                  <Input
                    id="class-name"
                    placeholder="e.g. Grade 10 Mathematics"
                    value={form.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    className={errors.name ? "border-red-500" : undefined}
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="class-description">Short description</Label>
                  <Textarea
                    id="class-description"
                    rows={3}
                    placeholder="What makes this class special?"
                    value={form.description}
                    onChange={(event) => updateForm("description", event.target.value)}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Grade level</Label>
                    <div className="flex flex-wrap gap-2">
                      {GRADE_LEVELS.map((level) => {
                        const isSelected = form.grade_level === level;
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => updateForm("grade_level", isSelected ? "" : level)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                              isSelected ? "border-blue-500 bg-blue-50 text-blue-600" : "border-slate-200 text-slate-600"
                            }`}
                          >
                            {level}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="section">Section</Label>
                    <Input
                      id="section"
                      placeholder="e.g. A"
                      value={form.section}
                      onChange={(event) => updateForm("section", event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Calendar className="h-4 w-4" /> Academic period
                  </div>
                  <AcademicPeriodSelector value={selectedPeriodId} onChange={setSelectedPeriodId} />
                  <div className="space-y-1.5">
                    <Label htmlFor="academic-year">Academic year *</Label>
                    <Input
                      id="academic-year"
                      value={form.academicYear}
                      onChange={(event) => updateForm("academicYear", event.target.value)}
                      className={errors.academicYear ? "border-red-500" : undefined}
                    />
                    {errors.academicYear && <p className="text-xs text-red-500">{errors.academicYear}</p>}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="room">Room / location</Label>
                    <Input
                      id="room"
                      placeholder="e.g. Building B, Room 204"
                      value={form.room}
                      onChange={(event) => updateForm("room", event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="capacity">Max capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min={0}
                      placeholder="e.g. 30"
                      value={form.capacity}
                      onChange={(event) => updateForm("capacity", event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes">Notes for teachers</Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    placeholder="Optional instructions or expectations"
                    value={form.notes}
                    onChange={(event) => updateForm("notes", event.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Students will be linked once the class is active. You can still assign subjects and lessons right away.
                  </p>
                  <Button type="submit" className="min-w-[160px]" disabled={createClass.isPending}>
                    {createClass.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create class"
                    )}
                  </Button>
                </div>
              </form>
            </section>

            <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Add students now or later</h2>
                  <p className="text-sm text-muted-foreground">
                    Selecting students today stores them in the class settings so enrollment is a single click after approval.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">
                <span>{selectedStudentIds.length} selected</span>
                {selectedStudentIds.length > 0 && (
                  <button
                    type="button"
                    className="text-blue-600"
                    onClick={() => setSelectedStudentIds([])}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search students by name or email"
                  className="pl-9"
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                />
              </div>

              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                {studentsLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  ))
                ) : students.length ? (
                  students.map((student) => {
                    const isSelected = selectedStudentIds.includes(student.id);
                    const initials = `${student.first_name?.charAt(0) ?? ""}${student.last_name?.charAt(0) ?? ""}`;
                    return (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => toggleStudent(student.id)}
                        className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                          isSelected ? "border-blue-500 bg-blue-50/60" : "border-slate-100 hover:border-slate-200"
                        }`}
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                          {initials || <Users className="h-4 w-4 text-slate-400" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                        {isSelected && <Badge variant="secondary">Added</Badge>}
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-muted-foreground">
                    {studentSearch ? "No students match your search." : "No students found yet."}
                  </div>
                )}
              </div>

              {selectedStudents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase text-slate-500">Ready to join</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudents.map((student) => (
                      <Badge key={student.id} variant="outline" className="gap-2 text-xs">
                        {student.first_name} {student.last_name}
                        <button type="button" onClick={() => toggleStudent(student.id)} className="text-slate-400">
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-700">Why capture students now?</p>
                <ul className="mt-2 space-y-1 list-disc pl-4">
                  <li>Helps estimate capacity before publishing the class roster.</li>
                  <li>Stores their IDs in class settings so future enrollment APIs can use them instantly.</li>
                  <li>Speeds up guardians and notification routing once the class is live.</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
