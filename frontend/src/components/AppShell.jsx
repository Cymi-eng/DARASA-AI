import {
  BarChart3,
  Bell,
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  School,
  Settings,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";


const ADMIN_NAVIGATION = [
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
    icon: Wallet,
  },
];


const STUDENT_NAVIGATION = [
  {
    label: "Overview",
    path: "/student-portal",
    icon: LayoutDashboard,
  },
  {
    label: "My Progress",
    path: "/student-portal/progress",
    icon: GraduationCap,
  },
  {
    label: "My Assessments",
    path: "/student-portal/assessments",
    icon: BookOpenCheck,
  },
  {
    label: "Recommendations",
    path: "/student-portal/recommendations",
    icon: BarChart3,
  },
  {
    label: "Fees",
    path: "/student-portal/fees",
    icon: Wallet,
  },
  {
    label: "Notifications",
    path: "/student-portal/notifications",
    icon: Bell,
  },
  {
    label: "Settings",
    path: "/student-portal/settings",
    icon: Settings,
  },
];


const TEACHER_NAVIGATION = [
  {
    label: "Overview",
    path: "/teacher-portal",
    icon: LayoutDashboard,
  },
  {
    label: "My Classes",
    path: "/classrooms",
    icon: School,
  },
  {
    label: "My Students",
    path: "/students",
    icon: GraduationCap,
  },
  {
    label: "CBC Assessment",
    path: "/competencies",
    icon: BookOpenCheck,
  },
];


const BURSAR_NAVIGATION = [
  {
    label: "Finance",
    path: "/finance",
    icon: Wallet,
  },
];


function getNavigationForRole(role) {
  switch (role) {
    case "STUDENT":
      return STUDENT_NAVIGATION;

    case "TEACHER":
      return TEACHER_NAVIGATION;

    case "BURSAR":
      return BURSAR_NAVIGATION;

    case "ADMIN":
    case "PLATFORM_ADMIN":
    default:
      return ADMIN_NAVIGATION;
  }
}


function getRoleLabel(role) {
  switch (role) {
    case "STUDENT":
      return "Student";

    case "TEACHER":
      return "Teacher";

    case "BURSAR":
      return "Bursar";

    case "PLATFORM_ADMIN":
      return "Platform Admin";

    case "ADMIN":
    default:
      return "Administrator";
  }
}


function getRoleWorkspace(role) {
  switch (role) {
    case "STUDENT":
      return "Student Workspace";

    case "TEACHER":
      return "Teacher Workspace";

    case "BURSAR":
      return "Finance Workspace";

    case "PLATFORM_ADMIN":
      return "Platform Workspace";

    case "ADMIN":
    default:
      return "School Workspace";
  }
}


function getRoleHome(role) {
  switch (role) {
    case "STUDENT":
      return "/student-portal";

    case "TEACHER":
      return "/teacher-portal";

    case "BURSAR":
      return "/finance";

    case "ADMIN":
    case "PLATFORM_ADMIN":
    default:
      return "/dashboard";
  }
}


function getDisplayName(user) {
  if (!user) {
    return "User";
  }

  if (user.full_name) {
    return user.full_name;
  }

  if (user.name) {
    return user.name;
  }

  if (user.first_name || user.last_name) {
    return `${user.first_name || ""} ${
      user.last_name || ""
    }`.trim();
  }

  return user.username || "User";
}


function getInitials(user) {
  const name = getDisplayName(user);

  if (!name || name === "User") {
    return "DS";
  }

  const parts = name
    .trim()
    .split(/\s+/);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return parts[0]
    .slice(0, 2)
    .toUpperCase();
}


function getSchoolName(user) {
  if (!user) {
    return "Darasa-AI";
  }

  return (
    user.school_name ||
    user.school?.name ||
    "Darasa-AI"
  );
}


function isActivePath(
  path,
  currentPath,
) {
  if (path === "/student-portal") {
    return currentPath === "/student-portal";
  }

  return currentPath === path;
}


