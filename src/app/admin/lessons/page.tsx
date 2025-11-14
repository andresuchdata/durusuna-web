"use client";

import AppLayout from "@/components/layout/AppLayout";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminLessonsPage() {
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

        <AdminDashboard />
      </div>
    </AppLayout>
  );
}
