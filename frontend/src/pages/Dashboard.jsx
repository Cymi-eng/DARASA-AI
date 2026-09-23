import { useEffect, useState } from "react";
import {
  AlertCircle,
  BookOpenCheck,
  GraduationCap,
  School,
  Users,
} from "lucide-react";

import api from "../api";

function StatCard({ icon: Icon, label, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
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
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading school data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 shrink-0 text-red-600" size={22} />

          <div>
            <h2 className="font-semibold text-red-900">
              Dashboard unavailable
            </h2>

            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          School overview
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Dashboard
        </h1>

        <p className="mt-2 max-w-2xl text-slate-500">
          A real-time overview of learners, teaching capacity, classroom
          activity, competency assessment, and fee transactions.
        </p>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          icon={GraduationCap}
          label="Students"
          value={dashboard?.students ?? 0}
          description="Registered learners"
        />

        <StatCard
          icon={Users}
          label="Teachers"
          value={dashboard?.teachers ?? 0}
          description="Teaching staff"
        />

        <StatCard
          icon={School}
          label="Classrooms"
          value={dashboard?.classrooms ?? 0}
          description="Active learning groups"
        />

        <StatCard
          icon={BookOpenCheck}
          label="Assessments"
          value={dashboard?.assessments ?? 0}
          description="Competency records"
        />

        <StatCard
          icon={AlertCircle}
          label="Payments"
          value={dashboard?.payments ?? 0}
          description="Fee transactions"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                CBC Learning Environment
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Competency-based learning and continuous assessment
              </p>
            </div>

            <BookOpenCheck className="text-blue-600" size={24} />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Learner tracking</p>
              <p className="mt-2 font-semibold text-slate-900">
                Individualized
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Assessment model</p>
              <p className="mt-2 font-semibold text-slate-900">
                Competency-based
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Learning support</p>
              <p className="mt-2 font-semibold text-slate-900">
                Adaptive
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Platform status
          </h2>

          <div className="mt-6 flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />

            <span className="font-medium text-slate-900">
              Backend connected
            </span>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            Darasa-AI is connected to the production API and ready to
            synchronize school management and learning data.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;