"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SortableTable, type ColumnConfig } from "@/components/ui/sortable-table";
import { PageSizeSelect } from "@/components/ui/page-size-select";
import type { SortConfig } from "@/lib/tableUtils";
import type { User } from "@/domains/users/types";

type UserTableSortableProps = {
  users?: User[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  canEdit: boolean;
  canDelete: boolean;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => Promise<void> | void;
  onSortChange?: (sort: SortConfig | null) => void;
  defaultSort?: SortConfig;
  enableServerSort?: boolean; // For server-side sorting
};

// Helper functions
function formatName(user: User) {
  return `${user.first_name} ${user.last_name}`.trim();
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "U";
}

function formatUserType(userType: User["user_type"]) {
  return userType.charAt(0).toUpperCase() + userType.slice(1);
}

function renderUserType(userType: User["user_type"]) {
  const colors = {
    teacher: "bg-blue-100 text-blue-700 border-blue-200",
    student: "bg-emerald-100 text-emerald-700 border-emerald-200",
    parent: "bg-purple-100 text-purple-700 border-purple-200",
    admin: "bg-amber-100 text-amber-700 border-amber-200",
  };
  return (
    <Badge variant="outline" className={`text-xs font-medium ${colors[userType] || colors.teacher}`}>
      {formatUserType(userType)}
    </Badge>
  );
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "—";
  try {
    return format(new Date(dateString), "MMM dd, yyyy");
  } catch {
    return "—";
  }
}

function getUserID(user: User) {
  if (user.user_type === "student" && user.student_id) {
    return user.student_id;
  }
  if (user.user_type === "teacher" && user.employee_id) {
    return user.employee_id;
  }
  return "—";
}

function renderStatus(user: User) {
  if (user.is_active === false) {
    return (
      <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
        Inactive
      </Badge>
    );
  }
  return <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>;
}

export function UserTableSortable({
  users = [],
  isLoading,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onSortChange,
  defaultSort,
  enableServerSort = false,
}: UserTableSortableProps) {
  const [pendingDelete, setPendingDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate pagination
  const totalPages = useMemo(() => {
    if (!total || total <= 0) return 1;
    return Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  }, [total, pageSize]);

  const effectivePageSize = Math.max(1, pageSize);
  const start = total === 0 ? 0 : (page - 1) * effectivePageSize + 1;
  const end = total === 0 ? 0 : Math.min(total, page * effectivePageSize);

  const handleConfirmDelete = async () => {
    if (!pendingDelete || !onDelete) {
      setPendingDelete(null);
      return;
    }

    try {
      setIsDeleting(true);
      await onDelete(pendingDelete);
    } finally {
      setIsDeleting(false);
      setPendingDelete(null);
    }
  };

  // Define table columns with sorting configuration
  const columns: ColumnConfig<User>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      sortKey: 'first_name', // Sort by first name
      sticky: true,
      minWidth: '200px',
      render: (user) => (
        <Link
          href={`/users/${user.id}`}
          className="flex items-center gap-3 group"
        >
          <Avatar className="h-10 w-10 ring-2 ring-border ring-offset-1">
            <AvatarImage src={user.avatar_url || undefined} alt={formatName(user)} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
              {getInitials(user.first_name, user.last_name)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
            {formatName(user)}
          </span>
        </Link>
      ),
    },
    {
      key: 'id_display',
      header: 'ID',
      sortable: true,
      sortKey: 'student_id', // Sort by student_id or employee_id
      minWidth: '120px',
      render: (user) => (
        <span className="text-sm text-muted-foreground font-mono">
          {getUserID(user)}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      minWidth: '200px',
      render: (user) => (
        <span className="text-sm text-muted-foreground">{user.email}</span>
      ),
    },
    {
      key: 'user_type',
      header: 'User Type',
      sortable: true,
      minWidth: '100px',
      render: (user) => renderUserType(user.user_type),
    },
    {
      key: 'date_of_birth',
      header: 'DOB',
      sortable: true,
      minWidth: '120px',
      render: (user) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(user.date_of_birth)}
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      sortable: true,
      minWidth: '140px',
      render: (user) => (
        <span className="text-sm text-muted-foreground">
          {user.phone || "—"}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: true,
      minWidth: '100px',
      render: (user) => renderStatus(user),
    },
  ];

  const renderActions = (user: User) => {
    if (!canEdit && !canDelete) return null;
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canEdit && onEdit && (
            <DropdownMenuItem onClick={() => onEdit(user)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}
          {canDelete && onDelete && (
            <DropdownMenuItem
              onClick={() => setPendingDelete(user)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="space-y-0">
      <SortableTable
        data={users}
        columns={columns}
        loading={isLoading}
        emptyMessage="No users found"
        defaultSort={defaultSort}
        onSortChange={onSortChange}
        enableClientSideSort={!enableServerSort}
        stickyHeader={true}
        renderActions={canEdit || canDelete ? renderActions : undefined}
        rowClassName="hover:bg-muted/50 transition-colors border-b"
        tableKey={`users-${page}`} // Optimize re-renders
        containerClassName="rounded-b-none" // Remove bottom border radius for pagination
      />

      {/* Pagination */}
      <div className="flex flex-col gap-2 border-t border-l border-r border-border rounded-b-xl px-4 py-3 text-xs text-muted-foreground bg-white shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-3">
          <div>
            {total > 0 ? (
              <span>
                Showing{" "}
                <span className="font-medium text-slate-700">{start}</span>
                –
                <span className="font-medium text-slate-700">{end}</span>
                {" "}of{" "}
                <span className="font-medium text-slate-700">{total}</span>
                {" "}users
              </span>
            ) : (
              <span>No users to display</span>
            )}
          </div>
          <PageSizeSelect
            value={effectivePageSize}
            onChange={(value) => onPageSizeChange?.(value)}
            disabled={isLoading}
          />
        </div>
        <div className="flex items-center gap-2 justify-end">
          <span className="hidden md:inline">
            Page{" "}
            <span className="font-medium text-slate-700">{page}</span>
            {" "}of{" "}
            <span className="font-medium text-slate-700">{totalPages}</span>
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1 || isLoading}
              className="h-7 px-2"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages || isLoading}
              className="h-7 px-2"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && !isDeleting && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user</AlertDialogTitle>
            <AlertDialogDescription>
              This action will deactivate{" "}
              <strong>{pendingDelete ? formatName(pendingDelete) : "this user"}</strong> and they
              will no longer be able to access the platform. You can re-enable the account later if
              needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
