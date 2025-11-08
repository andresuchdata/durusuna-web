"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { http } from "@/core/http/axios";
import type { CreateUserPayload, UpdateUserPayload, User } from "@/domains/users/types";

type UserFormProps = {
  mode: "create" | "edit";
  onSubmit: (payload: CreateUserPayload | UpdateUserPayload) => Promise<void> | void;
  initialData?: User | null;
  isSubmitting: boolean;
  canEditRole: boolean;
};

const USER_TYPES: Array<{ label: string; value: CreateUserPayload["user_type"] }> = [
  { label: "Teacher", value: "teacher" },
  { label: "Student", value: "student" },
  { label: "Parent", value: "parent" },
];

const ROLES: Array<{ label: string; value: NonNullable<CreateUserPayload["role"]> }> = [
  { label: "Administrator", value: "admin" },
  { label: "User", value: "user" },
];

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  user_type: CreateUserPayload["user_type"];
  role: NonNullable<CreateUserPayload["role"]>;
  phone: string;
  avatar_url: string;
  password: string;
  is_active: boolean;
};

const DEFAULT_FORM: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  user_type: "teacher",
  role: "user",
  phone: "",
  avatar_url: "",
  password: "",
  is_active: true,
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "U";
}

export function UserForm({
  mode,
  onSubmit,
  initialData,
  isSubmitting,
  canEditRole,
}: UserFormProps) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "edit" && initialData) {
      const normalizedUserType: CreateUserPayload["user_type"] = USER_TYPES.some(
        (option) => option.value === initialData.user_type
      )
        ? (initialData.user_type as CreateUserPayload["user_type"])
        : "teacher";
      const avatarUrl = initialData.avatar_url ?? "";
      setForm({
        first_name: initialData.first_name ?? "",
        last_name: initialData.last_name ?? "",
        email: initialData.email ?? "",
        user_type: normalizedUserType,
        role: initialData.role ?? "user",
        phone: initialData.phone ?? "",
        avatar_url: avatarUrl,
        password: "",
        is_active: initialData.is_active ?? true,
      });
      setAvatarPreview(avatarUrl || null);
    } else if (mode === "create") {
      setForm(DEFAULT_FORM);
      setAvatarPreview(null);
    }
  }, [mode, initialData]);

  const handleChange = (key: keyof FormState) => (value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAvatarSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");
      formData.append("processImage", "true");

      const response = await http().post("/uploads/file", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadedUrl = response.data.file?.url;
      if (uploadedUrl) {
        setForm((prev) => ({ ...prev, avatar_url: uploadedUrl }));
        setAvatarPreview(uploadedUrl);
      }
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      alert("Failed to upload avatar. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = () => {
    setForm((prev) => ({ ...prev, avatar_url: "" }));
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "create") {
        const payload: CreateUserPayload = {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim().toLowerCase(),
          user_type: form.user_type,
          role: form.role,
          phone: form.phone.trim() || undefined,
          avatar_url: form.avatar_url.trim() || undefined,
          password: form.password,
        };
        await onSubmit(payload);
      } else {
        const payload: UpdateUserPayload = {
          first_name: form.first_name.trim() || undefined,
          last_name: form.last_name.trim() || undefined,
          email: form.email.trim().toLowerCase() || undefined,
          user_type: form.user_type,
          role: form.role,
          phone: form.phone.trim() || undefined,
          avatar_url: form.avatar_url.trim() || undefined,
          is_active: form.is_active,
          password: form.password ? form.password : undefined,
        };
        await onSubmit(payload);
      }
    } catch (error) {
      // error handled by parent via toast
    }
  };

  const isCreate = mode === "create";
  const disableSubmit =
    isSubmitting ||
    !form.first_name ||
    !form.last_name ||
    !form.email ||
    (isCreate && !form.password);

  const currentAvatar = avatarPreview || form.avatar_url || null;
  const initials = getInitials(form.first_name, form.last_name);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Section */}
      <div className="flex flex-col items-center gap-4 pb-6 border-b">
        <div className="relative">
          <Avatar className="h-24 w-24 ring-2 ring-border ring-offset-2">
            <AvatarImage src={currentAvatar || undefined} alt={`${form.first_name} ${form.last_name}`} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {isUploadingAvatar && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarSelect}
            className="hidden"
            disabled={isUploadingAvatar || isSubmitting}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar || isSubmitting}
          >
            <Upload className="mr-2 h-4 w-4" />
            {currentAvatar ? "Change" : "Upload"}
          </Button>
          {currentAvatar && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveAvatar}
              disabled={isUploadingAvatar || isSubmitting}
            >
              <X className="mr-2 h-4 w-4" />
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Recommended: Square image, at least 200x200px. Max 5MB.
        </p>
      </div>

      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first_name">
              First name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="first_name"
              value={form.first_name}
              onChange={(event) => handleChange("first_name")(event.target.value)}
              placeholder="Jane"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">
              Last name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="last_name"
              value={form.last_name}
              onChange={(event) => handleChange("last_name")(event.target.value)}
              placeholder="Doe"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => handleChange("email")(event.target.value)}
            placeholder="jane@school.edu"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(event) => handleChange("phone")(event.target.value)}
            placeholder="+1 (555) 123-4567"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Account Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Account Settings</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="user_type">User Type</Label>
            <Select
              value={form.user_type}
              onValueChange={(value) => handleChange("user_type")(value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="user_type">
                <SelectValue placeholder="Select user type" />
              </SelectTrigger>
              <SelectContent>
                {USER_TYPES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={form.role}
              onValueChange={(value) => handleChange("role")(value)}
              disabled={!canEditRole || isSubmitting}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {mode === "edit" && (
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.is_active ? "active" : "inactive"}
              onValueChange={(value) => handleChange("is_active")(value === "active")}
              disabled={isSubmitting}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Security */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Security</h3>
        <div className="space-y-2">
          <Label htmlFor="password">
            Password {isCreate && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="password"
            type="password"
            value={form.password}
            onChange={(event) => handleChange("password")(event.target.value)}
            placeholder={isCreate ? "At least 8 characters" : "Leave blank to keep current"}
            required={isCreate}
            disabled={isSubmitting}
          />
          {!isCreate && (
            <p className="text-xs text-muted-foreground">
              Leave blank to keep the current password unchanged.
            </p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit" disabled={disableSubmit} className="min-w-[120px]">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === "create" ? "Creating..." : "Saving..."}
            </>
          ) : (
            mode === "create" ? "Create User" : "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}

