"use client";

import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import { HomeLessonDashboard } from "@/components/dashboard/HomeLessonDashboard";
import { useProfile } from "@/domains/auth/hooks";
import { Button } from "@/components/ui/button";
import { ArrowRight, ClipboardCheck, FileText, GraduationCap, Users, BookOpenCheck, Sparkles, Calendar } from "lucide-react";

type QuickAction = {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles: Array<"admin" | "teacher" | "student" | "parent">;
  color: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    key: "attendance",
    label: "Attendance",
    description: "Take or review today's attendance records.",
    href: "/attendance",
    icon: ClipboardCheck,
    roles: ["teacher"],
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    key: "assignments",
    label: "Assignments",
    description: "Create, submit, or grade assignments.",
    href: "/assignments",
    icon: FileText,
    roles: ["teacher", "student", "parent"],
    color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  {
    key: "grades",
    label: "Grades",
    description: "Track assessment progress and feedback.",
    href: "/grades",
    icon: GraduationCap,
    roles: ["teacher", "student", "parent"],
    color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  {
    key: "classes",
    label: "Classes",
    description: "See class rosters, schedules, and updates.",
    href: "/classes",
    icon: Users,
    roles: ["admin", "teacher", "student", "parent"],
    color: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  },
  {
    key: "updates",
    label: "Updates",
    description: "Catch up on the latest school news.",
    href: "/class-updates",
    icon: BookOpenCheck,
    roles: ["admin", "teacher", "student", "parent"],
    color: "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
  },
];

export default function Home() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading || !profile) {
    return (
      <AppLayout>
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-muted-foreground animate-fade-in">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p>Loading dashboard...</p>
        </div>
      </AppLayout>
    );
  }

  const role = (profile.user_type as QuickAction["roles"][number]) ?? (profile.role === "admin" ? "admin" : "teacher");
  const firstName = profile.first_name || profile.name?.split(" ")?.[0] || profile.email;
  const availableActions = QUICK_ACTIONS.filter((action) => action.roles.includes(role));

  const renderRoleDashboard = () => {
    if (profile.user_type === "admin" || profile.role === "admin") return <AdminDashboard />;
    return <HomeLessonDashboard />;
  };

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50/50 dark:bg-background">
        {/* Hero Section with modern gradient background */}
        <div className="relative overflow-hidden bg-white dark:bg-card pb-12 pt-8 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
          <div className="absolute inset-y-0 right-0 -z-10 w-[50%] bg-gradient-to-l from-blue-50/50 to-transparent dark:from-blue-900/10" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="space-y-4 animate-slideRightAndFade">
                <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  <Calendar className="mr-1.5 h-3.5 w-3.5" />
                  {today}
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                    Welcome back, <span className="text-primary">{firstName}</span>
                  </h1>
                  <p className="mt-3 text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
                    Here's what's happening in your classrooms today. You have pending tasks to review.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 pt-2">
                  <Button asChild size="lg" className="shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/40">
                    <Link href="/classes">
                      View Classes
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
                    <Link href="/conversations">
                      Messages
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Tips Card */}
              <div className="md:w-80 lg:w-96 animate-slideLeftAndFade delay-100">
                <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-[1px] shadow-xl shadow-blue-500/10">
                  <div className="rounded-2xl bg-white dark:bg-slate-900 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">Daily Focus</h3>
                    </div>
                    <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                      <li className="flex gap-2">
                        <span className="block h-1.5 w-1.5 mt-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span>Check attendance for morning sessions</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="block h-1.5 w-1.5 mt-1.5 rounded-full bg-indigo-500 shrink-0" />
                        <span>Review 3 pending assignment submissions</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
          {/* Quick Actions Grid */}
          <section className="animate-slideUpAndFade delay-200">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quick Actions</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Frequently used tools for your role</p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {availableActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.key}
                    href={action.href}
                    className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
                  >
                    <div className={`mb-4 inline-flex rounded-lg p-3 ${action.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-1 font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                      {action.label}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {action.description}
                    </p>
                    <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br from-blue-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-blue-900/20" />
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Main Dashboard Content */}
          <section className="animate-slideUpAndFade delay-300">
            {renderRoleDashboard()}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
