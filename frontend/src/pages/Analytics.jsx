import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Users,
  WalletCards,
} from "lucide-react";

import api from "../api";

const GRADE_ORDER = [
  "PP1",
  "PP2",
  "G1",
  "G2",
  "G3",
  "G4",
  "G5",
  "G6",
];

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

const MASTERY_LEVELS = {
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

function getList(response) {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  return data?.results || [];
}

function getStudentName(student) {
  if (!student) {
    return "Unknown student";
  }

  if (typeof student === "string") {
    return student;
  }

  const fullName = [student.first_name, student.last_name]
    .filter(Boolean)
    .join(" ");

  return (
    fullName ||
    student.name ||
    student.full_name ||
    student.admission_number ||
    `Student #${student.id ?? "?"}`
  );
}

function getLearningAreaLabel(value) {
  return LEARNING_AREAS[value] || value || "Unknown";
}

function getMasteryLabel(value) {
  return MASTERY_LEVELS[value]?.label || value || "Unknown";
}

function getPercentage(value, total) {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function Analytics() {
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [competencies, setCompetencies] = useState([]);
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      setError("");

      try {
        const [
          studentsResponse,
          classroomsResponse,
          competenciesResponse,
          paymentsResponse,
        ] = await Promise.all([
          api.get("/students/", {
            params: {
              page_size: 100,
            },
          }),
          api.get("/classrooms/", {
            params: {
              page_size: 100,
            },
          }),
          api.get("/competencies/", {
            params: {
              page_size: 100,
            },
          }),
          api.get("/fee-payments/", {
            params: {
              page_size: 100,
            },
          }),
        ]);

        setStudents(getList(studentsResponse));
        setClassrooms(getList(classroomsResponse));
        setCompetencies(getList(competenciesResponse));
        setPayments(getList(paymentsResponse));
      } catch (requestError) {
        console.error("Analytics loading error:", requestError);

        setError(
          requestError?.response?.data?.detail ||
            requestError?.response?.data?.message ||
            "Unable to load analytics data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  const gradeDistribution = useMemo(() => {
    const counts = {};

    GRADE_ORDER.forEach((grade) => {
      counts[grade] = 0;
    });

    students.forEach((student) => {
      if (student.grade) {
        counts[student.grade] = (counts[student.grade] || 0) + 1;
      }
    });

    return GRADE_ORDER.map((grade) => ({
      grade,
      count: counts[grade] || 0,
    }));
  }, [students]);

  const masteryDistribution = useMemo(() => {
    const counts = {
      EE: 0,
      ME: 0,
      AE: 0,
      BE: 0,
    };

    competencies.forEach((item) => {
      if (counts[item.mastery_level] !== undefined) {
        counts[item.mastery_level] += 1;
      }
    });

    return Object.entries(MASTERY_LEVELS).map(([key, value]) => ({
      key,
      label: value.shortLabel,
      description: value.label,
      count: counts[key],
      percentage: getPercentage(counts[key], competencies.length),
    }));
  }, [competencies]);

  const learningAreaDistribution = useMemo(() => {
    const counts = {};

    Object.keys(LEARNING_AREAS).forEach((area) => {
      counts[area] = 0;
    });

    competencies.forEach((item) => {
      if (item.learning_area) {
        counts[item.learning_area] =
          (counts[item.learning_area] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([key, count]) => ({
        key,
        label: getLearningAreaLabel(key),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [competencies]);

  const classroomDistribution = useMemo(() => {
    return classrooms
      .map((classroom) => {
        const count = students.filter(
          (student) =>
            String(student.classroom) === String(classroom.id) ||
            String(student.classroom?.id) === String(classroom.id)
        ).length;

        return {
          id: classroom.id,
          name: classroom.name,
          grade: classroom.grade,
          count,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [classrooms, students]);

  const confirmedPayments = useMemo(() => {
    return payments.filter(
      (payment) =>
        payment.status === "CONFIRMED" ||
        payment.status === "confirmed"
    );
  }, [payments]);

  const totalCollected = useMemo(() => {
    return confirmedPayments.reduce((total, payment) => {
      return total + Number(payment.amount || 0);
    }, 0);
  }, [confirmedPayments]);

  const recentAssessments = useMemo(() => {
    return [...competencies]
      .sort((a, b) => {
        const first = new Date(a.assessed_on || a.created_at || 0);
        const second = new Date(b.assessed_on || b.created_at || 0);

        return second - first;
      })
      .slice(0, 8);
  }, [competencies]);

  const assignedStudents = useMemo(() => {
    return students.filter((student) => {
      if (!student.classroom) {
        return false;
      }

      if (typeof student.classroom === "object") {
        return Boolean(student.classroom.id);
      }

      return Boolean(student.classroom);
    }).length;
  }, [students]);

  const assignmentPercentage = getPercentage(
    assignedStudents,
    students.length
  );

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="font-medium">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <h2 className="font-semibold">
                Unable to load analytics
              </h2>

              <p className="mt-1 text-sm">
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const maxGradeCount = Math.max(
    ...gradeDistribution.map((item) => item.count),
    1
  );

  const maxLearningAreaCount = Math.max(
    ...learningAreaDistribution.map((item) => item.count),
    1
  );

  const maxClassroomCount = Math.max(
    ...classroomDistribution.map((item) => item.count),
    1
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <BarChart3 className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Analytics
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              School performance and CBC learning insights.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Students
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {students.length}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            {assignedStudents} assigned to classrooms
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                CBC Assessments
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {competencies.length}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <BookOpenCheck className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Continuous competency records
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Classrooms
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {classrooms.length}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Active learning groups
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Fees Collected
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                KSh {totalCollected.toLocaleString()}
              </p>
            </div>

            <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
              <WalletCards className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            {confirmedPayments.length} confirmed payments
          </p>
        </div>
      </div>

      {/* Grade Distribution + Mastery */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Students by grade */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Students by Grade
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Student population across CBC grades.
              </p>
            </div>

            <Activity className="h-5 w-5 text-emerald-600" />
          </div>

          <div className="mt-6 space-y-4">
            {gradeDistribution.map((item) => {
              const width =
                item.count === 0
                  ? 0
                  : Math.max(
                      (item.count / maxGradeCount) * 100,
                      4
                    );

              return (
                <div key={item.grade}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {item.grade}
                    </span>

                    <span className="font-semibold text-slate-900">
                      {item.count}
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Mastery distribution */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="font-semibold text-slate-900">
              CBC Mastery Distribution
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current competency achievement levels.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {masteryDistribution.map((item) => (
              <div
                key={item.key}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-900">
                    {item.label}
                  </span>

                  <span className="text-sm font-semibold text-emerald-700">
                    {item.percentage}%
                  </span>
                </div>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {item.description}
                </p>

                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {item.count}
                </p>

                <p className="text-xs text-slate-500">
                  assessments
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Learning Areas */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="font-semibold text-slate-900">
            Assessments by Learning Area
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Assessment activity across CBC learning areas.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {learningAreaDistribution.map((item) => {
            const width =
              item.count === 0
                ? 0
                : Math.max(
                    (item.count / maxLearningAreaCount) * 100,
                    4
                  );

            return (
              <div key={item.key}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    {item.label}
                  </span>

                  <span className="text-sm font-semibold text-slate-900">
                    {item.count}
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Classroom Distribution */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              Classroom Distribution
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Students assigned to each classroom.
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
            <GraduationCap className="h-5 w-5" />
          </div>
        </div>

        {classroomDistribution.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">
            No classrooms available.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classroomDistribution.map((classroom) => {
              const width =
                classroom.count === 0
                  ? 0
                  : Math.max(
                      (classroom.count / maxClassroomCount) * 100,
                      4
                    );

              return (
                <div
                  key={classroom.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {classroom.name}
                      </p>

                      {classroom.grade && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {classroom.grade}
                        </p>
                      )}
                    </div>

                    <span className="shrink-0 text-lg font-bold text-emerald-700">
                      {classroom.count}
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Bottom section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Classroom assignment */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Classroom Assignment
              </h2>

              <p className="text-sm text-slate-500">
                Student placement coverage.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-slate-900">
                {assignmentPercentage}%
              </p>

              <p className="mt-1 text-sm text-slate-500">
                students assigned
              </p>
            </div>

            <p className="text-sm font-medium text-slate-600">
              {assignedStudents} / {students.length}
            </p>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{
                width: `${assignmentPercentage}%`,
              }}
            />
          </div>
        </section>

        {/* Recent assessments */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="font-semibold text-slate-900">
              Recent Assessments
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Latest CBC competency records.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {recentAssessments.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                No assessments recorded yet.
              </p>
            ) : (
              recentAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {getStudentName(
                        typeof assessment.student === "object"
                          ? assessment.student
                          : students.find(
                              (student) =>
                                String(student.id) ===
                                String(assessment.student)
                            )
                      )}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {getLearningAreaLabel(
                        assessment.learning_area
                      )}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {assessment.mastery_level || "—"}
                    </span>

                    {assessment.assessed_on && (
                      <p className="mt-1 text-[11px] text-slate-400">
                        {assessment.assessed_on}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Analytics;