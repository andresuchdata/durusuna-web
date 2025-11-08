"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { BatchCreateUsersPayload, CreateUserPayload } from "@/domains/users/types";

type UserBatchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: BatchCreateUsersPayload) => Promise<void> | void;
  isSubmitting: boolean;
};

const PLACEHOLDER = `Jane,Doe,jane.doe@school.edu,teacher,SecurePass123
John,Smith,john.smith@school.edu,parent,SecurePass123`;

export function UserBatchDialog({ open, onOpenChange, onSubmit, isSubmitting }: UserBatchDialogProps) {
  const [rawInput, setRawInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setRawInput("");
    setError(null);
  };

  const parseInput = (): CreateUserPayload[] => {
    const lines = rawInput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      throw new Error("Please provide at least one user entry.");
    }

    return lines.map((line, index) => {
      const parts = line.split(",").map((part) => part.trim());
      if (parts.length < 5) {
        throw new Error(`Line ${index + 1}: Expected 5 values (first name, last name, email, user type, password).`);
      }

      const [firstName, lastName, email, userTypeRaw, password] = parts;
      const userType = userTypeRaw.toLowerCase();
      if (!firstName || !lastName || !email || !password) {
        throw new Error(`Line ${index + 1}: All fields are required.`);
      }

      if (!["teacher", "student", "parent"].includes(userType)) {
        throw new Error(`Line ${index + 1}: User type must be teacher, student, or parent.`);
      }

      const payload: CreateUserPayload = {
        first_name: firstName,
        last_name: lastName,
        email,
        user_type: userType as CreateUserPayload["user_type"],
        password,
        role: "user",
      };

      return payload;
    });
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      const users = parseInput();
      await onSubmit({ users });
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to parse entries. Please review the format and try again.");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (!next) {
        reset();
      }
      onOpenChange(next);
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Batch create users</DialogTitle>
          <DialogDescription>
            Paste one user per line using the format: <code>First,Last,email,user_type,password</code>.
            Supported user types are <strong>teacher</strong>, <strong>student</strong>, and <strong>parent</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Unable to process entries</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Textarea
            rows={8}
            value={rawInput}
            onChange={(event) => setRawInput(event.target.value)}
            placeholder={PLACEHOLDER}
          />

          <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
            <p className="font-medium">Tips</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Passwords must be at least 8 characters.</li>
              <li>Email addresses must be unique within your organisation.</li>
              <li>You can adjust roles and details after creation.</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !rawInput.trim()}>
            <Upload className="mr-2 h-4 w-4" />
            {isSubmitting ? "Creating..." : "Create users"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

