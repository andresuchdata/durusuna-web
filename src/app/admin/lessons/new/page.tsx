"use client";

import AppLayout from "@/components/layout/AppLayout";
import { AdminLessonForm } from "@/components/admin/AdminLessonForm";

export default function AdminCreateLessonPage() {
  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-4xl px-4 py-6 md:py-8 space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">Create Lesson</h1>
          <p className="text-sm text-muted-foreground">
            Schedule a new lesson instance for a specific class and subject.
          </p>
        </header>
        <AdminLessonForm mode="create" />
      </div>
    </AppLayout>
  );
}
