"use client";

import { useState } from "react";
import { useClassStudents, useClassTeachers } from "@/domains/classes/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, UserCheck, Search, X, Mail, Calendar, GraduationCap } from "lucide-react";
import type { Class } from "@/domains/classes/types";

interface ClassDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData: Class | null;
}

type TabType = "students" | "teachers";

export function ClassDetailsDialog({
  open,
  onOpenChange,
  classData,
}: ClassDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>("students");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: studentsData, isLoading: studentsLoading } = useClassStudents(
    classData?.id,
    { search: searchQuery }
  );
  const { data: teachersData, isLoading: teachersLoading } = useClassTeachers(classData?.id);

  if (!classData) return null;

  const students = studentsData?.students || [];
  const teachers = teachersData?.teachers || [];

  // Generate gradient based on class ID (same as ClassCard)
  const gradients = [
    "from-purple-500 to-pink-500",
    "from-blue-500 to-cyan-500",
    "from-green-500 to-emerald-500",
    "from-orange-500 to-red-500",
    "from-indigo-500 to-purple-500",
    "from-teal-500 to-green-500",
    "from-rose-500 to-pink-500",
    "from-amber-500 to-orange-500",
  ];
  const hash = classData.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradient = gradients[hash % gradients.length];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-br ${gradient} p-6 text-white`}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              {classData.name}
            </DialogTitle>
            <DialogDescription className="text-white/90 text-base">
              {classData.description || "Class details and members"}
            </DialogDescription>
          </DialogHeader>

          {/* Class Info */}
          <div className="mt-4 flex flex-wrap gap-3">
            {classData.grade_level && (
              <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-0 hover:bg-white/30">
                <GraduationCap className="h-3 w-3 mr-1" />
                Grade {classData.grade_level}
              </Badge>
            )}
            {classData.section && (
              <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-0 hover:bg-white/30">
                Section {classData.section}
              </Badge>
            )}
            {classData.academic_year && (
              <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-0 hover:bg-white/30">
                <Calendar className="h-3 w-3 mr-1" />
                {classData.academic_year}
              </Badge>
            )}
            <Badge 
              variant="secondary" 
              className={classData.is_active 
                ? "bg-green-500/30 backdrop-blur-sm text-white border-0" 
                : "bg-gray-500/30 backdrop-blur-sm text-white border-0"}
            >
              {classData.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab("students")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "students"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Students ({students.length})
            </button>
            <button
              onClick={() => setActiveTab("teachers")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "teachers"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserCheck className="h-4 w-4 inline mr-2" />
              Teachers ({teachers.length})
            </button>
          </div>
        </div>

        {/* Search bar (only for students) */}
        {activeTab === "students" && (
          <div className="px-6 pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
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

        {/* Content */}
        <ScrollArea className="flex-1 px-6 pb-6" style={{ maxHeight: "400px" }}>
          {activeTab === "students" ? (
            studentsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : students.length > 0 ? (
              <div className="space-y-2 mt-4">
                {students.map((student: any) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student.avatar_url} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                        {`${student.first_name?.[0] || ""}${student.last_name?.[0] || ""}`.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">
                        {student.first_name} {student.last_name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{student.email}</span>
                      </div>
                      {student.student_id && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ID: {student.student_id}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {student.role_in_class || "Student"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  {searchQuery ? "No students found" : "No students enrolled yet"}
                </p>
              </div>
            )
          ) : teachersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : teachers.length > 0 ? (
            <div className="space-y-2 mt-4">
              {teachers.map((teacher: any) => (
                <div
                  key={teacher.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={teacher.avatar_url} />
                    <AvatarFallback className="bg-green-100 text-green-700 text-sm">
                      {`${teacher.first_name?.[0] || ""}${teacher.last_name?.[0] || ""}`.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">
                      {teacher.first_name} {teacher.last_name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{teacher.email}</span>
                    </div>
                    {teacher.employee_id && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ID: {teacher.employee_id}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                    {teacher.role_in_class || "Teacher"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No teachers assigned yet</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

