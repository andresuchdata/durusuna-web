"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { UserToolbar } from "@/components/users/UserToolbar";
import { UserTableSortable } from "@/components/users/UserTableSortable";
import type { SortConfig } from "@/lib/tableUtils";
import { UserFormDialog } from "@/components/users/UserFormDialog";
import { UserBatchDialog } from "@/components/users/UserBatchDialog";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { useProfile } from "@/domains/auth/hooks";
import {
  useBatchCreateUsers,
  useCreateUser,
  useDeleteUser,
  useUsers,
} from "@/domains/users/hooks";
import type { User } from "@/domains/users/types";
import { useToast } from "@/components/ui/use-toast";

type UserTypeFilter = "all" | "teacher" | "student" | "parent" | "admin";

export default function UsersPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { toast } = useToast();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [userType, setUserType] = useState<UserTypeFilter>("all");
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [dobFrom, setDobFrom] = useState<Date | undefined>(undefined);
  const [dobTo, setDobTo] = useState<Date | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isBatchOpen, setBatchOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({
    key: 'name',
    direction: 'asc'
  });

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(handler);
  }, [search]);

  const queryParams = useMemo(
    () => ({
      page,
      limit: pageSize,
      search: debouncedSearch || undefined,
      userType: userType === "all" ? undefined : userType,
      isActive: isActive !== null ? isActive : undefined,
      dobFrom: dobFrom ? dobFrom.toISOString().split("T")[0] : undefined,
      dobTo: dobTo ? dobTo.toISOString().split("T")[0] : undefined,
    }),
    [page, pageSize, debouncedSearch, userType, isActive, dobFrom, dobTo]
  );

  const usersQuery = useUsers(queryParams);
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const batchCreateUsers = useBatchCreateUsers();

  const isAdmin = profile?.role === "admin" || profile?.user_type === "admin";
  const isTeacher = profile?.user_type === "teacher";
  const canView = isAdmin || isTeacher;

  const canCreate = isAdmin;
  const canEdit = isAdmin || isTeacher;
  const canDelete = isAdmin;

  const handleCreate = async (payload: Parameters<typeof createUser.mutateAsync>[0]) => {
    try {
      await createUser.mutateAsync(payload);
      toast({ title: "User created", description: "The new user can now access the platform." });
    } catch (error) {
      toast({ title: "Failed to create user", description: (error as Error).message, variant: "destructive" });
      throw error;
    }
  };


  const handleDelete = async (user: User) => {
    try {
      await deleteUser.mutateAsync(user.id);
      toast({ title: "User deactivated", description: `${user.first_name} ${user.last_name} no longer has access.` });
    } catch (error) {
      toast({ title: "Failed to delete user", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleBatchCreate = async (payload: Parameters<typeof batchCreateUsers.mutateAsync>[0]) => {
    try {
      await batchCreateUsers.mutateAsync(payload);
      toast({ title: "Users created", description: `${payload.users.length} users were added successfully.` });
    } catch (error) {
      toast({ title: "Batch creation failed", description: (error as Error).message, variant: "destructive" });
      throw error;
    }
  };

  const handleEditClick = (user: User) => {
    router.push(`/users/${user.id}/edit`);
  };

  const handleSortChange = (newSortConfig: SortConfig | null) => {
    setSortConfig(newSortConfig);
    setPage(1); // Reset to first page when sorting changes
  };

  useEffect(() => {
    setTimeout(() => {
      setPage(1);
    }, 0);
  }, [debouncedSearch, userType, isActive, dobFrom, dobTo, pageSize]);

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>
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
              Only teachers and administrators can manage users.
            </p>
            <Button className="mt-6" variant="outline" onClick={() => router.back()}>
              Go back
            </Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-blue-50">
        <div className="container mx-auto max-w-6xl space-y-6 p-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">User management</h1>
            <p className="text-sm text-muted-foreground">Search, filter, and manage all members of your organisation.</p>
          </div>

          <UserToolbar
            search={search}
            onSearchChange={setSearch}
            userType={userType}
            onUserTypeChange={setUserType}
            isActive={isActive}
            onIsActiveChange={setIsActive}
            dobFrom={dobFrom}
            dobTo={dobTo}
            onDobFromChange={setDobFrom}
            onDobToChange={setDobTo}
            canCreate={canCreate}
            onCreate={() => setCreateOpen(true)}
            onBatchCreate={() => setBatchOpen(true)}
          />

          <UserTableSortable
            users={usersQuery.data?.users}
            isLoading={usersQuery.isLoading}
            page={page}
            pageSize={usersQuery.data?.limit ?? pageSize}
            total={usersQuery.data?.total ?? 0}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={handleEditClick}
            onDelete={canDelete ? handleDelete : undefined}
            defaultSort={sortConfig ?? undefined}
            onSortChange={handleSortChange}
            enableServerSort={false}
          />
        </div>
      </div>

      <UserFormDialog
        mode="create"
        open={isCreateOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isSubmitting={createUser.isPending}
        canEditRole={true}
      />

      <UserBatchDialog
        open={isBatchOpen}
        onOpenChange={setBatchOpen}
        onSubmit={handleBatchCreate}
        isSubmitting={batchCreateUsers.isPending}
      />
    </AppLayout>
  );
}

