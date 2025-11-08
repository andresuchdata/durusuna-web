"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { UserForm } from "@/components/users/UserForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useProfile } from "@/domains/auth/hooks";
import { useToast } from "@/components/ui/use-toast";
import { useUpdateUser, useUser } from "@/domains/users/hooks";

export default function UserEditPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { toast } = useToast();

  const userQuery = useUser(id);
  const updateUser = useUpdateUser(id);

  const user = userQuery.data;

  const isAdmin = profile?.role === "admin" || profile?.user_type === "admin";
  const isTeacher = profile?.user_type === "teacher";
  const canEdit = isAdmin || isTeacher;

  const handleUpdate = async (payload: Parameters<typeof updateUser.mutateAsync>[0]) => {
    try {
      await updateUser.mutateAsync(payload);
      toast({ title: "User updated", description: "Changes have been saved successfully." });
      router.push(`/users/${id}`);
    } catch (error) {
      toast({
        title: "Failed to update user",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

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

  if (!canEdit) {
    return (
      <AppLayout>
        <div className="container mx-auto max-w-xl p-6">
          <Card className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-semibold">Access denied</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Only teachers and administrators can edit users.
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
              <h1 className="text-3xl font-bold text-slate-900">Edit User</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Update user information and settings
              </p>
            </div>
            <Button variant="ghost" onClick={() => router.push(`/users/${id}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>

          <Card className="p-6 md:p-8">
            <UserForm
              mode="edit"
              onSubmit={handleUpdate}
              initialData={user}
              isSubmitting={updateUser.isPending}
              canEditRole={isAdmin}
            />
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

