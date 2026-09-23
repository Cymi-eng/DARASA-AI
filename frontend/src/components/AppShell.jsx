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

import { useAuth } from "../context/AuthContext.jsx";

const navigation = [
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

function AppShell({ children }) {
  const { logout } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentPath = window.location.pathname;

  const navigateTo = (path) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-200",
          sidebarCollapsed ? "w-[76px]" : "w-64",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex h-20 items-center border-b border-slate-100 px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <GraduationCap size={23} />
            </div>

            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-slate-900">
                  Darasa-AI
                </p>
                <p className="truncate text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Education OS
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {!sidebarCollapsed && (
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Workspace
            </p>
          )}

          {navigation.map((item) => {
            const Icon = item.icon;
            const active =
              currentPath === item.path ||
              (item.path !== "/dashboard" &&
                currentPath.startsWith(item.path));

            return (
              <button
                key={item.path}
                type="button"
                title={sidebarCollapsed ? item.label : undefined}
                onClick={() => navigateTo(item.path)}
                className={[
                  "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  sidebarCollapsed ? "justify-center" : "",
                ].join(" ")}
              >
                <Icon
                  size={19}
                  className={
                    active
                      ? "text-blue-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  }
                />

                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-3">
          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={() => navigateTo("/settings")}
              className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <Settings size={19} className="text-slate-400" />
              Settings
            </button>
          )}

          <button
            type="button"
            onClick={logout}
            title={sidebarCollapsed ? "Sign out" : undefined}
            className={[
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50",
              sidebarCollapsed ? "justify-center" : "",
            ].join(" ")}
          >
            <LogOut size={19} />

            {!sidebarCollapsed && <span>Sign out</span>}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setSidebarCollapsed((value) => !value)}
          className="absolute -right-3 top-24 hidden h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-900 lg:flex"
          aria-label="Toggle sidebar"
        >
          {sidebarCollapsed ? (
            <ChevronRight size={15} />
          ) : (
            <ChevronLeft size={15} />
          )}
        </button>
      </aside>

      <div
        className={[
          "transition-all duration-200",
          sidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-64",
        ].join(" ")}
      >
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>

            <div>
              <p className="text-sm font-semibold text-slate-900">
                School Administration
              </p>

              <p className="hidden text-xs text-slate-400 sm:block">
                Darasa-AI Education Management Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Notifications"
              onClick={() => navigateTo("/notifications")}
            >
              <Bell size={20} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
            </button>

            <div className="hidden h-8 w-px bg-slate-200 sm:block" />

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">
                Administrator
              </p>
              <p className="text-xs text-slate-400">School account</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              A
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default AppShell;