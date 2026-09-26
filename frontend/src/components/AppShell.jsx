import { useState } from "react";
import {
  BarChart3,
  Bell,
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  School,
  Settings,
  Users,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

const adminNavigation = [
  {
    label: "Overview",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Students",
    path: "/students",
    icon: GraduationCap,
  },
  {
    label: "Classrooms",
    path: "/classrooms",
    icon: School,
  },
  {
    label: "Teachers",
    path: "/teachers",
    icon: Users,
  },
  {
    label: "CBC Assessment",
    path: "/competencies",
    icon: BookOpenCheck,
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Finance",
    path: "/finance",
    icon: CreditCard,
  },
  {
    label: "Notifications",
    path: "/notifications",
    icon: Bell,
  },
];

const teacherNavigation = [
  {
    label: "Teacher Workspace",
    path: "/teacher-portal",
    icon: LayoutDashboard,
  },
  {
    label: "My Learners",
    path: "/students",
    icon: GraduationCap,
  },
  {
    label: "My Classrooms",
    path: "/classrooms",
    icon: School,
  },
  {
    label: "CBC Assessment",
    path: "/competencies",
    icon: BookOpenCheck,
  },
  {
    label: "Learner Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Notifications",
    path: "/notifications",
    icon: Bell,
  },
];

const bursarNavigation = [
  {
    label: "Finance",
    path: "/finance",
    icon: CreditCard,
  },
  {
    label: "Students",
    path: "/students",
    icon: GraduationCap,
  },
  {
    label: "Notifications",
    path: "/notifications",
    icon: Bell,
  },
];

function getNavigationForRole(role) {
  switch (role) {
    case "TEACHER":
      return teacherNavigation;

    case "BURSAR":
      return bursarNavigation;

    case "ADMIN":
    case "PLATFORM_ADMIN":
    default:
      return adminNavigation;
  }
}

function getPortalTitle(role) {
  switch (role) {
    case "TEACHER":
      return "Teacher Workspace";

    case "BURSAR":
      return "Finance Workspace";

    case "PLATFORM_ADMIN":
      return "Platform Administration";

    case "STUDENT":
      return "Student Workspace";

    case "PARENT":
      return "Parent Workspace";

    case "ADMIN":
    default:
      return "School Administration";
  }
}

function getPortalSubtitle(role) {
  switch (role) {
    case "TEACHER":
      return "Learners, classrooms and competency assessment";

    case "BURSAR":
      return "School payments and financial records";

    case "PLATFORM_ADMIN":
      return "DARASA-AI platform management";

    case "STUDENT":
      return "Personal learning and competency progress";

    case "PARENT":
      return "Learner progress and school communication";

    case "ADMIN":
    default:
      return "Darasa-AI Education Management Platform";
  }
}

function getRoleLabel(role) {
  switch (role) {
    case "TEACHER":
      return "Teacher";

    case "BURSAR":
      return "Bursar";

    case "PLATFORM_ADMIN":
      return "Platform Administrator";

    case "STUDENT":
      return "Student";

    case "PARENT":
      return "Parent";

    case "ADMIN":
    default:
      return "School Administrator";
  }
}

function getInitials(user) {
  if (!user) {
    return "U";
  }

  const firstName = user.first_name?.trim() || "";
  const lastName = user.last_name?.trim() || "";

  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }

  if (firstName) {
    return firstName[0].toUpperCase();
  }

  if (user.username) {
    return user.username[0].toUpperCase();
  }

  return "U";
}

