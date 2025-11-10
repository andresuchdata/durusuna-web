"use client";

import React from "react";
import { useUserPermissions } from "@/domains/access";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldX } from "lucide-react";

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermissions?: Array<keyof import("@/domains/access").UserPermissions>;
  requiredUserTypes?: string[];
  requiredRole?: string;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

export function PermissionGuard({
  children,
  requiredPermissions = [],
  requiredUserTypes = [],
  requiredRole,
  fallback,
  showFallback = true,
}: PermissionGuardProps) {
  const { data: response, isLoading, error } = useUserPermissions();
  const permissions = response?.data;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (error || !permissions) {
    return (
      <Alert variant="destructive">
        <ShieldX className="h-4 w-4" />
        <AlertDescription>
          Failed to load permissions. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  // Check required permissions
  const hasRequiredPermissions = requiredPermissions.every(
    (permission) => permissions[permission]
  );

  // Check required user types
  const hasRequiredUserType = 
    requiredUserTypes.length === 0 || 
    requiredUserTypes.includes(permissions.userType);

  // Check required role
  const hasRequiredRole = 
    !requiredRole || permissions.role === requiredRole;

  const hasAccess = hasRequiredPermissions && hasRequiredUserType && hasRequiredRole;

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showFallback) {
      return null;
    }

    return (
      <Alert>
        <ShieldX className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to access this content.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}

// Convenience components for common permission checks
export function AdminOnly({ children, fallback }: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) {
  return (
    <PermissionGuard 
      requiredRole="admin" 
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
}

export function TeacherOnly({ children, fallback }: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) {
  return (
    <PermissionGuard 
      requiredUserTypes={["teacher"]} 
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
}

export function CanManageUsers({ children, fallback }: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) {
  return (
    <PermissionGuard 
      requiredPermissions={["canUpdateUsers"]} 
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
}

export function CanCreateUsers({ children, fallback }: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) {
  return (
    <PermissionGuard 
      requiredPermissions={["canCreateUsers"]} 
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
}

export function CanViewAllUsers({ children, fallback }: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) {
  return (
    <PermissionGuard 
      requiredPermissions={["canViewAllUsers"]} 
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
}
