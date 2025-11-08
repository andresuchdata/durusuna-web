"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/domains/auth/hooks";

export function TopHeader({ 
  sidebarCollapsed,
  onToggleMobileSidebar 
}: { 
  sidebarCollapsed?: boolean;
  onToggleMobileSidebar?: () => void;
}) {
  const { data: profile } = useProfile();
  const pathname = usePathname();

  // Hide header on conversations page (has its own header)
  if (pathname === '/conversations') return null;
  
  if (!profile) return null;

  const firstName = profile.first_name ?? profile.name?.split(" ")?.[0] ?? "";
  const lastName = profile.last_name ?? profile.name?.split(" ")?.slice(1).join(" ") ?? "";
  const initials = (firstName + lastName)
    ? `${firstName}${lastName}`
        .replace(/\s+/g, "")
        .slice(0, 2)
        .toUpperCase()
    : profile.email.slice(0, 2).toUpperCase();
  const avatarUrl = profile.avatar_url ?? profile.avatarUrl ?? undefined;

  // TODO: Fetch actual unread count from class updates
  const unreadClassUpdates = 0;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50 border-b border-slate-200 shadow-sm">
      <div className="px-4 h-12 flex items-center justify-between">
        <div className={`flex items-center gap-3 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-48'}`}>
          {/* Mobile hamburger menu */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="md:hidden h-8 w-8 p-0 text-slate-600 hover:bg-slate-100"
            onClick={onToggleMobileSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-slate-700">Durusuna</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <Link href="/class-updates">
            <Button variant="ghost" size="sm" className="relative text-slate-600 hover:bg-slate-100 h-8 w-8 p-0">
              <Bell className="h-4 w-4" />
              {unreadClassUpdates > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                  {unreadClassUpdates > 9 ? "9+" : unreadClassUpdates}
                </span>
              )}
            </Button>
          </Link>

          {/* Profile Avatar */}
          <Link href="/profile">
            <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-slate-300 transition-all">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
