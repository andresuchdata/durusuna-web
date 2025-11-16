"use client";

import AppLayout from "@/components/layout/AppLayout";
import { useProfile } from "@/domains/auth/hooks";
import HomeLessonDashboard from "@/components/dashboard/HomeLessonDashboard";
import StudentLessonsPage from "../student/lessons/page";
import ParentLessonsPage from "../parent/lessons/page";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function LessonsPage() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading || !profile) {
    return (
      <AppLayout>
        <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">Loading lessons…</div>
      </AppLayout>
    );
  }

  if (profile.user_type === "student") {
    return <StudentLessonsPage />;
  }

  if (profile.user_type === "parent") {
    return <ParentLessonsPage />;
  }

  if (profile.user_type === "teacher") {
    return (
      <AppLayout>
        <HomeLessonDashboard />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-xl px-4 py-12">
        <Card>
          <CardContent className="flex flex-col items-center text-center space-y-3 py-8">
            <AlertCircle className="h-8 w-8 text-amber-500" />
            <h1 className="text-lg font-semibold">Lessons view not available</h1>
            <p className="text-sm text-muted-foreground">
              A dedicated lessons page for your role will be added soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
