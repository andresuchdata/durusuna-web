"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserForm } from "./UserForm";
import type { CreateUserPayload, UpdateUserPayload, User } from "@/domains/users/types";

type UserFormDialogProps = {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateUserPayload | UpdateUserPayload) => Promise<void> | void;
  initialData?: User | null;
  isSubmitting: boolean;
  canEditRole: boolean;
};

export function UserFormDialog({
  mode,
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isSubmitting,
  canEditRole,
}: UserFormDialogProps) {
  const dialogTitle = mode === "create" ? "Create new user" : "Edit user";
  const dialogDescription =
    mode === "create"
      ? "Invite a new member to the platform. They will receive access immediately."
      : "Update the user information for this member.";

  const handleFormSubmit = async (payload: CreateUserPayload | UpdateUserPayload) => {
    await onSubmit(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <UserForm
          mode={mode}
          onSubmit={handleFormSubmit}
          initialData={initialData}
          isSubmitting={isSubmitting}
          canEditRole={canEditRole}
        />
      </DialogContent>
    </Dialog>
  );
}
