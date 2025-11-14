"use client";

import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAdminLessonsDashboard } from "@/domains/lessons/hooks";

export default function AdminLessonsPage() {
  const { data, isLoading, isError } = useAdminLessonsDashboard({
    limit: 20,
  });

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-5xl px-4 py-6 md:py-8 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Lessons overview</h1>
            <p className="text-sm text-muted-foreground">
              Review upcoming and recent lessons across the school.
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/admin/lessons/new">Create lesson</Link>
          </Button>
        </div>

        <div className="border rounded-lg bg-white">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="text-sm font-semibold text-slate-800">All lessons</h2>
          </div>
          <div className="px-4 py-3 text-sm">
            {isLoading && <p className="text-muted-foreground">Loading lessons...</p>}
            {isError && <p className="text-red-600">Failed to load lessons.</p>}
            {!isLoading && !isError && (!data || data.lessons.length === 0) && (
              <p className="text-muted-foreground">No lessons found.</p>
            )}
            {!isLoading && !isError && data && data.lessons.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Title</th>
                      <th className="px-3 py-2">Subject</th>
                      <th className="px-3 py-2">Class</th>
                      <th className="px-3 py-2">Teacher</th>
                      <th className="px-3 py-2">Start</th>
                      <th className="px-3 py-2">End</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lessons.map((lesson) => (
                      <tr key={lesson.id} className="border-b last:border-b-0">
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {lesson.title || "(No title)"}
                        </td>
                        <td className="px-3 py-2">{lesson.subject_name || "-"}</td>
                        <td className="px-3 py-2">{lesson.class_name || "-"}</td>
                        <td className="px-3 py-2">{lesson.teacher_name || "-"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {new Date(lesson.scheduled_start).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {new Date(lesson.scheduled_end).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 capitalize">{lesson.status.replace("_", " ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
