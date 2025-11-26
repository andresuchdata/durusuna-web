"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { AcademicPeriodSelector } from "@/components/academic/AcademicPeriodSelector";
import {
  useAcademicPeriods,
} from "@/domains/academic/hooks";
import { useProfile } from "@/domains/auth/hooks";
import { useUsers } from "@/domains/users/hooks";
import {
  useClass,
  useUpdateClass,
  useClassStudents,
  useAddStudentsToClass,
  useRemoveStudentFromClass,
  useClassSubjects,
  useAddSubjectsToClass,
  useRemoveClassSubject,
} from "@/domains/classes/hooks";
import { useSubjects } from "@/domains/subjects/hooks";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Loader2,
  Search,
  Sparkles,
  Users,
  UserMinus,
  BookOpen,
  Plus,
  Trash2,
} from "lucide-react";

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

type FormState = {
  name: string;
  description: string;
  grade_level: string;
  section: string;
  academicYear: string;
  room: string;
  capacity: string;
  notes: string;
};

export default function EditClassPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params?.id as string;
  const { toast } = useToast();

  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: classData, isLoading: classLoading, error: classError } = useClass(classId);
  const updateClass = useUpdateClass();

  const { data: periodsData } = useAcademicPeriods();
  const periods = periodsData?.academic_periods ?? [];

  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    grade_level: "",
    section: "",
    academicYear: "",
    room: "",
    capacity: "",
    notes: "",
  });
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: studentsData, isLoading: existingStudentsLoading } = useClassStudents(classId, {
    limit: 100,
  });
  const [studentSearch, setStudentSearch] = useState("");
  const {
    data: availableStudentsData,
    isLoading: availableStudentsLoading,
  } = useUsers({ userType: "student", search: studentSearch || undefined, limit: 50 });
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const addStudentsMutation = useAddStudentsToClass();
  const removeStudentMutation = useRemoveStudentFromClass();
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(null);

  const { data: classSubjectsData, isLoading: classSubjectsLoading } = useClassSubjects(classId);
  const { data: subjectsData, isLoading: subjectsLoading } = useSubjects();
  const [subjectSearch, setSubjectSearch] = useState("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const addSubjectsMutation = useAddSubjectsToClass();
  const removeSubjectMutation = useRemoveClassSubject();
  const [removingSubjectId, setRemovingSubjectId] = useState<string | null>(null);

  const classSettings = useMemo(() => {
    if (!classData?.settings) return {} as Record<string, any>;
    if (typeof classData.settings === "string") {
      try {
        return JSON.parse(classData.settings);
      } catch (error) {
        console.error("Failed to parse class settings", error);
        return {} as Record<string, any>;
      }
    }
    return classData.settings;
  }, [classData]);

  useEffect(() => {
    if (!classData) return;
    setForm({
      name: classData.name ?? "",
      description: classData.description ?? "",
      grade_level: classData.grade_level ?? "",
      section: classData.section ?? "",
      academicYear: classData.academic_year ?? new Date().getFullYear().toString(),
      room: classSettings?.room ?? "",
      capacity: classSettings?.capacity ? String(classSettings.capacity) : "",
      notes: classSettings?.notes ?? "",
    });
    setSelectedPeriodId(classSettings?.preferred_period_id ?? undefined);
  }, [classData, classSettings]);

  useEffect(() => {
    if (!selectedPeriodId && periods.length) {
      const fallback = periods.find((period) => period.is_current) ?? periods[0];
      setSelectedPeriodId(fallback.id);
      setForm((prev) => ({ ...prev, academicYear: fallback.academic_year.name }));
    }
  }, [periods, selectedPeriodId]);

  useEffect(() => {
    if (!selectedPeriodId) return;
    const match = periods.find((period) => period.id === selectedPeriodId);
    if (match) {
      setForm((prev) => ({ ...prev, academicYear: match.academic_year.name }));
    }
  }, [selectedPeriodId, periods]);

  const availableStudents = availableStudentsData?.users ?? [];
  const selectedStudents = availableStudents.filter((student) =>
    selectedStudentIds.includes(student.id)
  );
  const enrolledStudents = studentsData?.students ?? [];

  const classSubjects = classSubjectsData?.subjects ?? [];
  const allSubjects = subjectsData?.subjects ?? [];
  const classSubjectIds = new Set(classSubjects.map((subject) => subject.subject_id));
  const filteredSubjects = allSubjects.filter((subject) => {
    const alreadyAttached = classSubjectIds.has(subject.id);
    const matchesSearch = subject.name.toLowerCase().includes(subjectSearch.toLowerCase());
    return !alreadyAttached && matchesSearch;
  });
  const selectedSubjects = filteredSubjects.filter((subject) =>
    selectedSubjectIds.includes(subject.id)
  );

  const role = profile?.role;
  const userType = profile?.user_type;
  const isAdmin = role === "admin" || userType === "admin";
  const isTeacher = userType === "teacher";
  const canManageClasses = isAdmin || isTeacher;

  const updateForm = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((studentId) => studentId !== id) : [...prev, id]
    );
  };

  const toggleSubjectSelection = (id: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((subjectId) => subjectId !== id) : [...prev, id]
    );
  };

  const validateForm = () => {
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
    if (!classId || !validateForm()) return;

    const nextSettings = {
      ...classSettings,
      room: form.room.trim() || undefined,
      capacity: form.capacity ? Number(form.capacity) : undefined,
      notes: form.notes.trim() || undefined,
      preferred_period_id: selectedPeriodId,
    };

    try {
      await updateClass.mutateAsync({
        classId,
        data: {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          grade_level: form.grade_level || undefined,
          section: form.section || undefined,
          academic_year: form.academicYear.trim(),
          settings: nextSettings,
        },
      });
      toast({ title: "Class updated", description: "Changes saved successfully." });
      router.push(`/classes/${classId}`);
    } catch (error) {
      toast({
        title: "Failed to update class",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleAddStudents = async () => {
    if (!selectedStudentIds.length) return;
    try {
      const result = await addStudentsMutation.mutateAsync({
        classId,
        studentIds: selectedStudentIds,
      });
      setSelectedStudentIds([]);
      toast({
        title: "Students updated",
        description: `${result.added.length} added · ${result.already_enrolled.length} already enrolled · ${result.invalid.length} invalid`,
      });
    } catch (error) {
      toast({
        title: "Failed to add students",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    setRemovingStudentId(studentId);
    try {
      await removeStudentMutation.mutateAsync({ classId, studentId });
      toast({ title: "Student removed" });
    } catch (error) {
      toast({
        title: "Failed to remove student",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setRemovingStudentId(null);
    }
  };

  const handleAddSubjects = async () => {
    if (!selectedSubjectIds.length) return;
    try {
      const result = await addSubjectsMutation.mutateAsync({
        classId,
        subjectIds: selectedSubjectIds,
      });
      setSelectedSubjectIds([]);
      toast({
        title: "Subjects updated",
        description: `${result.added.length} added · ${result.already_added.length} already linked · ${result.invalid.length} invalid`,
      });
    } catch (error) {
      toast({
        title: "Failed to add subjects",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleRemoveSubject = async (classSubjectId: string) => {
    setRemovingSubjectId(classSubjectId);
    try {
      await removeSubjectMutation.mutateAsync({ classId, classSubjectId });
      toast({ title: "Subject removed" });
    } catch (error) {
      toast({
        title: "Failed to remove subject",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setRemovingSubjectId(null);
    }
  };

  if (profileLoading || classLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">
          Loading...
        </div>
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
              Only admins and teachers can edit classes. Please contact your administrator if you need help.
            </p>
            <Button variant="secondary" asChild>
              <Link href="/classes">Back to classes</Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (classError || !classData) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">
          Failed to load class details.
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
              <Link href={`/classes/${classId}`}>
                <ArrowLeft className="h-4 w-4" />
                Back to class
              </Link>
            </Button>
            <span>·</span>
            <span>Edit class</span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Class details</h1>
                  <p className="text-sm text-muted-foreground">
                    Update the foundational information for this class.
                  </p>
                </div>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <Label htmlFor="class-name">Class name *</Label>
                  <Input
                    id="class-name"
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
                              isSelected
                                ? "border-blue-500 bg-blue-50 text-blue-600"
                                : "border-slate-200 text-slate-600"
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
                    Save your changes to keep the roster and details in sync.
                  </p>
                  <Button type="submit" className="min-w-[160px]" disabled={updateClass.isPending}>
                    {updateClass.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                </div>
              </form>
            </section>

            <div className="space-y-6">
              <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Manage students</h2>
                    <p className="text-sm text-muted-foreground">
                      Add new students or remove existing ones from this class.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">
                  <span>{selectedStudentIds.length} selected</span>
                  {selectedStudentIds.length > 0 && (
                    <button type="button" className="text-blue-600" onClick={() => setSelectedStudentIds([])}>
                      Clear
                    </button>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      size="sm"
                      type="button"
                      onClick={handleAddStudents}
                      disabled={selectedStudentIds.length === 0 || addStudentsMutation.isPending}
                    >
                      {addStudentsMutation.isPending ? "Adding..." : "Add students"}
                    </Button>
                  </div>
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

                <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
                  {availableStudentsLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-3 w-32" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    ))
                  ) : availableStudents.length ? (
                    availableStudents.map((student) => {
                      const isSelected = selectedStudentIds.includes(student.id);
                      const initials = `${student.first_name?.charAt(0) ?? ""}${student.last_name?.charAt(0) ?? ""}`;
                      return (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => toggleStudentSelection(student.id)}
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
                          {isSelected && <Badge variant="secondary">Selected</Badge>}
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-muted-foreground">
                      {studentSearch ? "No students match your search." : "No students found."}
                    </div>
                  )}
                </div>

                {selectedStudents.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase text-slate-500">Ready to add</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedStudents.map((student) => (
                        <Badge key={student.id} variant="outline" className="gap-2 text-xs">
                          {student.first_name} {student.last_name}
                          <button type="button" onClick={() => toggleStudentSelection(student.id)} className="text-slate-400">
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    Current students
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {enrolledStudents.length}
                    </span>
                  </h3>
                  {existingStudentsLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="flex-1 space-y-1">
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : enrolledStudents.length ? (
                    <div className="space-y-2">
                      {enrolledStudents.map((student) => (
                        <div key={student.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                          <div className="flex flex-1 flex-col">
                            <p className="text-sm font-medium text-slate-900">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveStudent(student.id)}
                            disabled={removeStudentMutation.isPending && removingStudentId === student.id}
                          >
                            {removeStudentMutation.isPending && removingStudentId === student.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserMinus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
                  )}
                </div>
              </section>

              <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Manage subjects</h2>
                    <p className="text-sm text-muted-foreground">Attach or remove subjects taught in this class.</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">
                  <span>{selectedSubjectIds.length} selected</span>
                  {selectedSubjectIds.length > 0 && (
                    <button type="button" className="text-blue-600" onClick={() => setSelectedSubjectIds([])}>
                      Clear
                    </button>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      size="sm"
                      type="button"
                      onClick={handleAddSubjects}
                      disabled={selectedSubjectIds.length === 0 || addSubjectsMutation.isPending}
                    >
                      {addSubjectsMutation.isPending ? "Adding..." : "Add subjects"}
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search subjects"
                    className="pl-9"
                    value={subjectSearch}
                    onChange={(event) => setSubjectSearch(event.target.value)}
                  />
                </div>

                <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
                  {subjectsLoading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={index} className="h-10 w-full rounded-lg" />
                    ))
                  ) : filteredSubjects.length ? (
                    filteredSubjects.map((subject) => {
                      const isSelected = selectedSubjectIds.includes(subject.id);
                      return (
                        <button
                          key={subject.id}
                          type="button"
                          onClick={() => toggleSubjectSelection(subject.id)}
                          className={`flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm transition ${
                            isSelected ? "border-indigo-500 bg-indigo-50" : "border-slate-100 hover:border-slate-200"
                          }`}
                        >
                          <span className="font-medium text-slate-900">{subject.name}</span>
                          {isSelected && <Badge variant="secondary">Selected</Badge>}
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-muted-foreground">
                      {subjectSearch ? "No subjects match your search." : "No available subjects."}
                    </div>
                  )}
                </div>

                {selectedSubjects.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase text-slate-500">Ready to add</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSubjects.map((subject) => (
                        <Badge key={subject.id} variant="outline" className="gap-2 text-xs">
                          {subject.name}
                          <button type="button" onClick={() => toggleSubjectSelection(subject.id)} className="text-slate-400">
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    Current subjects
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {classSubjects.length}
                    </span>
                  </h3>
                  {classSubjectsLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-12 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : classSubjects.length ? (
                    <div className="space-y-2">
                      {classSubjects.map((subject) => (
                        <div key={subject.class_subject_id ?? subject.subject_id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{subject.subject_name}</p>
                            {subject.subject_code && (
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">{subject.subject_code}</p>
                            )}
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveSubject(subject.class_subject_id!)}
                            disabled={
                              !subject.class_subject_id ||
                              (removeSubjectMutation.isPending && removingSubjectId === subject.class_subject_id)
                            }
                          >
                            {removeSubjectMutation.isPending && removingSubjectId === subject.class_subject_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No subjects linked yet.</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
