import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboard() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">School Overview</h1>
        <p className="text-sm text-muted-foreground">
          Review upcoming and recent lessons across the entire school.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-800">All Lessons</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Lesson insights for administrators will appear here once implemented.
        </CardContent>
      </Card>
    </div>
  );
}
