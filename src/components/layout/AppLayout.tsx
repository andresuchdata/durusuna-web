"use client";

import { usePathname, useRouter } from "next/navigation";
import { useProfile } from "@/domains/auth/hooks";
import { Button } from "@/components/ui/button";
import { MessageSquare, BookOpen, User, LogOut, Menu, X, Users, UserCog, LayoutDashboard, ChevronDown } from "lucide-react";
import { tokenStore } from "@/core/auth/token";
import { useEffect, useMemo, useState } from "react";
import { TopHeader } from "./TopHeader";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavChild = { href: string; label: string };

type NavItem = {
  href?: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children?: NavChild[];
};

export default function AppLayout({ children, hideBottomNav = false }: { children: React.ReactNode; hideBottomNav?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const { mobileSidebarOpen, setMobileSidebarOpen, toggleMobileSidebar } = useSidebar();
  const SIDEBAR_COLLAPSED_STORAGE_KEY = "durusuna.sidebarCollapsed";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedValue = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
      if (storedValue !== null) {
        setSidebarCollapsed(storedValue === "true");
      }
    }

    // This is intentional for handling Next.js hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY,
      sidebarCollapsed.toString()
    );
  }, [isMounted, sidebarCollapsed, SIDEBAR_COLLAPSED_STORAGE_KEY]);

  const handleSidebarToggle = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const isAdmin = profile?.role === "admin" || profile?.user_type === "admin";
  const isTeacher = profile?.user_type === "teacher";
  const isParent = profile?.user_type === "parent";
  const isStudent = profile?.user_type === "student";

  const navItems: NavItem[] = useMemo(() => {
    const base: NavItem[] = [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/conversations", label: "Conversations", icon: MessageSquare },
      { href: "/class-updates", label: "Updates", icon: BookOpen },
    ];

    base.push({
      label: "Learning",
      icon: Users,
      children: [
        { href: "/lessons", label: "Lessons" },
        { href: "/assignments", label: "Assignments" },
        { href: "/classes", label: "Classes" },
        { href: "/grades", label: "Grades" },
      ],
    });

    if (isAdmin) {
      base.push({
        label: "Admin",
        icon: UserCog,
        children: [
          { href: "/users", label: "Users" },
          { href: "/admin/lessons", label: "Lessons" },
          { href: "/admin/classes", label: "Classes" },
        ],
      });
    }

    base.push({ href: "/profile", label: "Profile", icon: User });
    return base;
  }, [isAdmin, isTeacher, isParent, isStudent]);

  const isConversationsPage = pathname === '/conversations';
  const isNavItemActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  useEffect(() => {
    const activeSections: Record<string, boolean> = {};
    navItems.forEach((item) => {
      if (item.children) {
        activeSections[item.label] = item.children.some((child) => isNavItemActive(child.href));
      }
    });
    setExpandedSections((prev) => ({ ...prev, ...activeSections }));
  }, [pathname, navItems]);

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

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleNavigate = (href?: string) => {
    if (!href) return;
    router.push(href);
  };

  const primaryNavItems = navItems.filter(
    (item): item is NavItem & { href: string } => typeof item.href === "string"
  );

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
              {primaryNavItems.slice(0, 5).map((item) => {
                const Icon = item.icon;
                const isActive = isNavItemActive(item.href);
                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavigate(item.href)}
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
                onClick={handleSidebarToggle}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
            <TooltipProvider delayDuration={300}>
              <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const itemKey = item.href ?? item.label;

                  if (item.children) {
                    const isChildActive = item.children.some((child) => isNavItemActive(child.href));

                    if (sidebarCollapsed) {
                      return (
                        <DropdownMenu key={item.label}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className={`w-full justify-center px-0 h-10 text-white hover:bg-blue-700 hover:text-white ${isChildActive ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white' : ''}`}
                                >
                                  <Icon className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p>{item.label}</p>
                            </TooltipContent>
                          </Tooltip>
                          <DropdownMenuContent side="right" align="start" className="min-w-[180px]">
                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              {item.label}
                            </div>
                            {item.children.map((child) => (
                              <DropdownMenuItem
                                key={child.href}
                                className={isNavItemActive(child.href) ? 'bg-blue-50 text-blue-700' : ''}
                                onClick={() => router.push(child.href)}
                              >
                                {child.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      );
                    }

                    const isExpanded = expandedSections[item.label] || isChildActive;

                    return (
                      <div key={item.label} className="space-y-1">
                        <Button
                          variant="ghost"
                          className={`w-full justify-between px-3 h-10 text-white hover:bg-blue-700 hover:text-white ${isChildActive ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white' : ''}`}
                          onClick={() => toggleSection(item.label)}
                        >
                          <span className="flex items-center gap-3">
                            <Icon className="h-5 w-5" />
                            <span>{item.label}</span>
                          </span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </Button>
                        {isExpanded && (
                          <div className="ml-6 space-y-1 border-l border-blue-700/60 pl-3">
                            {item.children.map((child) => {
                              const isActive = isNavItemActive(child.href);
                              return (
                                <Button
                                  key={child.href}
                                  variant="ghost"
                                  className={`w-full justify-start h-9 text-sm ${isActive ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white' : 'text-blue-100 hover:bg-blue-700/60 hover:text-white'}`}
                                  onClick={() => router.push(child.href)}
                                >
                                  {child.label}
                                </Button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  const isActive = item.href ? isNavItemActive(item.href) : false;
                  const buttonContent = (
                    <Button
                      key={itemKey}
                      variant="ghost"
                      className={`w-full transition-all duration-300 h-10 ${sidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3'} ${isActive ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white' : 'text-white hover:bg-blue-700 hover:text-white'}`}
                      onClick={() => handleNavigate(item.href)}
                    >
                      <Icon className="h-5 w-5" />
                      {!sidebarCollapsed && <span className="ml-3">{item.label}</span>}
                    </Button>
                  );

                  return sidebarCollapsed ? (
                    <Tooltip key={itemKey}>
                      <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <div key={itemKey}>{buttonContent}</div>
                  );
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
                const itemKey = item.href ?? item.label;

                if (item.children) {
                  const isChildActive = item.children.some((child) => isNavItemActive(child.href));
                  const isExpanded = expandedSections[item.label] || isChildActive;

                  return (
                    <div key={item.label} className="space-y-1">
                      <Button
                        variant="ghost"
                        className={`w-full justify-between text-white ${isChildActive ? 'bg-blue-600 hover:bg-blue-700' : 'text-blue-100 hover:bg-[#2c4f7c]'}`}
                        onClick={() => toggleSection(item.label)}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          {item.label}
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </Button>
                      {isExpanded && (
                        <div className="ml-6 space-y-1 border-l border-white/20 pl-3">
                          {item.children.map((child) => (
                            <Button
                              key={child.href}
                              variant="ghost"
                              className={`w-full justify-start text-sm ${isNavItemActive(child.href) ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-blue-100 hover:bg-[#2c4f7c]'}`}
                              onClick={() => {
                                handleNavigate(child.href);
                                setMobileSidebarOpen(false);
                              }}
                            >
                              {child.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                const isActive = item.href ? isNavItemActive(item.href) : false;
                return (
                  <Button
                    key={itemKey}
                    variant="ghost"
                    className={`w-full justify-start ${isActive ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-blue-100 hover:bg-[#2c4f7c]'}`}
                    onClick={() => {
                      handleNavigate(item.href);
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