function getDisplayName(user) {
  if (!user) {
    return "User";
  }

  const fullName = [
    user.first_name,
    user.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || user.username || "User";
}

function AppShell({ children }) {
  const { user, logout } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = user?.role || "ADMIN";
  const navigation = getNavigationForRole(role);
  const portalTitle = getPortalTitle(role);
  const portalSubtitle = getPortalSubtitle(role);
  const roleLabel = getRoleLabel(role);
  const displayName = getDisplayName(user);
  const initials = getInitials(user);

  return (
    <div className="min-h-screen bg-[#F8F7F2]">

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-[#03251B]/50 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#E4E5DE] bg-[#FFFFFF] transition-all duration-200",
          sidebarCollapsed ? "w-[76px]" : "w-64",
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >

        {/* Brand */}
        <div className="flex h-20 items-center border-b border-[#E9E8E1] px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B5D43] text-white shadow-sm">
              <GraduationCap size={23} />
            </div>

            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-lg font-bold tracking-tight text-[#0B4D39]">
                  Darasa-AI
                </p>

                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A9691]">
                  Education OS
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="ml-auto rounded-lg p-2 text-[#7C8984] transition hover:bg-[#F3F4EF] hover:text-[#0B5D43] lg:hidden"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Current role */}
        {!sidebarCollapsed && (
          <div className="border-b border-[#E9E8E1] px-4 py-4">
            <div className="rounded-xl bg-[#EAF3EE] px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#789087]">
                Current workspace
              </p>

              <p className="mt-1 text-sm font-semibold text-[#0B5D43]">
                {roleLabel}
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {!sidebarCollapsed && (
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9AA49F]">
              Workspace
            </p>
          )}

          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={
                  item.path === "/dashboard" ||
                  item.path === "/teacher-portal"
                }
                onClick={() => setMobileMenuOpen(false)}
                title={sidebarCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  [
                    "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
                    isActive
                      ? "bg-[#EAF3EE] text-[#0B5D43]"
                      : "text-[#5E6C67] hover:bg-[#F6F7F3] hover:text-[#0B5D43]",
                    sidebarCollapsed ? "justify-center" : "",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={19}
                      className={
                        isActive
                          ? "text-[#0B5D43]"
                          : "text-[#8A9691] group-hover:text-[#0B5D43]"
                      }
                    />

                    {!sidebarCollapsed && (
                      <span>{item.label}</span>
                    )}

                    {isActive && !sidebarCollapsed && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#F1C54C]" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-[#E9E8E1] p-3">
          {!sidebarCollapsed && (
            <NavLink
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                [
                  "mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-[#F1F3EE] text-[#0B5D43]"
                    : "text-[#5E6C67] hover:bg-[#F6F7F3] hover:text-[#0B5D43]",
                ].join(" ")
              }
            >
              <Settings size={19} className="text-[#8A9691]" />
              Settings
            </NavLink>
          )}

          <button
            type="button"
            onClick={logout}
            title={sidebarCollapsed ? "Sign out" : undefined}
            className={[
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#A33A32] transition hover:bg-[#FFF3F1]",
              sidebarCollapsed ? "justify-center" : "",
            ].join(" ")}
          >
            <LogOut size={19} />

            {!sidebarCollapsed && <span>Sign out</span>}
          </button>
        </div>

        {/* Collapse button */}
        <button
          type="button"
          onClick={() =>
            setSidebarCollapsed((value) => !value)
          }
          className="absolute -right-3 top-24 hidden h-7 w-7 items-center justify-center rounded-full border border-[#DDE1DB] bg-white text-[#71807A] shadow-sm transition hover:border-[#0B5D43] hover:text-[#0B5D43] lg:flex"
          aria-label={
            sidebarCollapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
        >
          {sidebarCollapsed ? (
            <ChevronRight size={15} />
          ) : (
            <ChevronLeft size={15} />
          )}
        </button>
      </aside>

      {/* Main application */}
      <div
        className={[
          "min-h-screen transition-all duration-200",
          sidebarCollapsed
            ? "lg:pl-[76px]"
            : "lg:pl-64",
        ].join(" ")}
      >

        {/* Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#E4E5DE] bg-[#FFFFFF]/95 px-4 backdrop-blur sm:px-6">

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl p-2 text-[#65736E] transition hover:bg-[#F1F3EE] hover:text-[#0B5D43] lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>

            <div>
              <p className="text-sm font-semibold text-[#17382E]">
                {portalTitle}
              </p>

              <p className="hidden text-xs text-[#8A9691] sm:block">
                {portalSubtitle}
              </p>
            </div>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-3">

            <NavLink
              to="/notifications"
              className="relative rounded-xl p-2.5 text-[#65736E] transition hover:bg-[#F1F3EE] hover:text-[#0B5D43]"
              aria-label="Notifications"
            >
              <Bell size={20} />

              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#F1C54C] ring-2 ring-white" />
            </NavLink>

            <div className="hidden h-8 w-px bg-[#E4E5DE] sm:block" />

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[#405650]">
                {displayName}
              </p>

              <p className="text-xs text-[#9AA49F]">
                {user?.school_name || roleLabel}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF3EE] text-sm font-bold text-[#0B5D43] ring-2 ring-[#F1C54C]/30">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppShell;