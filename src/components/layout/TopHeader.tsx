"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/domains/auth/hooks";

export function TopHeader({ sidebarCollapsed }: { sidebarCollapsed?: boolean }) {
  const { data: profile } = useProfile();
  const pathname = usePathname();

  // Hide header on conversations page (has its own header)
  if (pathname === '/conversations') return null;
  
  if (!profile) return null;

  const initials = profile.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  // TODO: Fetch actual unread count from class updates
  const unreadClassUpdates = 0;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-card border-b border-border shadow-sm">
      <div className="px-4 h-16 flex items-center justify-between">
        <div className={`flex items-center gap-3 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-48'}`}>
          <h1 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Durusuna</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <Link href="/class-updates">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              {unreadClassUpdates > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                  {unreadClassUpdates > 9 ? "9+" : unreadClassUpdates}
                </span>
              )}
            </Button>
          </Link>

          {/* Profile Avatar */}
          <Link href="/profile">
            <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-transparent hover:ring-emerald-200 dark:hover:ring-emerald-800 transition-all">
              <AvatarImage src={profile.avatarUrl} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
