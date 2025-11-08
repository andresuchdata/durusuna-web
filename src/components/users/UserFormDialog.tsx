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

type BaseUserFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: User | null;
  isSubmitting: boolean;
  canEditRole: boolean;
};

type CreateUserFormDialogProps = BaseUserFormDialogProps & {
  mode: "create";
  onSubmit: (payload: CreateUserPayload) => Promise<void> | void;
};

type EditUserFormDialogProps = BaseUserFormDialogProps & {
  mode: "edit";
  onSubmit: (payload: UpdateUserPayload) => Promise<void> | void;
};

type UserFormDialogProps = CreateUserFormDialogProps | EditUserFormDialogProps;

export function UserFormDialog(props: UserFormDialogProps) {
  const { mode, open, onOpenChange, onSubmit, initialData, isSubmitting, canEditRole } = props;
  
  const dialogTitle = mode === "create" ? "Create new user" : "Edit user";
  const dialogDescription =
    mode === "create"
      ? "Invite a new member to the platform. They will receive access immediately."
      : "Update the user information for this member.";

  const handleFormSubmit = async (payload: CreateUserPayload | UpdateUserPayload) => {
    if (mode === "create") {
      await (onSubmit as (payload: CreateUserPayload) => Promise<void> | void)(payload as CreateUserPayload);
    } else {
      await (onSubmit as (payload: UpdateUserPayload) => Promise<void> | void)(payload as UpdateUserPayload);
    }
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
