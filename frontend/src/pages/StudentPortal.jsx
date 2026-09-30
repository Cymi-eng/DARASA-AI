import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  GraduationCap,
  Loader2,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import api from "../api";

const MASTERY_LABELS = {
  EE: "Exceeding Expectations",
  ME: "Meeting Expectations",
  AE: "Approaching Expectations",
  BE: "Below Expectations",
};

const MASTERY_STYLES = {
  EE: "bg-[#EAF3EE] text-[#0B5D43]",
  ME: "bg-[#EEF5E8] text-[#668B2E]",
  AE: "bg-[#FFF7E4] text-[#9A7600]",
  BE: "bg-[#FFF0EE] text-[#B33A31]",
};

const LEARNING_AREAS = {
  MATH: "Mathematics",
  ENG: "English",
  KIS: "Kiswahili",
  SCI: "Science",
  SST: "Social Studies",
  CRE: "CRE",
  CA: "Creative Arts",
  AGR: "Agriculture",
};

function getList(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

function getStudentName(student) {
  if (!student) {
    return "Student";
  }

  const name = `${student.first_name || ""} ${
    student.last_name || ""
  }`.trim();

  return name || student.username || "Student";
}

function getInitials(student) {
  const name = getStudentName(student);

  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

function getLearningAreaLabel(value) {
  return (
    LEARNING_AREAS[value] ||
    value ||
    "Learning area"
  );
}

function getMasteryLabel(value) {
  return (
    MASTERY_LABELS[value] ||
    value ||
    "Not assessed"
  );
}

function getMasteryStyle(value) {
  return (
    MASTERY_STYLES[value] ||
    "bg-[#F0F3F0] text-[#6D7B75]"
  );
}

function formatDate(value) {
  if (!value) {
    return "Date unavailable";
  }

  try {
    return new Intl.DateTimeFormat(
      "en-KE",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    ).format(new Date(value));
  } catch {
    return value;
  }
}

function formatCurrency(value) {
  const amount = Number(value || 0);

  return `Ksh ${amount.toLocaleString(
    "en-KE",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  )}`;
}

function SectionHeader({
  title,
  description,
  action,
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-[#17382E] sm:text-2xl">
          {title}
        </h1>

        <p className="mt-1 text-sm leading-6 text-[#7A8982]">
          {description}
        </p>
      </div>

      {action}
    </div>
  );
}

function EmptyState({
  icon: Icon = BookOpenCheck,
  title,
  description,
}) {
  return (
    <div className="rounded-2xl border border-[#E4E8E2] bg-white px-6 py-14 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3EE] text-[#0B5D43]">
        <Icon size={25} />
      </div>

      <h3 className="mt-4 text-base font-bold text-[#17382E]">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7A8982]">
        {description}
      </p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}) {
  return (
    <div className="rounded-2xl border border-[#F0D8D5] bg-[#FFF8F7] px-6 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#FCEAE7] text-[#B33A31]">
        <AlertCircle size={23} />
      </div>

      <h3 className="mt-4 font-bold text-[#7D312C]">
        Unable to load workspace
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8D6B67]">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0B5D43] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#084936]"
      >
        <RefreshCw size={16} />
        Try again
      </button>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-[#E4E8E2] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8A9691]">
            {label}
          </p>

          <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#17382E]">
            {value}
          </p>

          <p className="mt-1 text-xs text-[#89958F]">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3EE] text-[#0B5D43]">
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

function StudentOverview({
  student,
  competencies,
  recommendations,
  ledger,
  payments,
  notifications,
  adaptiveProfile,
}) {
  const total = competencies.length;

  const masteryCounts = useMemo(
    () => ({
      EE: competencies.filter(
        (item) =>
          item.mastery_level === "EE"
      ).length,

      ME: competencies.filter(
        (item) =>
          item.mastery_level === "ME"
      ).length,

      AE: competencies.filter(
        (item) =>
          item.mastery_level === "AE"
      ).length,

      BE: competencies.filter(
        (item) =>
          item.mastery_level === "BE"
      ).length,
    }),
    [competencies],
  );

  const masteryPercentage =
    total > 0
      ? Math.round(
          ((masteryCounts.EE +
            masteryCounts.ME) /
            total) *
            100
        )
      : 0;

  const recentAssessments =
    competencies.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-[#0B5D43] p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B9D9CA]">
              Student Learning Workspace
            </p>

            <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Welcome back,{" "}
              {student?.first_name ||
                "Student"}
              .
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#D2E7DC]">
              Track your CBC progress,
              review assessments, follow
              personalised recommendations,
              and stay up to date with your
              school.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {student?.grade && (
                <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                  {student.grade}
                </span>
              )}

              {student?.admission_number && (
                <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                  {student.admission_number}
                </span>
              )}

              {student?.classroom?.name && (
                <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                  {student.classroom.name}
                </span>
              )}
            </div>
          </div>

          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white/10 text-2xl font-extrabold ring-1 ring-white/20">
            {getInitials(student)}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={BarChart3}
          label="Mastery progress"
          value={`${masteryPercentage}%`}
          description={`${total} assessments recorded`}
        />

        <StatCard
          icon={GraduationCap}
          label="Learning areas"
          value={
            new Set(
              competencies.map(
                (item) =>
                  item.learning_area
              )
            ).size
          }
          description="Areas with recorded assessments"
        />

        <StatCard
          icon={Wallet}
          label="Fee account"
          value={formatCurrency(
            ledger?.balance || 0
          )}
          description="Net recorded balance"
        />

        <StatCard
          icon={Bell}
          label="Notifications"
          value={notifications.length}
          description="Items requiring your attention"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-2xl border border-[#E4E8E2] bg-white shadow-sm">
          <div className="border-b border-[#E9ECE7] px-5 py-4">
            <h2 className="font-bold text-[#17382E]">
              Learning progress
            </h2>

            <p className="mt-1 text-xs text-[#87938D]">
              Your latest CBC competency
              performance by learning area.
            </p>
          </div>

          {competencies.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <BookOpenCheck
                size={28}
                className="mx-auto text-[#A0AAA5]"
              />

              <p className="mt-3 text-sm font-semibold text-[#596861]">
                No competency assessments
                have been recorded yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {Object.entries(
                LEARNING_AREAS
              ).map(
                ([code, label]) => {
                  const records =
                    competencies.filter(
                      (item) =>
                        item.learning_area ===
                        code
                    );

                  if (!records.length) {
                    return null;
                  }

                  const mastered =
                    records.filter(
                      (item) =>
                        item.mastery_level ===
                          "EE" ||
                        item.mastery_level ===
                          "ME"
                    ).length;

                  const percentage =
                    Math.round(
                      (mastered /
                        records.length) *
                        100
                    );

                  return (
                    <div
                      key={code}
                      className="rounded-xl border border-[#E8ECE7] bg-[#FAFBF9] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-[#8A9691]">
                            {code}
                          </p>

                          <p className="mt-1 text-sm font-bold text-[#294A3F]">
                            {label}
                          </p>
                        </div>

                        <span className="text-sm font-extrabold text-[#0B5D43]">
                          {percentage}%
                        </span>
                      </div>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E5EAE5]">
                        <div
                          className="h-full rounded-full bg-[#0B5D43]"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-[11px] text-[#89958F]">
                        {records.length} assessment
                        {records.length === 1
                          ? ""
                          : "s"}
                      </p>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#E4E8E2] bg-white shadow-sm">
          <div className="border-b border-[#E9ECE7] px-5 py-4">
            <h2 className="font-bold text-[#17382E]">
              Mastery overview
            </h2>
          </div>

          <div className="space-y-3 p-5">
            {Object.entries(
              masteryCounts
            ).map(([level, count]) => (
              <div
                key={level}
                className="flex items-center justify-between rounded-xl bg-[#FAFBF9] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-bold text-[#294A3F]">
                    {level}
                  </p>

                  <p className="text-[11px] text-[#89958F]">
                    {getMasteryLabel(level)}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${getMasteryStyle(
                    level
                  )}`}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#E4E8E2] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E9ECE7] px-5 py-4">
            <div>
              <h2 className="font-bold text-[#17382E]">
                Recent assessments
              </h2>

              <p className="mt-1 text-xs text-[#87938D]">
                Your latest competency records.
              </p>
            </div>
          </div>

          {recentAssessments.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-[#7A8982]">
              No recent competency records.
            </p>
          ) : (
            <div className="divide-y divide-[#EEF0EC]">
              {recentAssessments.map(
                (item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#294A3F]">
                        {getLearningAreaLabel(
                          item.learning_area
                        )}
                      </p>

                      <p className="mt-1 truncate text-xs text-[#89958F]">
                        {item.strand ||
                          "Competency assessment"}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getMasteryStyle(
                          item.mastery_level
                        )}`}
                      >
                        {item.mastery_level}
                      </span>

                      <p className="mt-2 text-[10px] text-[#9AA49F]">
                        {formatDate(
                          item.assessed_on
                        )}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#E4E8E2] bg-white shadow-sm">
          <div className="border-b border-[#E9ECE7] px-5 py-4">
            <h2 className="font-bold text-[#17382E]">
              Personalised recommendations
            </h2>

            <p className="mt-1 text-xs text-[#87938D]">
              Suggestions generated from your
              learning history.
            </p>
          </div>

          {recommendations.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <GraduationCap
                size={28}
                className="mx-auto text-[#A0AAA5]"
              />

              <p className="mt-3 text-sm text-[#7A8982]">
                No personalised
                recommendations are available
                yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#EEF0EC]">
              {recommendations
                .slice(0, 4)
                .map(
                  (
                    recommendation,
                    index
                  ) => (
                    <div
                      key={
                        recommendation.id ||
                        index
                      }
                      className="flex gap-3 px-5 py-4"
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF3EE] text-[#0B5D43]">
                        <ArrowRight
                          size={15}
                        />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-[#294A3F]">
                          {recommendation.title ||
                            recommendation.learning_area ||
                            "Learning recommendation"}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#7A8982]">
                          {recommendation.description ||
                            recommendation.reason ||
                            recommendation.message ||
                            "Continue practising this learning area."}
                        </p>
                      </div>
                    </div>
                  )
                )}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#E4E8E2] bg-white shadow-sm">
          <div className="border-b border-[#E9ECE7] px-5 py-4">
            <h2 className="font-bold text-[#17382E]">
              Fee activity
            </h2>
          </div>

          {payments.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-[#7A8982]">
              No fee payment records.
            </p>
          ) : (
            <div className="divide-y divide-[#EEF0EC]">
              {payments
                .slice(0, 4)
                .map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#294A3F]">
                        {payment.transaction_id ||
                          payment.mpesa_receipt_number ||
                          "Fee payment"}
                      </p>

                      <p className="mt-1 text-xs text-[#89958F]">
                        {formatDate(
                          payment.paid_at ||
                            payment.created_at
                        )}
                      </p>
                    </div>

                    <p className="font-bold text-[#0B5D43]">
                      {formatCurrency(
                        payment.amount
                      )}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#E4E8E2] bg-white shadow-sm">
          <div className="border-b border-[#E9ECE7] px-5 py-4">
            <h2 className="font-bold text-[#17382E]">
              Notifications
            </h2>
          </div>

          {notifications.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-[#7A8982]">
              No notifications yet.
            </p>
          ) : (
            <div className="divide-y divide-[#EEF0EC]">
              {notifications
                .slice(0, 4)
                .map((notification) => (
                  <div
                    key={notification.id}
                    className="flex gap-3 px-5 py-4"
                  >
                    <Bell
                      size={17}
                      className="mt-0.5 shrink-0 text-[#0B5D43]"
                    />

                    <div>
                      <p className="text-sm font-bold text-[#294A3F]">
                        {notification.subject ||
                          "School notification"}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#7A8982]">
                        {notification.message ||
                          "You have a new notification."}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[#DCE9E1] bg-[#F2F8F4] p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#0B5D43] shadow-sm">
            <BarChart3 size={20} />
          </div>

          <div>
            <h2 className="font-bold text-[#17382E]">
              Your adaptive learning profile
            </h2>

            <p className="mt-1 text-sm leading-6 text-[#6F8078]">
              Insights generated from your
              competency history.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#456057]">
                Intervention count{" "}
                {adaptiveProfile?.intervention_count ||
                  0}
              </span>

              {adaptiveProfile?.overall_mastery && (
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#456057]">
                  Overall mastery{" "}
                  {
                    adaptiveProfile.overall_mastery
                  }
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentProgress({
  competencies,
}) {
  const total = competencies.length;

  const masteryCounts = {
    EE: competencies.filter(
      (item) =>
        item.mastery_level === "EE"
    ).length,

    ME: competencies.filter(
      (item) =>
        item.mastery_level === "ME"
    ).length,

    AE: competencies.filter(
      (item) =>
        item.mastery_level === "AE"
    ).length,

    BE: competencies.filter(
      (item) =>
        item.mastery_level === "BE"
    ).length,
  };

  const mastered =
    masteryCounts.EE +
    masteryCounts.ME;

  const masteryPercentage =
    total > 0
      ? Math.round(
          (mastered / total) * 100
        )
      : 0;

  return (
    <div>
      <SectionHeader
        title="My Progress"
        description="Track your CBC competency development across learning areas."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={BarChart3}
          label="Overall mastery"
          value={`${masteryPercentage}%`}
          description="EE + ME assessments"
        />

        <StatCard
          icon={BookOpenCheck}
          label="Assessments"
          value={total}
          description="Recorded competency records"
        />

        <StatCard
          icon={GraduationCap}
          label="Developing areas"
          value={
            masteryCounts.AE +
            masteryCounts.BE
          }
          description="Assessments needing attention"
        />
      </div>

      <div className="mt-6 rounded-2xl border border-[#E4E8E2] bg-white shadow-sm">
        <div className="border-b border-[#E9ECE7] px-5 py-4">
          <h2 className="font-bold text-[#17382E]">
            Learning areas
          </h2>

          <p className="mt-1 text-xs text-[#87938D]">
            Your competency records by CBC
            learning area.
          </p>
        </div>

        {total === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No progress recorded yet"
              description="Your progress will appear here when your teachers record competency assessments."
            />
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(
              LEARNING_AREAS
            ).map(([code, label]) => {
              const records =
                competencies.filter(
                  (item) =>
                    item.learning_area ===
                    code
                );

              const mastered =
                records.filter(
                  (item) =>
                    item.mastery_level ===
                      "EE" ||
                    item.mastery_level ===
                      "ME"
                ).length;

              const percentage =
                records.length
                  ? Math.round(
                      (mastered /
                        records.length) *
                        100
                    )
                  : 0;

              return (
                <div
                  key={code}
                  className="rounded-2xl border border-[#E8ECE7] bg-[#FAFBF9] p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-[#8A9691]">
                    {code}
                  </p>

                  <p className="mt-1 font-bold text-[#294A3F]">
                    {label}
                  </p>

                  <div className="mt-4 flex items-end justify-between">
                    <span className="text-2xl font-extrabold text-[#0B5D43]">
                      {percentage}%
                    </span>

                    <span className="text-xs text-[#89958F]">
                      {records.length} records
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E5EAE5]">
                    <div
                      className="h-full rounded-full bg-[#0B5D43]"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-[#E4E8E2] bg-white shadow-sm">
        <div className="border-b border-[#E9ECE7] px-5 py-4">
          <h2 className="font-bold text-[#17382E]">
            Mastery breakdown
          </h2>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(
            masteryCounts
          ).map(([level, count]) => (
            <div
              key={level}
              className="rounded-xl border border-[#E8ECE7] p-4"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${getMasteryStyle(
                    level
                  )}`}
                >
                  {level}
                </span>

                <span className="text-2xl font-extrabold text-[#17382E]">
                  {count}
                </span>
              </div>

              <p className="mt-3 text-xs text-[#7A8982]">
                {getMasteryLabel(level)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StudentAssessments({
  competencies,
}) {
  return (
    <div>
      <SectionHeader
        title="My Assessments"
        description="Review the competency assessments recorded by your teachers."
      />

      {competencies.length === 0 ? (
        <EmptyState
          title="No assessments yet"
          description="Your competency assessments will appear here once your teacher records learning evidence."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E4E8E2] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-[#E9ECE7] bg-[#FAFBF9] text-left">
                  <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wide text-[#87938D]">
                    Learning area
                  </th>

                  <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wide text-[#87938D]">
                    Strand
                  </th>

                  <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wide text-[#87938D]">
                    Mastery
                  </th>

                  <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wide text-[#87938D]">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {competencies.map(
                  (item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#EEF0EC] last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-[#294A3F]">
                          {getLearningAreaLabel(
                            item.learning_area
                          )}
                        </p>

                        <p className="mt-1 text-xs text-[#89958F]">
                          {item.sub_strand ||
                            ""}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-[#68766F]">
                        {item.strand || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${getMasteryStyle(
                            item.mastery_level
                          )}`}
                        >
                          {item.mastery_level ||
                            "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-[#68766F]">
                        {formatDate(
                          item.assessed_on
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StudentRecommendations({
  recommendations,
}) {
  return (
    <div>
      <SectionHeader
        title="Personalised Recommendations"
        description="Learning suggestions generated from your competency history."
      />

      {!recommendations.length ? (
        <EmptyState
          icon={GraduationCap}
          title="No recommendations yet"
          description="As more competency evidence is recorded, Darasa-AI will generate personalised learning recommendations for you."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {recommendations.map(
            (
              recommendation,
              index
            ) => (
              <div
                key={
                  recommendation.id ||
                  index
                }
                className="rounded-2xl border border-[#E4E8E2] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF3EE] text-[#0B5D43]">
                    <GraduationCap
                      size={20}
                    />
                  </div>

                  <div>
                    <h3 className="font-bold text-[#17382E]">
                      {recommendation.title ||
                        recommendation.learning_area ||
                        "Learning recommendation"}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[#718078]">
                      {recommendation.description ||
                        recommendation.reason ||
                        recommendation.message ||
                        "Continue practising this learning area and review your latest assessment feedback."}
                    </p>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function StudentFees({
  ledger,
  payments,
}) {
  return (
    <div>
      <SectionHeader
        title="Fees"
        description="Review your recorded school fee activity."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Wallet}
          label="Net balance"
          value={formatCurrency(
            ledger?.balance || 0
          )}
          description="Recorded account balance"
        />

        <StatCard
          icon={CheckCircle2}
          label="Payments"
          value={payments.length}
          description="Recorded transactions"
        />

        <StatCard
          icon={Clock3}
          label="Account"
          value="Active"
          description="Student fee account"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[#E4E8E2] bg-white shadow-sm">
        <div className="border-b border-[#E9ECE7] px-5 py-4">
          <h2 className="font-bold text-[#17382E]">
            Fee activity
          </h2>
        </div>

        {!payments.length ? (
          <div className="px-6 py-12 text-center text-sm text-[#7A8982]">
            No fee payment records have been
            recorded.
          </div>
        ) : (
          <div className="divide-y divide-[#EEF0EC]">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-bold text-[#294A3F]">
                    {payment.transaction_id ||
                      payment.mpesa_receipt_number ||
                      "Fee payment"}
                  </p>

                  <p className="mt-1 text-xs text-[#89958F]">
                    {formatDate(
                      payment.paid_at ||
                        payment.created_at
                    )}
                  </p>

                  {payment.status && (
                    <span className="mt-2 inline-flex rounded-full bg-[#EAF3EE] px-2.5 py-1 text-[10px] font-bold text-[#0B5D43]">
                      {payment.status}
                    </span>
                  )}
                </div>

                <p className="font-bold text-[#0B5D43]">
                  {formatCurrency(
                    payment.amount
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StudentNotifications({
  notifications,
}) {
  return (
    <div>
      <SectionHeader
        title="Notifications"
        description="Stay updated with important school and learning information."
      />

      {!notifications.length ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You are all caught up. New school and learning notifications will appear here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map(
            (notification) => (
              <div
                key={notification.id}
                className="rounded-2xl border border-[#E4E8E2] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3EE] text-[#0B5D43]">
                    <Bell size={18} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-bold text-[#17382E]">
                      {notification.subject ||
                        "School notification"}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-[#718078]">
                      {notification.message ||
                        "You have a new notification."}
                    </p>

                    <p className="mt-2 text-[11px] text-[#98A39E]">
                      {formatDate(
                        notification.sent_at ||
                          notification.created_at
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function StudentPortal({
  section = "overview",
}) {
  const [student, setStudent] =
    useState(null);

  const [competencies, setCompetencies] =
    useState([]);

  const [ledger, setLedger] =
    useState(null);

  const [payments, setPayments] =
    useState([]);

  const [notifications, setNotifications] =
    useState([]);

  const [recommendations, setRecommendations] =
    useState([]);

  const [adaptiveProfile, setAdaptiveProfile] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadWorkspace =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const [
          studentResponse,
          competenciesResponse,
          ledgerResponse,
          paymentsResponse,
          notificationsResponse,
        ] = await Promise.all([
          api.get("/students/me/"),
          api.get("/competencies/"),
          api.get("/fee-ledger/summary/"),
          api.get("/fee-payments/"),
          api.get("/notifications/"),
        ]);

        const studentData =
          studentResponse.data;

        const competencyData =
          getList(
            competenciesResponse.data
          );

        const paymentData =
          getList(
            paymentsResponse.data
          );

        const notificationData =
          getList(
            notificationsResponse.data
          );

        setStudent(studentData);
        setCompetencies(
          competencyData
        );
        setLedger(
          ledgerResponse.data
        );
        setPayments(paymentData);
        setNotifications(
          notificationData
        );

        if (studentData?.id) {
          const [
            adaptiveResponse,
            recommendationsResponse,
          ] = await Promise.allSettled([
            api.get(
              `/students/${studentData.id}/adaptive-profile/`
            ),
            api.get(
              `/students/${studentData.id}/recommendations/`
            ),
          ]);

          if (
            adaptiveResponse.status ===
            "fulfilled"
          ) {
            setAdaptiveProfile(
              adaptiveResponse.value.data
            );
          }

          if (
            recommendationsResponse.status ===
            "fulfilled"
          ) {
            setRecommendations(
              getList(
                recommendationsResponse
                  .value.data
              )
            );
          }
        }
      } catch (requestError) {
        console.error(
          "Student workspace error:",
          requestError
        );

        setError(
          requestError.response?.data
            ?.detail ||
            "We could not load your student workspace. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2
            size={30}
            className="animate-spin text-[#0B5D43]"
          />

          <p className="mt-4 text-sm font-medium text-[#718078]">
            Loading your learning workspace...
          </p>
        </div>
      </div>
    );
  }

  if (error && !student) {
    return (
      <ErrorState
        message={error}
        onRetry={loadWorkspace}
      />
    );
  }

  if (section === "progress") {
    return (
      <StudentProgress
        competencies={competencies}
      />
    );
  }

  if (section === "assessments") {
    return (
      <StudentAssessments
        competencies={competencies}
      />
    );
  }

  if (section === "recommendations") {
    return (
      <StudentRecommendations
        recommendations={
          recommendations
        }
      />
    );
  }

  if (section === "fees") {
    return (
      <StudentFees
        ledger={ledger}
        payments={payments}
      />
    );
  }

  if (section === "notifications") {
    return (
      <StudentNotifications
        notifications={
          notifications
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[#F0D8D5] bg-[#FFF8F7] px-4 py-3 text-sm text-[#7D312C]">
          <span>{error}</span>

          <button
            type="button"
            onClick={loadWorkspace}
            className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#7D312C] shadow-sm"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div />

        <button
          type="button"
          onClick={loadWorkspace}
          className="inline-flex items-center gap-2 rounded-xl border border-[#E1E6E1] bg-white px-3.5 py-2 text-xs font-semibold text-[#52635B] shadow-sm transition hover:bg-[#F7F9F6]"
        >
          <RefreshCw size={15} />
          Refresh workspace
        </button>
      </div>

      <StudentOverview
        student={student}
        competencies={competencies}
        recommendations={
          recommendations
        }
        ledger={ledger}
        payments={payments}
        notifications={
          notifications
        }
        adaptiveProfile={
          adaptiveProfile
        }
      />
    </div>
  );
}

export default StudentPortal;