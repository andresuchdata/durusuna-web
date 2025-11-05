"use client";

import { usePathname, useRouter } from "next/navigation";
import { useProfile } from "@/domains/auth/hooks";
import { Button } from "@/components/ui/button";
import { MessageSquare, BookOpen, User, LogOut, Menu, X, Users, ClipboardCheck, FileText, GraduationCap, Calendar } from "lucide-react";
import { tokenStore } from "@/core/auth/token";
import { useEffect, useState } from "react";
import { TopHeader } from "./TopHeader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
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

  const navItems = [
    { href: "/conversations", label: "Conversations", icon: MessageSquare },
    { href: "/class-updates", label: "Updates", icon: BookOpen },
    { href: "/classes", label: "Classes", icon: Users },
    { href: "/attendance", label: "Attendance", icon: ClipboardCheck },
    { href: "/assignments", label: "Assignments", icon: FileText },
    { href: "/grades", label: "Grades", icon: GraduationCap },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const isConversationsPage = pathname === '/conversations';

  return (
    <div className="min-h-screen flex flex-col">
      <TopHeader sidebarCollapsed={sidebarCollapsed} />
      <div className={`flex flex-1 flex-col md:flex-row ${isConversationsPage ? '' : 'md:pt-16'}`}>
      {/* Mobile bottom nav */}
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

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-[#1e3a5f] text-white border-r border-[#2c4f7c] transition-all duration-300 z-50 ${sidebarCollapsed ? 'md:w-16' : 'md:w-48'}`}>
        <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarCollapsed ? 'p-1' : 'p-2'}`}>
          <div className="flex items-center mb-4 pt-2 relative h-10">
            <div className={`flex-1 overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
              <p className="text-sm text-blue-200 truncate">{profile.name}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={`text-white hover:bg-blue-700 hover:text-white flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'ml-auto' : ''}`}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  className={`w-full transition-all duration-300 ${sidebarCollapsed ? 'justify-center px-0 py-5' : 'justify-start py-5 px-3'} ${isActive ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white' : 'text-white hover:bg-blue-700 hover:text-white'}`}
                  onClick={() => router.push(item.href)}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5" />
                  {!sidebarCollapsed && <span className="ml-3">{item.label}</span>}
                </Button>
              );
            })}
          </nav>
          <Button
            variant="ghost"
            className={`w-full transition-all duration-300 ${sidebarCollapsed ? 'justify-center px-0 py-5' : 'justify-start py-5 px-3'} text-white hover:bg-red-700 hover:text-white mt-4`}
            onClick={handleLogout}
            title={sidebarCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="h-5 w-5" />
            {!sidebarCollapsed && <span className="ml-3">Logout</span>}
          </Button>
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
              <p className="text-sm text-blue-200">{profile.name}</p>
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
      <main className={`flex-1 transition-all duration-300 pb-16 md:pb-0 ${isConversationsPage ? '' : 'md:pt-16'} ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-48'}`}>
        {children}
      </main>
      </div>
    </div>
  );
}
