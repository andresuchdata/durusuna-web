"use client";

import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import { HomeLessonDashboard } from "@/components/dashboard/HomeLessonDashboard";
import { useProfile } from "@/domains/auth/hooks";
import { Button } from "@/components/ui/button";
import { ArrowRight, ClipboardCheck, FileText, GraduationCap, Users, BookOpenCheck } from "lucide-react";

type QuickAction = {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles: Array<"admin" | "teacher" | "student" | "parent">;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    key: "attendance",
    label: "Attendance",
    description: "Take or review today&apos;s attendance records.",
    href: "/attendance",
    icon: ClipboardCheck,
    roles: ["teacher"],
  },
  {
    key: "assignments",
    label: "Assignments",
    description: "Create, submit, or grade assignments.",
    href: "/assignments",
    icon: FileText,
    roles: ["teacher", "student", "parent"],
  },
  {
    key: "grades",
    label: "Grades",
    description: "Track assessment progress and feedback.",
    href: "/grades",
    icon: GraduationCap,
    roles: ["teacher", "student", "parent"],
  },
  {
    key: "classes",
    label: "Classes",
    description: "See class rosters, schedules, and updates.",
    href: "/classes",
    icon: Users,
    roles: ["admin", "teacher", "student", "parent"],
  },
  {
    key: "updates",
    label: "Updates",
    description: "Catch up on the latest school news.",
    href: "/class-updates",
    icon: BookOpenCheck,
    roles: ["admin", "teacher", "student", "parent"],
  },
];

function ParentDashboard() {
  return (
    <div className="w-full max-w-4xl space-y-4">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-900">Parent insights</h2>
        <p className="text-sm text-muted-foreground">
          Track your child&apos;s classes, lesson plans, and progress.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Lesson overview</p>
            <p className="text-xs text-muted-foreground">
              See what each class is covering on a given day, grouped by class.
            </p>
          </div>
          <Button asChild size="sm" className="mt-1">
            <Link href="/lessons">
              See more
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-xs text-muted-foreground">
          More detailed parent dashboards (attendance summaries, progress, and alerts) will appear here in a future
          update.
        </div>
      </div>
    </div>
  );
}

function StudentDashboard() {
  return (
    <div className="w-full max-w-4xl space-y-4">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-900">Student overview</h2>
        <p className="text-sm text-muted-foreground">Review assignments, lessons, and grades in one place.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Today&apos;s lessons</p>
            <p className="text-xs text-muted-foreground">
              Choose a class and date to see the lessons planned for that day.
            </p>
          </div>
          <Button asChild size="sm" className="mt-1">
            <Link href="/lessons">
              See more
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-xs text-muted-foreground">
          More student insights (attendance streaks, assignment deadlines, and grade trends) will appear here in a
          future update.
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading || !profile) {
    return (
      <AppLayout>
        <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">Loading dashboard…</div>
      </AppLayout>
    );
  }

  const role = (profile.user_type as QuickAction["roles"][number]) ?? (profile.role === "admin" ? "admin" : "teacher");
  const firstName = profile.first_name || profile.name?.split(" ")?.[0] || profile.email;
  const availableActions = QUICK_ACTIONS.filter((action) => action.roles.includes(role));

  const renderRoleDashboard = () => {
    if (profile.user_type === "teacher") return <HomeLessonDashboard />;
    if (profile.user_type === "admin" || profile.role === "admin") return <AdminDashboard />;
    if (profile.user_type === "parent") return <ParentDashboard />;
    if (profile.user_type === "student") return <StudentDashboard />;
    return (
      <div className="min-h-[30vh] flex items-center justify-center text-muted-foreground">
        Dashboard coming soon for your role.
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-emerald-50">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 md:px-8 md:py-10">
          <section className="rounded-3xl bg-white/80 px-6 py-8 shadow-sm ring-1 ring-slate-100">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <p className="text-sm font-medium uppercase tracking-wide text-blue-600">Welcome back</p>
                <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
                  Hi {firstName}, let&apos;s make today impactful ✨
                </h1>
                <p className="text-base text-muted-foreground">
                  Access your most-used tools in one place. Attendance, assignments, grades, and more are just a click
                  away.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="default" className="gap-2">
                    <Link href="/classes">
                      View classes
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="gap-2">
                    <Link href="/conversations">
                      Open conversations
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl border border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-emerald-50 p-6 text-sm text-slate-600">
                <p className="text-base font-semibold text-slate-900">Today&apos;s tips</p>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>Check attendance as soon as lessons start.</li>
                  <li>Share a quick update with guardians after class.</li>
                  <li>Review assignments that were submitted overnight.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
                <p className="text-sm text-muted-foreground">Shortcuts tailored for your role.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availableActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.key}
                    href={action.href}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:text-blue-600" />
                    </div>
                    <div className="mt-4 space-y-1">
                      <p className="text-base font-semibold text-slate-900">{action.label}</p>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="pb-12">
            {renderRoleDashboard()}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
