"use client";

import { usePathname, useRouter } from "next/navigation";
import { useProfile } from "@/domains/auth/hooks";
import { Button } from "@/components/ui/button";
import { MessageSquare, BookOpen, User, LogOut, Menu, X, Users, ClipboardCheck, FileText, GraduationCap, UserCog, LayoutDashboard } from "lucide-react";
import { tokenStore } from "@/core/auth/token";
import { useEffect, useState } from "react";
import { TopHeader } from "./TopHeader";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AppLayout({ children, hideBottomNav = false }: { children: React.ReactNode; hideBottomNav?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const { mobileSidebarOpen, setMobileSidebarOpen, toggleMobileSidebar } = useSidebar();

  useEffect(() => {
    // This is intentional for handling Next.js hydration
    // eslint-disable-next-line
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !profile) {
      router.push("/login");
    }
  }, [profile, isLoading, router]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const handleLogout = () => {
    tokenStore.clear();
    router.push("/login");
  };

  const firstName = profile.first_name ?? profile.name?.split(" ")?.[0] ?? "";
  const lastName = profile.last_name ?? profile.name?.split(" ")?.slice(1).join(" ") ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || profile.name || profile.email;
  const isAdmin = profile.role === "admin" || profile.user_type === "admin";
  const isTeacher = profile.user_type === "teacher";
  const isParent = profile.user_type === "parent";
  const isStudent = profile.user_type === "student";

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/conversations", label: "Conversations", icon: MessageSquare },
    { href: "/class-updates", label: "Updates", icon: BookOpen },
    ...((isTeacher || isAdmin || isParent || isStudent) ? [{ href: "/classes", label: "Classes", icon: Users }] : []),
    ...(isTeacher ? [{ href: "/attendance", label: "Attendance", icon: ClipboardCheck }] : []),
    ...((isTeacher || isStudent) ? [{ href: "/assignments", label: "Assignments", icon: FileText }] : []),
    ...((isTeacher || isStudent) ? [{ href: "/grades", label: "Grades", icon: GraduationCap }] : []),
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: LayoutDashboard }] : []),
    { href: "/profile", label: "Profile", icon: User },
  ];

  const isConversationsPage = pathname === '/conversations';

  return (
    <div className="min-h-screen flex flex-col">
      <TopHeader 
        sidebarCollapsed={sidebarCollapsed} 
        onToggleMobileSidebar={toggleMobileSidebar}
      />
      <div className={`flex flex-1 flex-col md:flex-row ${isConversationsPage ? '' : 'md:pt-12'}`}>
        {/* Mobile bottom nav - can be hidden */}
        {!hideBottomNav && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50">
            <div className="flex justify-around items-center h-16">
              {navItems.slice(0, 5).map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={`flex flex-col items-center justify-center flex-1 h-full ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs mt-1">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {/* Desktop sidebar */}
        <aside className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-[#1e3a5f] text-white border-r border-[#2c4f7c] transition-all duration-300 z-50 ${sidebarCollapsed ? 'md:w-16' : 'md:w-48'}`}>
          <div className={`flex flex-col flex-1 transition-all duration-300 p-2`}>
            <div className={`flex items-center mb-4 pt-2 h-10 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              {!sidebarCollapsed && (
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm text-blue-200 truncate">{fullName}</p>
                </div>
              )}
              {/* Desktop only hamburger toggle */}
              <Button
                variant="ghost"
                size="sm"
                className={`text-white hover:bg-blue-700 hover:text-white h-10 w-10 p-0 flex-shrink-0 transition-all duration-300 hidden md:flex items-center justify-center`}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
            <TooltipProvider delayDuration={300}>
              <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  const buttonContent = (
                    <Button
                      key={item.href}
                      variant="ghost"
                      className={`w-full transition-all duration-300 h-10 ${sidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3'} ${isActive ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white' : 'text-white hover:bg-blue-700 hover:text-white'}`}
                      onClick={() => router.push(item.href)}
                    >
                      <Icon className="h-5 w-5" />
                      {!sidebarCollapsed && <span className="ml-3">{item.label}</span>}
                    </Button>
                  );
                  
                  return sidebarCollapsed ? (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        {buttonContent}
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : buttonContent;
                })}
              </nav>
              {sidebarCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`w-full transition-all duration-300 justify-center px-0 h-10 text-white hover:bg-red-700 hover:text-white mt-4`}
                      onClick={handleLogout}
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Logout</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  variant="ghost"
                  className={`w-full transition-all duration-300 justify-start px-3 h-10 text-white hover:bg-red-700 hover:text-white mt-4`}
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  <span className="ml-3">Logout</span>
                </Button>
              )}
            </TooltipProvider>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileSidebarOpen(false)} />
        )}
        
        {/* Mobile sidebar */}
        <aside className={`md:hidden fixed inset-y-0 left-0 w-64 bg-[#1e3a5f] text-white border-r border-[#2c4f7c] z-50 transform transition-transform ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col flex-1 p-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-xl font-bold text-white">Durusuna</h1>
                <p className="text-sm text-blue-200">{fullName}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-[#2c4f7c]"
                onClick={() => setMobileSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className={`w-full justify-start ${isActive ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-blue-100 hover:bg-[#2c4f7c]'}`}
                    onClick={() => {
                      router.push(item.href);
                      setMobileSidebarOpen(false);
                    }}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
            <Button
              variant="ghost"
              className="w-full justify-start text-blue-100 hover:bg-[#2c4f7c] mt-4"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <main className={`flex-1 transition-all duration-300 ${hideBottomNav ? 'pb-0' : 'pb-16 md:pb-0'} ${isConversationsPage ? '' : 'pt-12 md:pt-0'} ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-48'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
