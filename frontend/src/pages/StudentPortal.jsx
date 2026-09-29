import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  GraduationCap,
  Lightbulb,
  Loader2,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";

import api from "../api";

const masteryConfig = {
  EE: {
    label: "Exceeding Expectations",
    shortLabel: "EE",
  },
  ME: {
    label: "Meeting Expectations",
    shortLabel: "ME",
  },
  AE: {
    label: "Approaching Expectations",
    shortLabel: "AE",
  },
  BE: {
    label: "Below Expectations",
    shortLabel: "BE",
  },
};

const learningAreaLabels = {
  MATH: "Mathematics",
  ENG: "English",
  KIS: "Kiswahili",
  SCI: "Science",
  SST: "Social Studies",
  CRE: "CRE",
  CA: "Creative Arts",
  AGR: "Agriculture",
};

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getMasteryLabel(value) {
  return masteryConfig[value]?.shortLabel || value || "—";
}

function getMasteryTone(value) {
  switch (value) {
    case "EE":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "ME":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "AE":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "BE":
      return "bg-red-50 text-red-700 border-red-100";
    default:
      return "bg-slate-50 text-slate-600 border-slate-100";
  }
}

function getRecommendationText(item) {
  if (typeof item === "string") {
    return item;
  }

  if (!item || typeof item !== "object") {
    return "Continue practising your learning activities.";
  }

  return (
    item.recommendation ||
    item.description ||
    item.message ||
    item.action ||
    item.title ||
    "Continue practising your learning activities."
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  helper,
  iconClassName = "bg-blue-50 text-blue-600",
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          {helper && (
            <p className="mt-1 text-xs text-slate-500">{helper}</p>
          )}
        </div>

        <div className={`rounded-xl p-3 ${iconClassName}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description, action }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          {Icon && <Icon size={19} className="text-blue-600" />}
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        </div>

        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>

      {action}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

function StudentPortal() {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [competencies, setCompetencies] = useState([]);
  const [adaptiveProfile, setAdaptiveProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [feeSummary, setFeeSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadPortal = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    try {
      const userResponse = await api.get("/users/me/");
      const studentResponse = await api.get("/students/me/");

      const currentUser = userResponse.data;
      const currentStudent = studentResponse.data;

      setUser(currentUser);
      setStudent(currentStudent);

      const studentId = currentStudent?.id;

      const requests = [
        api.get("/competencies/"),
        api.get("/fee-ledger/summary/"),
        api.get("/fee-payments/"),
        api.get("/notifications/"),
      ];

      if (studentId) {
        requests.push(
          api.get(`/students/${studentId}/adaptive-profile/`),
          api.get(`/students/${studentId}/recommendations/`),
        );
      }

      const responses = await Promise.allSettled(requests);

      const [
        competencyResponse,
        feeSummaryResponse,
        paymentsResponse,
        notificationsResponse,
        adaptiveResponse,
        recommendationResponse,
      ] = responses;

      if (competencyResponse.status === "fulfilled") {
        setCompetencies(
          Array.isArray(competencyResponse.value.data)
            ? competencyResponse.value.data
            : competencyResponse.value.data?.results || [],
        );
      }

      if (feeSummaryResponse.status === "fulfilled") {
        setFeeSummary(feeSummaryResponse.value.data);
      }

      if (paymentsResponse.status === "fulfilled") {
        setPayments(
          Array.isArray(paymentsResponse.value.data)
            ? paymentsResponse.value.data
            : paymentsResponse.value.data?.results || [],
        );
      }

      if (notificationsResponse.status === "fulfilled") {
        setNotifications(
          Array.isArray(notificationsResponse.value.data)
            ? notificationsResponse.value.data
            : notificationsResponse.value.data?.results || [],
        );
      }

      if (adaptiveResponse?.status === "fulfilled") {
        setAdaptiveProfile(adaptiveResponse.value.data);
      }

      if (recommendationResponse?.status === "fulfilled") {
        const data = recommendationResponse.value.data;

        setRecommendations(
          Array.isArray(data)
            ? data
            : data?.recommendations || data?.results || [],
        );
      }
    } catch (requestError) {
      const detail =
        requestError?.response?.data?.detail ||
        "We couldn't load your student portal. Please try again.";

      setError(detail);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPortal();
  }, []);

  const masteryStats = useMemo(() => {
    const stats = {
      EE: 0,
      ME: 0,
      AE: 0,
      BE: 0,
    };

    competencies.forEach((item) => {
      if (stats[item.mastery_level] !== undefined) {
        stats[item.mastery_level] += 1;
      }
    });

    return stats;
  }, [competencies]);

  const masteryRate = useMemo(() => {
    if (!competencies.length) {
      return 0;
    }

    const demonstrated =
      masteryStats.EE + masteryStats.ME;

    return Math.round(
      (demonstrated / competencies.length) * 100,
    );
  }, [competencies, masteryStats]);

  const learningAreas = useMemo(() => {
    const grouped = {};

    competencies.forEach((item) => {
      const key = item.learning_area || "OTHER";

      if (!grouped[key]) {
        grouped[key] = {
          total: 0,
          mastered: 0,
          latest: null,
        };
      }

      grouped[key].total += 1;

      if (item.mastery_level === "EE" || item.mastery_level === "ME") {
        grouped[key].mastered += 1;
      }

      if (
        !grouped[key].latest ||
        new Date(item.assessed_on) >
          new Date(grouped[key].latest.assessed_on)
      ) {
        grouped[key].latest = item;
      }
    });

    return Object.entries(grouped)
      .map(([key, value]) => ({
        key,
        label: learningAreaLabels[key] || key,
        ...value,
        percentage: value.total
          ? Math.round((value.mastered / value.total) * 100)
          : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [competencies]);

  const recentCompetencies = useMemo(
    () => competencies.slice(0, 5),
    [competencies],
  );

  const recentPayments = useMemo(
    () => payments.slice(0, 5),
    [payments],
  );

  const unreadNotifications = useMemo(
    () =>
      notifications.filter(
        (item) =>
          item.status === "PENDING" ||
          item.status === "UNREAD" ||
          item.is_read === false,
      ),
    [notifications],
  );

  const firstName =
    student?.first_name ||
    user?.first_name ||
    user?.username ||
    "Learner";

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <Loader2 size={20} className="animate-spin text-blue-600" />
          Loading your learning workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <section className="overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-300">
              Student Learning Workspace
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome back, {firstName}.
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Track your CBC progress, review assessments, follow
              personalised recommendations, and stay up to date with
              your school.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {student?.grade && (
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                  {student.grade}
                </span>
              )}

              {student?.admission_number && (
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                  {student.admission_number}
                </span>
              )}

              {student?.classroom_name && (
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                  {student.classroom_name}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadPortal({ silent: true })}
            disabled={refreshing}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh workspace
          </button>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Something went wrong</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Mastery progress"
          value={`${masteryRate}%`}
          helper={`${competencies.length} assessments recorded`}
          iconClassName="bg-blue-50 text-blue-600"
        />

        <StatCard
          icon={BookOpen}
          label="Learning areas"
          value={learningAreas.length}
          helper="Areas with recorded assessments"
          iconClassName="bg-violet-50 text-violet-600"
        />

        <StatCard
          icon={Wallet}
          label="Fee account"
          value={formatCurrency(feeSummary?.net_balance)}
          helper="Net recorded balance"
          iconClassName="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          icon={Clock3}
          label="Notifications"
          value={unreadNotifications.length}
          helper="Items requiring your attention"
          iconClassName="bg-amber-50 text-amber-600"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            icon={GraduationCap}
            title="Learning progress"
            description="Your latest CBC competency performance by learning area."
          />

          {learningAreas.length === 0 ? (
            <EmptyState message="No competency assessments have been recorded yet." />
          ) : (
            <div className="space-y-5">
              {learningAreas.map((area) => (
                <div key={area.key}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {area.label}
                      </p>
                      <p className="text-xs text-slate-500">
                        {area.mastered} of {area.total} assessments at
                        meeting or exceeding expectations
                      </p>
                    </div>

                    <span className="text-sm font-bold text-slate-900">
                      {area.percentage}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{
                        width: `${area.percentage}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            icon={TrendingUp}
            title="Mastery overview"
            description="Assessment distribution."
          />

          <div className="space-y-3">
            {Object.entries(masteryConfig).map(
              ([key, config]) => (
                <div
                  key={key}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 ${getMasteryTone(
                    key,
                  )}`}
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {config.shortLabel}
                    </p>
                    <p className="mt-0.5 text-xs opacity-80">
                      {config.label}
                    </p>
                  </div>

                  <span className="text-lg font-bold">
                    {masteryStats[key]}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            icon={BookOpen}
            title="Recent assessments"
            description="Your most recent competency records."
          />

          {recentCompetencies.length === 0 ? (
            <EmptyState message="No recent assessments available." />
          ) : (
            <div className="divide-y divide-slate-100">
              {recentCompetencies.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {learningAreaLabels[item.learning_area] ||
                        item.learning_area ||
                        "Learning area"}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {item.strand ||
                        item.sub_strand ||
                        item.notes ||
                        "Competency assessment"}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(item.assessed_on)}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${getMasteryTone(
                      item.mastery_level,
                    )}`}
                  >
                    {getMasteryLabel(item.mastery_level)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            icon={Lightbulb}
            title="Personalised recommendations"
            description="Suggestions based on your learning profile."
          />

          {recommendations.length === 0 ? (
            <EmptyState message="No personalised recommendations are available yet." />
          ) : (
            <div className="space-y-3">
              {recommendations.slice(0, 5).map((item, index) => (
                <div
                  key={item?.id || index}
                  className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="mt-0.5 rounded-lg bg-blue-100 p-2 text-blue-600">
                    <ArrowRight size={16} />
                  </div>

                  <p className="text-sm leading-6 text-slate-700">
                    {getRecommendationText(item)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            icon={CreditCard}
            title="Fee activity"
            description="Recent payment records on your account."
          />

          {recentPayments.length === 0 ? (
            <EmptyState message="No fee payment records are available." />
          ) : (
            <div className="divide-y divide-slate-100">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {formatCurrency(payment.amount)}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {payment.mpesa_receipt_number ||
                        payment.transaction_id ||
                        "Payment record"}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(payment.paid_at || payment.created_at)}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      payment.status === "CONFIRMED"
                        ? "bg-emerald-50 text-emerald-700"
                        : payment.status === "FAILED"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {payment.status || "PENDING"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            icon={CheckCircle2}
            title="Notifications"
            description="Latest messages from your school."
          />

          {notifications.length === 0 ? (
            <EmptyState message="You don't have any notifications yet." />
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 5).map((item, index) => (
                <div
                  key={item.id || index}
                  className="rounded-xl border border-slate-100 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">
                      {item.title ||
                        item.subject ||
                        "School notification"}
                    </p>

                    <ChevronRight
                      size={16}
                      className="shrink-0 text-slate-400"
                    />
                  </div>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {item.message ||
                      item.content ||
                      item.body ||
                      "You have a new notification."}
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    {formatDate(item.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {adaptiveProfile && (
        <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6 shadow-sm">
          <SectionHeader
            icon={Lightbulb}
            title="Your adaptive learning profile"
            description="Insights generated from your competency history."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(adaptiveProfile)
              .filter(
                ([, value]) =>
                  typeof value !== "object" &&
                  value !== null,
              )
              .slice(0, 6)
              .map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-xl border border-blue-100 bg-white p-4"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {key.replaceAll("_", " ")}
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {String(value)}
                  </p>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default StudentPortal;