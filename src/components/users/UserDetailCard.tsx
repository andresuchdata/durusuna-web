"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@/domains/users/types";

type UserDetailCardProps = {
  user: User;
};

function getInitials(user: User) {
  return `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || user.email.slice(0, 2).toUpperCase();
}

function formatUserType(userType: User["user_type"]) {
  return userType.charAt(0).toUpperCase() + userType.slice(1);
}

export function UserDetailCard({ user }: UserDetailCardProps) {
  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar_url ?? undefined} />
            <AvatarFallback>{getInitials(user)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl font-semibold">
              {user.first_name} {user.last_name}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{user.email}</span>
              <Badge variant="outline">{formatUserType(user.user_type)}</Badge>
              {user.role === "admin" && <Badge variant="secondary">Admin</Badge>}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground">Account</h3>
          <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">User ID</p>
              <p className="font-mono text-sm">{user.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              {user.is_active === false ? (
                <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Inactive</Badge>
              ) : (
                <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p>{user.phone || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last active</p>
              <p>{user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "—"}</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-muted-foreground">Identifiers</h3>
          <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Student ID</p>
              <p>{user.student_id || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Employee ID</p>
              <p>{user.employee_id || "—"}</p>
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