function AppShell({ children }) {
  const {
    user,
    logout,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  const [
    collapsed,
    setCollapsed,
  ] = useState(false);

  const role =
    user?.role || "ADMIN";

  const navigation = useMemo(
    () =>
      getNavigationForRole(role),
    [role],
  );

  const roleLabel =
    getRoleLabel(role);

  const workspaceLabel =
    getRoleWorkspace(role);

  const displayName =
    getDisplayName(user);

  const initials =
    getInitials(user);

  const schoolName =
    getSchoolName(user);


  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);


  useEffect(() => {
    const handleKeyDown = (
      event,
    ) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, []);


  const handleLogout = () => {
    logout();

    navigate(
      "/login",
      {
        replace: true,
      },
    );
  };


  const handleBrandClick = () => {
    navigate(
      getRoleHome(role),
    );
  };


  const handleSettingsClick = () => {
    if (role === "STUDENT") {
      navigate(
        "/student-portal/settings",
      );
      return;
    }

    if (
      role === "ADMIN" ||
      role === "PLATFORM_ADMIN"
    ) {
      navigate("/dashboard");
      return;
    }

    if (role === "TEACHER") {
      navigate("/teacher-portal");
      return;
    }

    if (role === "BURSAR") {
      navigate("/finance");
      return;
    }

    navigate(
      getRoleHome(role),
    );
  };


  return (
    <div className="min-h-screen bg-[#F5F7F3] text-[#17382E]">

      {/* MOBILE OVERLAY */}

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() =>
            setSidebarOpen(false)
          }
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}


      {/* SIDEBAR */}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col",
          "border-r border-[#E4E8E2]",
          "bg-white",
          "transition-all duration-300",
          collapsed
            ? "w-[76px]"
            : "w-[264px]",
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >

        {/* BRAND */}

        <div
          className={[
            "flex h-[76px] items-center border-b border-[#E8EBE6]",
            collapsed
              ? "justify-center px-3"
              : "justify-between px-5",
          ].join(" ")}
        >
          <button
            type="button"
            onClick={
              handleBrandClick
            }
            className={[
              "flex items-center gap-3",
              collapsed
                ? "justify-center"
                : "",
            ].join(" ")}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B5D43] text-white shadow-sm">
              <GraduationCap
                size={21}
              />
            </div>

            {!collapsed && (
              <div className="text-left">
                <p className="text-[17px] font-extrabold tracking-tight text-[#17382E]">
                  Darasa-AI
                </p>

                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A9691]">
                  Education OS
                </p>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              setSidebarOpen(false)
            }
            className="rounded-lg p-2 text-[#788680] hover:bg-[#F3F5F1] hover:text-[#17382E] lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={19} />
          </button>
        </div>


        {/* WORKSPACE IDENTITY */}

        {!collapsed && (
          <div className="border-b border-[#E8EBE6] px-5 py-4">
            <div className="rounded-xl bg-[#F3F7F3] px-3.5 py-3">

              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A9691]">
                Current workspace
              </p>

              <div className="mt-2 flex items-center gap-2.5">

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#DCEBE3] text-[10px] font-extrabold text-[#0B5D43]">
                  {initials}
                </div>

                <div className="min-w-0">

                  <p className="truncate text-xs font-bold text-[#26493D]">
                    {roleLabel}
                  </p>

                  <p className="truncate text-[11px] text-[#82908A]">
                    {workspaceLabel}
                  </p>

                </div>
              </div>
            </div>
          </div>
        )}


        {/* NAVIGATION */}

        <div className="flex-1 overflow-y-auto px-3 py-5">

          {!collapsed && (
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#9AA59F]">
              Workspace
            </p>
          )}

          <nav className="space-y-1">

            {navigation.map(
              (item) => {
                const Icon =
                  item.icon;

                const active =
                  isActivePath(
                    item.path,
                    location.pathname,
                  );

                return (
                  <NavLink
                    key={
                      item.label
                    }
                    to={
                      item.path
                    }
                    title={
                      collapsed
                        ? item.label
                        : undefined
                    }
                    className={[
                      "group flex items-center rounded-xl transition-all",
                      collapsed
                        ? "justify-center px-3 py-3"
                        : "gap-3 px-3 py-2.5",
                      active
                        ? "bg-[#EAF3EE] text-[#0B5D43]"
                        : "text-[#66756E] hover:bg-[#F4F6F2] hover:text-[#17382E]",
                    ].join(" ")}
                  >

                    <Icon
                      size={18}
                      strokeWidth={
                        active
                          ? 2.4
                          : 2
                      }
                      className="shrink-0"
                    />

                    {!collapsed && (
                      <span
                        className={[
                          "text-sm",
                          active
                            ? "font-bold"
                            : "font-medium",
                        ].join(" ")}
                      >
                        {
                          item.label
                        }
                      </span>
                    )}

                    {active &&
                      !collapsed && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#0B5D43]" />
                      )}

                  </NavLink>
                );
              },
            )}

          </nav>
        </div>


        {/* SIDEBAR FOOTER */}

        <div className="border-t border-[#E8EBE6] p-3">

          {/* SETTINGS */}

          <button
            type="button"
            onClick={
              handleSettingsClick
            }
            title={
              collapsed
                ? "Settings"
                : undefined
            }
            className={[
              "flex w-full items-center rounded-xl text-[#66756E] transition hover:bg-[#F4F6F2] hover:text-[#17382E]",
              collapsed
                ? "justify-center px-3 py-3"
                : "gap-3 px-3 py-2.5",
              location.pathname ===
              "/student-portal/settings"
                ? "bg-[#EAF3EE] text-[#0B5D43]"
                : "",
            ].join(" ")}
          >
            <Settings
              size={18}
            />

            {!collapsed && (
              <span className="text-sm font-medium">
                Settings
              </span>
            )}

            {!collapsed &&
              location.pathname ===
                "/student-portal/settings" && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#0B5D43]" />
              )}
          </button>


          {/* SIGN OUT */}

          <button
            type="button"
            onClick={
              handleLogout
            }
            title={
              collapsed
                ? "Sign out"
                : undefined
            }
            className={[
              "mt-1 flex w-full items-center rounded-xl text-[#8A625F] transition hover:bg-[#FBF2F1] hover:text-[#8C4039]",
              collapsed
                ? "justify-center px-3 py-3"
                : "gap-3 px-3 py-2.5",
            ].join(" ")}
          >
            <LogOut
              size={18}
            />

            {!collapsed && (
              <span className="text-sm font-medium">
                Sign out
              </span>
            )}
          </button>


          {/* COLLAPSE */}

          <button
            type="button"
            onClick={() =>
              setCollapsed(
                (value) =>
                  !value,
              )
            }
            className="mt-2 hidden w-full items-center justify-center rounded-xl border border-[#E5E9E4] py-2.5 text-[#7D8A84] transition hover:bg-[#F5F7F3] hover:text-[#17382E] lg:flex"
            aria-label={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
          >
            {collapsed ? (
              <ChevronRight
                size={17}
              />
            ) : (
              <>
                <ChevronLeft
                  size={17}
                />

                <span className="ml-2 text-xs font-semibold">
                  Collapse
                </span>
              </>
            )}
          </button>

        </div>
      </aside>


      {/* MAIN AREA */}

      <div
        className={[
          "min-h-screen transition-all duration-300",
          collapsed
            ? "lg:pl-[76px]"
            : "lg:pl-[264px]",
        ].join(" ")}
      >

        {/* HEADER */}

        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#E4E8E2] bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">

          <div className="flex min-w-0 items-center gap-3">

            <button
              type="button"
              onClick={() =>
                setSidebarOpen(true)
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E4E8E2] text-[#607068] hover:bg-[#F4F6F2] lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0">

              <p className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-[#98A39E]">
                {workspaceLabel}
              </p>

              <p className="truncate text-sm font-semibold text-[#294A3F]">
                {schoolName}
              </p>

            </div>
          </div>


          {/* HEADER RIGHT */}

          <div className="flex items-center gap-2.5 sm:gap-3">

            {/* NOTIFICATIONS */}

            <button
              type="button"
              onClick={() => {
                if (
                  role ===
                  "STUDENT"
                ) {
                  navigate(
                    "/student-portal/notifications",
                  );
                }
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#E4E8E2] text-[#64736C] transition hover:bg-[#F4F6F2] hover:text-[#17382E]"
              aria-label="Notifications"
            >
              <Bell
                size={18}
              />
            </button>


            {/* DESKTOP PROFILE */}

            <div className="hidden items-center gap-2.5 sm:flex">

              <div className="text-right">

                <p className="max-w-[160px] truncate text-xs font-bold text-[#294A3F]">
                  {displayName}
                </p>

                <p className="text-[11px] text-[#8A9691]">
                  {roleLabel}
                </p>

              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B5D43] text-xs font-extrabold text-white">
                {initials}
              </div>

            </div>


            {/* MOBILE PROFILE */}

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B5D43] text-xs font-extrabold text-white sm:hidden">
              {initials}
            </div>

          </div>
        </header>


        {/* PAGE CONTENT */}

        <main className="min-h-[calc(100vh-76px)] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          {children}
        </main>

      </div>
    </div>
  );
}


export default AppShell;