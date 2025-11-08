"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { UserDetailCard } from "@/components/users/UserDetailCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Pencil } from "lucide-react";
import { useProfile } from "@/domains/auth/hooks";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/domains/users/hooks";

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { toast } = useToast();

  const userQuery = useUser(id);
  const user = userQuery.data;

  const isAdmin = profile?.role === "admin" || profile?.user_type === "admin";
  const isTeacher = profile?.user_type === "teacher";
  const canView = isAdmin || isTeacher;
  const canEdit = isAdmin || isTeacher;

  useEffect(() => {
    if (userQuery.error) {
      toast({
        title: "User not found",
        description: "We couldn't locate that user.",
        variant: "destructive",
      });
    }
  }, [userQuery.error, toast]);

  if (profileLoading || userQuery.isLoading) {
    return (
      <AppLayout>
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          Loading...
        </div>
      </AppLayout>
    );
  }

  if (!canView) {
    return (
      <AppLayout>
        <div className="container mx-auto max-w-xl p-6">
          <Card className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-semibold">Access denied</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Only teachers and administrators can view user details.
            </p>
            <Button className="mt-6" variant="outline" onClick={() => router.back()}>
              Go back
            </Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          User not found.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-blue-50">
        <div className="container mx-auto max-w-4xl space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">User Details</h1>
              <p className="text-sm text-muted-foreground mt-1">
                View and manage user information
              </p>
            </div>
            <div className="flex gap-2">
              {canEdit && (
                <Button onClick={() => router.push(`/users/${id}/edit`)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
              <Button variant="ghost" onClick={() => router.push("/users")}>
                Back to list
              </Button>
            </div>
          </div>

          <UserDetailCard user={user} canEdit={canEdit} onEdit={() => router.push(`/users/${id}/edit`)} />
        </div>
      </div>
    </AppLayout>
  );
}

