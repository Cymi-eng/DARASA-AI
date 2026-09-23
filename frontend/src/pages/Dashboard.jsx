import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CreditCard,
  GraduationCap,
  Loader2,
  School,
  Users,
} from "lucide-react";

import api from "../api";

const statCards = [
  {
    key: "students",
    label: "Students",
    icon: GraduationCap,
    description: "Enrolled learners",
  },
  {
    key: "teachers",
    label: "Teachers",
    icon: Users,
    description: "Teaching staff",
  },
  {
    key: "classrooms",
    label: "Classrooms",
    icon: School,
    description: "Active learning spaces",
  },
  {
    key: "assessments",
    label: "CBC Assessments",
    icon: BookOpenCheck,
    description: "Competency records",
  },
  {
    key: "payments",
    label: "Fee Payments",
    icon: CreditCard,
    description: "Recorded transactions",
  },
];

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/dashboard/");

        if (isMounted) {
          setDashboard(response.data);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError.response?.data?.detail ||
              "Unable to load dashboard data."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalRecords = dashboard
    ? Object.values(dashboard).reduce(
        (total, value) =>
          typeof value === "number" ? total + value : total,
        0
      )
    : 0;

  const quickAccess = [
    {
      label: "Students",
      description: "Manage learner records",
      icon: GraduationCap,
      path: "/students",
    },
    {
      label: "Classrooms",
      description: "Manage classes and grades",
      icon: School,
      path: "/classrooms",
    },
    {
      label: "CBC Assessment",
      description: "Track competency progress",
      icon: BookOpenCheck,
      path: "/competencies",
    },
    {
      label: "Finance",
      description: "Manage school payments",
      icon: CreditCard,
      path: "/finance",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0B5D43]">
              School Overview
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#17382E] sm:text-4xl">
              Dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65736E] sm:text-base">
              Monitor learners, teaching activity, CBC assessments and
              school operations from one place.
            </p>
          </div>

          <div className="rounded-xl border border-[#E1E4DE] bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8A9691]">
              Total records
            </p>

            <p className="mt-1 text-2xl font-bold text-[#0B5D43]">
              {loading ? "—" : totalRecords.toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      {/* Loading */}
      {loading && (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-[#E1E4DE] bg-white shadow-sm">
          <div className="flex items-center gap-3 text-sm font-medium text-[#65736E]">
            <Loader2 className="animate-spin text-[#0B5D43]" size={20} />
            Loading school data...
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div
          role="alert"
          className="flex items-start gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"
        >
          <AlertCircle className="mt-0.5 shrink-0" size={21} />

          <div>
            <p className="font-semibold">
              Dashboard data could not be loaded
            </p>

            <p className="mt-1 text-sm leading-6 text-red-600">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Dashboard content */}
      {!loading && !error && dashboard && (
        <>
          {/* Statistics */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {statCards.map((card) => {
              const Icon = card.icon;
              const value = dashboard[card.key] ?? 0;

              return (
                <div
                  key={card.key}
                  className="group rounded-2xl border border-[#E1E4DE] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#C9DCD2] hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3EE] text-[#0B5D43]">
                      <Icon size={21} />
                    </div>

                    <ArrowRight
                      size={17}
                      className="text-[#C1CAC5] transition group-hover:translate-x-1 group-hover:text-[#0B5D43]"
                    />
                  </div>

                  <p className="mt-5 text-sm font-medium text-[#65736E]">
                    {card.label}
                  </p>

                  <p className="mt-1 text-3xl font-bold tracking-tight text-[#17382E]">
                    {Number(value).toLocaleString()}
                  </p>

                  <p className="mt-2 text-xs text-[#9AA49F]">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </section>

          {/* Management overview */}
          <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="rounded-2xl border border-[#E1E4DE] bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#17382E]">
                    Education Management Overview
                  </h2>

                  <p className="mt-1 text-sm text-[#65736E]">
                    Your current school data at a glance.
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3EE] text-[#0B5D43]">
                  <BarChart3 size={20} />
                </div>
              </div>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <div className="rounded-xl bg-[#F8F7F2] p-5">
                  <p className="text-sm font-medium text-[#65736E]">
                    Learner population
                  </p>

                  <p className="mt-2 text-3xl font-bold text-[#17382E]">
                    {Number(dashboard.students ?? 0).toLocaleString()}
                  </p>

                  <p className="mt-2 text-xs text-[#8A9691]">
                    Students currently recorded in Darasa-AI
                  </p>
                </div>

                <div className="rounded-xl bg-[#F8F7F2] p-5">
                  <p className="text-sm font-medium text-[#65736E]">
                    Assessment activity
                  </p>

                  <p className="mt-2 text-3xl font-bold text-[#17382E]">
                    {Number(dashboard.assessments ?? 0).toLocaleString()}
                  </p>

                  <p className="mt-2 text-xs text-[#8A9691]">
                    Competency assessment records
                  </p>
                </div>
              </div>
            </div>

            {/* CBC intelligence */}
            <div className="rounded-2xl border border-[#D9E7DF] bg-[#F3F8F5] p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B5D43] text-white">
                <BookOpenCheck size={21} />
              </div>

              <h2 className="mt-5 text-lg font-bold text-[#0B4D39]">
                CBC Intelligence
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#5E6C67]">
                Darasa-AI turns continuous competency assessments into
                actionable learning insights for teachers and school
                administrators.
              </p>

              <div className="mt-6 rounded-xl border border-[#E7D79C] bg-[#FFF9E7] p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#94720D]">
                  Current assessments
                </p>

                <p className="mt-1 text-2xl font-bold text-[#5C4808]">
                  {Number(dashboard.assessments ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          </section>

          {/* Quick access */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-[#17382E]">
                Quick Access
              </h2>

              <p className="mt-1 text-sm text-[#65736E]">
                Common school administration areas.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickAccess.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => {
                      window.history.pushState({}, "", item.path);
                      window.dispatchEvent(
                        new PopStateEvent("popstate")
                      );
                    }}
                    className="group rounded-2xl border border-[#E1E4DE] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#BFD7CB] hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1F3EE] text-[#0B5D43] transition group-hover:bg-[#EAF3EE]">
                        <Icon size={19} />
                      </div>

                      <ArrowRight
                        size={17}
                        className="text-[#C1CAC5] transition group-hover:translate-x-1 group-hover:text-[#0B5D43]"
                      />
                    </div>

                    <p className="mt-4 text-sm font-bold text-[#17382E]">
                      {item.label}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#65736E]">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Dashboard;