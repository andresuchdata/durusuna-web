"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import {
  useClass,
  useClassStudents,
  useClassTeachers,
  useClassSubjects,
  useDeleteClass,
} from "@/domains/classes/hooks";
import { useProfile } from "@/domains/auth/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditClassDialog } from "@/components/classes/EditClassDialog";
import {
  ArrowLeft,
  Users,
  UserCheck,
  BookOpen,
  Search,
  X,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  GraduationCap,
  Mail,
  Clock,
  AlertCircle,
  Building2,
} from "lucide-react";

type TabType = "students" | "teachers" | "subjects";

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params?.id as string;

  const { data: profile } = useProfile();
  const { data: classData, isLoading: classLoading, error: classError } = useClass(classId);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: studentsData, isLoading: studentsLoading } = useClassStudents(classId, {
    search: searchQuery,
  });
  const { data: teachersData, isLoading: teachersLoading } = useClassTeachers(classId);
  const { data: subjectsData, isLoading: subjectsLoading } = useClassSubjects(classId);
  const deleteClass = useDeleteClass();

  const [activeTab, setActiveTab] = useState<TabType>("students");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const students = studentsData?.students || [];
  const teachers = teachersData?.teachers || [];
  const subjects = subjectsData?.subjects || [];

  const role = profile?.role;
  const userType = profile?.user_type;
  const isAdmin = role === "admin" || userType === "admin";
  const isTeacher = role === "teacher" || userType === "teacher";
  const canManageClass = isAdmin || isTeacher;

  const handleDelete = async () => {
    if (!classData || !canManageClass) return;
    try {
      await deleteClass.mutateAsync(classData.id);
      setDeleteDialogOpen(false);
      router.push("/classes");
    } catch (error) {
      console.error("Failed to delete class:", error);
      alert("Failed to delete class. Please try again.");
    }
  };

  const handleEditSuccess = () => {
    // Data will auto-refresh via React Query
  };

  if (classLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-6">
          <div className="container mx-auto max-w-6xl">
            <Skeleton className="h-64 w-full rounded-3xl mb-6" />
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (classError || !classData) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center py-20">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Class Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The class you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
              </p>
              <Button onClick={() => router.push("/classes")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Classes
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-4 md:p-6 max-w-6xl">
          {/* Header - Clean minimalist design */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border mb-6">
            {/* Back button and actions */}
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/classes")}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Classes
              </Button>

              {canManageClass && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Class
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteDialogOpen(true)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Class
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Class info */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center shrink-0">
                <GraduationCap className="h-8 w-8 text-gray-700" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {classData.name}
                </h1>
                {classData.description && (
                  <p className="text-gray-600 text-base">{classData.description}</p>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              {classData.grade_level && (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  Grade {classData.grade_level}
                </Badge>
              )}
              {classData.section && (
                <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                  Section {classData.section}
                </Badge>
              )}
              {classData.academic_year && (
                <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
                  <Calendar className="h-3 w-3 mr-1" />
                  {classData.academic_year}
                </Badge>
              )}
              <Badge
                variant="secondary"
                className={
                  classData.is_active
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-gray-100 text-gray-600 border-gray-200"
                }
              >
                {classData.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{students.length}</div>
                  <div className="text-xs text-gray-600">Students</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{teachers.length}</div>
                  <div className="text-xs text-gray-600">Teachers</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{subjects.length}</div>
                  <div className="text-xs text-gray-600">Subjects</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="border-b">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("students")}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeTab === "students"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Students ({students.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab("teachers")}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeTab === "teachers"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
                  }`}
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Teachers ({teachers.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab("subjects")}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeTab === "subjects"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Subjects ({subjects.length})</span>
                </button>
              </div>
            </div>

            {/* Search bar (only for students) */}
            {activeTab === "students" && (
              <div className="p-6 border-b bg-gray-50">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-9 bg-white"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "students" && (
                studentsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-64" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : students.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {students.map((student: {id: string; first_name: string; last_name: string; email: string; avatar_url?: string; student_id?: string; role_in_class?: string}) => (
                      <div
                        key={student.id}
                        className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors bg-white border"
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={student.avatar_url} />
                          <AvatarFallback className="bg-blue-100 text-blue-700">
                            {`${student.first_name?.[0] || ""}${student.last_name?.[0] || ""}`.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm">
                            {student.first_name} {student.last_name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{student.email}</span>
                          </div>
                          {student.student_id && (
                            <p className="text-xs text-muted-foreground mt-1">
                              ID: {student.student_id}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {student.role_in_class || "Student"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No students enrolled</p>
                    <p className="text-sm">
                      {searchQuery
                        ? "No students match your search"
                        : "This class doesn't have any students yet"}
                    </p>
                  </div>
                )
              )}

              {activeTab === "teachers" && (
                teachersLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-64" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : teachers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teachers.map((teacher: {id: string; first_name: string; last_name: string; email: string; avatar_url?: string; employee_id?: string; role_in_class?: string}) => (
                      <div
                        key={teacher.id}
                        className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors bg-white border"
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={teacher.avatar_url} />
                          <AvatarFallback className="bg-green-100 text-green-700">
                            {`${teacher.first_name?.[0] || ""}${teacher.last_name?.[0] || ""}`.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm">
                            {teacher.first_name} {teacher.last_name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{teacher.email}</span>
                          </div>
                          {teacher.employee_id && (
                            <p className="text-xs text-muted-foreground mt-1">
                              ID: {teacher.employee_id}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs bg-green-50 border-green-200 text-green-700 shrink-0"
                        >
                          {teacher.role_in_class || "Teacher"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <UserCheck className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No teachers assigned</p>
                    <p className="text-sm">This class doesn&apos;t have any teachers assigned yet</p>
                  </div>
                )
              )}

              {activeTab === "subjects" && (
                subjectsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="p-4 bg-white rounded-xl">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : subjects.length > 0 ? (
                  <div className="space-y-3">
                    {subjects.map((subject) => {
                      const teacherName = subject.teacher
                        ? [subject.teacher.first_name, subject.teacher.last_name]
                            .filter(Boolean)
                            .join(" ")
                        : "";

                      return (
                        <div
                          key={subject.subject_id}
                          className="p-4 rounded-xl hover:bg-gray-50 transition-colors bg-white border"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-base mb-1">
                                {subject.subject_name}
                              </h4>
                              {subject.subject_code && (
                                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                                  {subject.subject_code}
                                </p>
                              )}
                              {subject.subject_description && (
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                  {subject.subject_description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                {teacherName && (
                                  <div className="flex items-center gap-1.5">
                                    <UserCheck className="h-4 w-4 text-green-600" />
                                    <span>{teacherName}</span>
                                  </div>
                                )}
                                {subject.classroom && (
                                  <div className="flex items-center gap-1.5">
                                    <Building2 className="h-4 w-4 text-blue-600" />
                                    <span>Room {subject.classroom}</span>
                                  </div>
                                )}
                                {typeof subject.hours_per_week === "number" && subject.hours_per_week > 0 && (
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4 text-purple-600" />
                                    <span>{subject.hours_per_week} hr/week</span>
                                  </div>
                                )}
                                {subject.lessons && subject.lessons.length > 0 && (
                                  <div className="flex items-center gap-1.5">
                                    <BookOpen className="h-4 w-4 text-amber-600" />
                                    <span>{subject.lessons.length} lessons</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No subjects yet</p>
                    <p className="text-sm">
                      Subjects will appear here once they become available for this class.
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      {canManageClass && (
        <EditClassDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={handleEditSuccess}
          classData={classData}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {canManageClass && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Class</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this class? This will mark it as inactive.
                <span className="block mt-2 font-semibold text-foreground">
                  &ldquo;{classData.name}&rdquo;
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteClass.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteClass.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteClass.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AppLayout>
  );
}

