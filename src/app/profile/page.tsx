"use client";

import AppLayout from "@/components/layout/AppLayout";
import { useProfile } from "@/domains/auth/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-48" />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!profile) return null;

  const initials = profile.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-6 max-w-4xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Profile</h1>
        
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatarUrl} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">{profile.name}</h2>
                  <p className="text-muted-foreground">{profile.email}</p>
                  <p className="text-sm text-muted-foreground mt-1 capitalize">{profile.role || "User"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">User ID</span>
                  <p className="font-mono text-sm">{profile.id}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Email</span>
                  <p className="text-sm">{profile.email}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Phone</span>
                  <p className="text-sm">{profile.phone || "Not provided"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <p className="text-sm">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                      Active
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>School Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">School</span>
                  <p className="text-sm font-medium">SDIT & SMP Darel Iman</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Academic Year</span>
                  <p className="text-sm">2024/2025</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Member Since</span>
                  <p className="text-sm">January 2024</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Last Login</span>
                  <p className="text-sm">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600">12</p>
                  <p className="text-xs text-muted-foreground mt-1">Conversations</p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">5</p>
                  <p className="text-xs text-muted-foreground mt-1">Classes</p>
                </div>
                <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">8</p>
                  <p className="text-xs text-muted-foreground mt-1">Assignments</p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">95%</p>
                  <p className="text-xs text-muted-foreground mt-1">Attendance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
