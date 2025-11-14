"use client";

import AppLayout from "@/components/layout/AppLayout";
import { AdminLessonForm } from "@/components/admin/AdminLessonForm";
import { useParams } from "next/navigation";

export default function AdminEditLessonPage() {
  const params = useParams();
  const lessonId = typeof params.lessonId === "string" ? params.lessonId : Array.isArray(params.lessonId) ? params.lessonId[0] : "";

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-4xl px-4 py-6 md:py-8 space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">Edit Lesson</h1>
          <p className="text-sm text-muted-foreground">
            Update the schedule or details for this lesson instance.
          </p>
        </header>
        {lessonId && <AdminLessonForm mode="edit" lessonId={lessonId} />}
      </div>
    </AppLayout>
  );
}
