"use client";

import AppLayout from "@/components/layout/AppLayout";
import TeacherDashboard from "@/components/dashboard/TeacherDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import { useProfile } from "@/domains/auth/hooks";

function ParentDashboard() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:py-8 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Parent Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Track your child&apos;s classes and upcoming lessons.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-sm text-muted-foreground">
        Parent-focused insights will appear here.
      </div>
    </div>
  );
}

function StudentDashboard() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:py-8 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Student Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Review assignments, upcoming lessons, and grades in one place.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-sm text-muted-foreground">
        Student progress widgets will be available soon.
      </div>
    </div>
  );
}

export default function Home() {
  const { data: profile, isLoading } = useProfile();

  return (
    <AppLayout>
      {isLoading || !profile ? (
        <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">
          Loading dashboard…
        </div>
      ) : profile.user_type === "teacher" ? (
        <TeacherDashboard />
      ) : profile.user_type === "admin" || profile.role === "admin" ? (
        <AdminDashboard />
      ) : profile.user_type === "parent" ? (
        <ParentDashboard />
      ) : profile.user_type === "student" ? (
        <StudentDashboard />
      ) : (
        <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">
          Dashboard coming soon for your role.
        </div>
      )}
    </AppLayout>
  );
}
