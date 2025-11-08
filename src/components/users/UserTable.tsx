"use client";

import { useMemo, useState, useEffect, useRef } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@/domains/users/types";

type UserTableProps = {
  users?: User[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  canEdit: boolean;
  canDelete: boolean;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => Promise<void> | void;
};

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

export function UserTable({
  users,
  isLoading,
  page,
  pageSize,
  total,
  onPageChange,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: UserTableProps) {
  const [pendingDelete, setPendingDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const hasScroll = scrollContainerRef.current.scrollWidth > scrollContainerRef.current.clientWidth;
        setHasHorizontalScroll(hasScroll);
      }
    };

    checkScroll();
    const resizeObserver = new ResizeObserver(checkScroll);
    if (scrollContainerRef.current) {
      resizeObserver.observe(scrollContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [users]);

  const totalPages = useMemo(() => {
    if (!total || total <= 0) return 1;
    return Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  }, [total, pageSize]);

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

  const renderStatus = (user: User) => {
    if (user.is_active === false) {
      return (
        <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
          Inactive
        </Badge>
      );
    }
    return <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>;
  };

  const hasActions = canEdit || canDelete;
  const totalColumns = hasActions ? 8 : 7;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto" ref={scrollContainerRef}>
        <Table>
          <TableHeader>
            <TableRow className="border-b bg-muted/30">
              <TableHead className={`font-semibold text-foreground sticky left-0 z-10 bg-muted/30 min-w-[200px] ${hasHorizontalScroll ? 'border-r' : ''}`}>
                Name
              </TableHead>
              <TableHead className="font-semibold text-foreground min-w-[120px]">ID</TableHead>
              <TableHead className="font-semibold text-foreground min-w-[200px]">Email</TableHead>
              <TableHead className="font-semibold text-foreground min-w-[100px]">User Type</TableHead>
              <TableHead className="font-semibold text-foreground min-w-[120px]">DOB</TableHead>
              <TableHead className="font-semibold text-foreground min-w-[140px]">Phone</TableHead>
              <TableHead className="font-semibold text-foreground min-w-[100px]">Status</TableHead>
              {hasActions && (
                <TableHead className="text-right font-semibold text-foreground min-w-[80px]">
                  {/* Empty header for actions */}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={totalColumns}>
                  <div className="flex flex-col gap-3 py-8">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-5 w-2/3" />
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && users && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={totalColumns}>
                  <div className="py-12 text-center">
                    <p className="text-sm font-medium text-muted-foreground">No users found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              users?.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50 transition-colors border-b">
                  <TableCell className={`py-4 sticky left-0 z-10 bg-card min-w-[200px] whitespace-nowrap ${hasHorizontalScroll ? 'border-r' : ''}`}>
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
                  </TableCell>
                  <TableCell className="py-4 min-w-[120px] whitespace-nowrap">
                    <span className="text-sm text-muted-foreground font-mono">
                      {getUserID(user)}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 min-w-[200px] whitespace-nowrap">
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                  </TableCell>
                  <TableCell className="py-4 min-w-[100px] whitespace-nowrap">
                    {renderUserType(user.user_type)}
                  </TableCell>
                  <TableCell className="py-4 min-w-[120px] whitespace-nowrap">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(user.date_of_birth)}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 min-w-[140px] whitespace-nowrap">
                    <span className="text-sm text-muted-foreground">
                      {user.phone || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 min-w-[100px] whitespace-nowrap">{renderStatus(user)}</TableCell>
                  {hasActions && (
                    <TableCell className="text-right py-4 min-w-[80px]">
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
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1 || isLoading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      </div>

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
