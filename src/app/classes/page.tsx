"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { useClasses, useDeleteClass } from "@/domains/classes/hooks";
import { useProfile } from "@/domains/auth/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClassCard } from "@/components/classes/ClassCard";
import { 
  Plus, 
  Search, 
  X, 
  Filter, 
  GraduationCap,
  AlertCircle,
  Sparkles,
  LayoutGrid,
  List,
} from "lucide-react";
import type { Class, ClassFilters } from "@/domains/classes/types";

type ViewMode = "grid" | "list";

export default function ClassesPage() {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<ClassFilters>({});
  const [activeFilters, setActiveFilters] = useState<ClassFilters>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Combine active filters with search
  const queryFilters = useMemo(() => ({
    ...activeFilters,
    search: debouncedSearch || undefined,
  }), [activeFilters, debouncedSearch]);

  const { data: classes, isLoading, error, refetch } = useClasses(queryFilters);
  const deleteClass = useDeleteClass();

  const role = profile?.role;
  const userType = profile?.user_type;
  const isAdmin = role === "admin" || userType === "admin";
  const isTeacher = role === "teacher" || userType === "teacher";
  const isParent = userType === "parent";
  const isStudent = userType === "student";
  const canManageClasses = isAdmin || isTeacher;
  const canViewClasses = canManageClasses || isParent || isStudent;

  const hasActiveFilters = Object.keys(activeFilters).length > 0 || searchQuery.length > 0;

  const clearFilters = () => {
    setSearchQuery("");
    setFilters({});
    setActiveFilters({});
  };

  const applyFilter = (key: keyof ClassFilters, value: string | boolean | undefined) => {
    const newFilters = { ...filters, [key]: value };
    if (value === undefined || value === "") {
      delete newFilters[key];
    }
    setFilters(newFilters);
    setActiveFilters(newFilters);
  };

  const handleEdit = (classData: Class) => {
    if (!canManageClasses) return;
    router.push(`/classes/${classData.id}/edit`);
  };

  const handleDelete = (classData: Class) => {
    if (!canManageClasses) return;
    setSelectedClass(classData);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedClass || !canManageClasses) return;

    try {
      await deleteClass.mutateAsync(selectedClass.id);
      setDeleteDialogOpen(false);
      setSelectedClass(null);
      refetch();
    } catch (error) {
      console.error("Failed to delete class:", error);
      alert("Failed to delete class. Please try again.");
    }
  };

  // Show loading state while checking profile
  if (profileLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  // Show access denied if user cannot view classes
  if (!canViewClasses) {
    return (
      <AppLayout>
        <div className="container mx-auto p-4 md:p-6">
          <div className="max-w-md mx-auto mt-20 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              You need to be assigned to a class or have administrator privileges to view this page.
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Get unique academic years and grade levels for filters
  const academicYears = Array.from(new Set(classes?.map(c => c.academic_year).filter(Boolean)));
  const gradeLevels = Array.from(new Set(classes?.map(c => c.grade_level).filter(Boolean)));

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto p-4 md:p-6 max-w-7xl">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  Class Management
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Manage and organize your classes
                </p>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-6 space-y-3 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/50">
            {/* Search Input with View Toggle */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search classes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9 bg-white border-gray-200"
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

              {/* View Mode Toggle */}
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-9 w-9 p-0"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-9 w-9 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Filter className="h-3 w-3" />
                Filters:
              </span>

              {/* Grade Level Filter */}
              {gradeLevels.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs bg-white">
                      Grade {filters.grade_level || "All"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40 bg-white">
                    <DropdownMenuLabel className="text-xs">Grade Level</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => applyFilter("grade_level", undefined)} className="text-xs">
                      All Grades
                    </DropdownMenuItem>
                    {gradeLevels.map((grade) => (
                      <DropdownMenuItem
                        key={grade}
                        onClick={() => applyFilter("grade_level", grade)}
                        className="text-xs"
                      >
                        Grade {grade}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Academic Year Filter */}
              {academicYears.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs bg-white">
                      {filters.academic_year || "All Years"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-44 bg-white">
                    <DropdownMenuLabel className="text-xs">Academic Year</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => applyFilter("academic_year", undefined)} className="text-xs">
                      All Years
                    </DropdownMenuItem>
                    {academicYears.map((year) => (
                      <DropdownMenuItem
                        key={year}
                        onClick={() => applyFilter("academic_year", year)}
                        className="text-xs"
                      >
                        {year}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Status Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs bg-white">
                    {filters.is_active === true ? "Active" : filters.is_active === false ? "Inactive" : "All Status"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-36 bg-white">
                  <DropdownMenuLabel className="text-xs">Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => applyFilter("is_active", undefined)} className="text-xs">
                    All Status
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => applyFilter("is_active", true)} className="text-xs">
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => applyFilter("is_active", false)} className="text-xs">
                    Inactive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 text-xs text-gray-500 hover:text-gray-700"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear all
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-4"}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border">
                  <Skeleton className="h-32 w-full" />
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex gap-2 pt-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl border">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <p className="text-sm text-red-600 mb-2">Failed to load classes</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : classes && classes.length > 0 ? (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-4"}>
              {classes.map((classData) => (
                <ClassCard
                  key={classData.id}
                  classData={classData}
                  onEdit={canManageClasses ? handleEdit : undefined}
                  onDelete={canManageClasses ? handleDelete : undefined}
                  canManage={canManageClasses}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-2xl border">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No classes yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {hasActiveFilters
                  ? "No classes match your filters. Try adjusting your search."
                  : "Get started by creating your first class."}
              </p>
              {!hasActiveFilters && canManageClasses && (
                <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Link href="/classes/new" className="inline-flex items-center">
                    <Plus className="h-5 w-5 mr-2" />
                    Create Class
                  </Link>
                </Button>
              )}
            </div>
          )}

          {/* Floating Action Button */}
          {canManageClasses && (
            <Link
              href="/classes/new"
              className="fixed bottom-20 md:bottom-8 right-4 md:right-8 h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl transition-all flex items-center justify-center z-40 group"
              aria-label="Create class"
            >
              <Plus className="h-7 w-7 group-hover:rotate-90 transition-transform" />
            </Link>
          )}

          {/* Delete Confirmation Dialog */}
          {canManageClasses && (
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Class</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this class? This will mark it as inactive.
                    {selectedClass && (
                      <span className="block mt-2 font-semibold text-foreground">
                        &ldquo;{selectedClass.name}&rdquo;
                      </span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleteClass.isPending}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteConfirm}
                    disabled={deleteClass.isPending}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleteClass.isPending ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
