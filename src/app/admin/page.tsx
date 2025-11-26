"use client";

import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminHomePage() {
  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-4xl px-4 py-6 md:py-8 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Central place for school administration tasks.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-800">User management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Manage staff, teachers, students, and parents for this school.</p>
              <Button asChild size="sm">
                <Link href="/users">Go to users</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-800">Lessons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>View and schedule lesson instances for specific classes and subjects.</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/lessons">Open lesson overview</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/admin/lessons/new">Create lesson</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
