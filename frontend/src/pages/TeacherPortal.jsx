import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Users,
  TrendingUp,
} from "lucide-react";

import api from "../api";

function getStudentName(student) {
  if (!student) return "Unknown learner";

  const fullName = [
    student.first_name,
    student.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return fullName || student.name || "Unknown learner";
}

function getClassroomName(classroom) {
  if (!classroom) return "Unassigned";

  if (typeof classroom === "object") {
    return classroom.name || "Unassigned";
  }

  return String(classroom);
}

function getMasteryLabel(level) {
  const labels = {
    EE: "Exceeding Expectations",
    ME: "Meeting Expectations",
    AE: "Approaching Expectations",
    BE: "Below Expectations",
  };

  return labels[level] || "Not assessed";
}

function getMasteryClass(level) {
  const classes = {
    EE: "bg-[#E7F5EC] text-[#176B43]",
    ME: "bg-[#EEF6E8] text-[#4B6F24]",
    AE: "bg-[#FFF5D8] text-[#8B6B14]",
    BE: "bg-[#FDECEC] text-[#A63D3D]",
  };

  return classes[level] || "bg-[#F2F4F1] text-[#68756F]";
}

export default function TeacherPortal() {
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [competencies, setCompetencies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadTeacherWorkspace() {
      setLoading(true);
      setError("");

      try {
        const [
          studentsResponse,
          classroomsResponse,
          competenciesResponse,
        ] = await Promise.all([
          api.get("/students/"),
          api.get("/classrooms/"),
          api.get("/competencies/"),
        ]);

        if (!mounted) return;

        setStudents(
          Array.isArray(studentsResponse.data)
            ? studentsResponse.data
            : studentsResponse.data.results || []
        );

        setClassrooms(
          Array.isArray(classroomsResponse.data)
            ? classroomsResponse.data
            : classroomsResponse.data.results || []
        );

        setCompetencies(
          Array.isArray(competenciesResponse.data)
            ? competenciesResponse.data
            : competenciesResponse.data.results || []
        );
      } catch (err) {
        if (!mounted) return;

        setError(
          err?.response?.data?.detail ||
            "Unable to load the teacher workspace."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadTeacherWorkspace();

    return () => {
      mounted = false;
    };
  }, []);

  const masterySummary = useMemo(() => {
    const summary = {
      EE: 0,
      ME: 0,
      AE: 0,
      BE: 0,
    };

    competencies.forEach((item) => {
      if (summary[item.mastery_level] !== undefined) {
        summary[item.mastery_level] += 1;
      }
    });

    return summary;
  }, [competencies]);

  const learnersNeedingSupport = useMemo(() => {
    const studentMap = new Map(
      students.map((student) => [
        String(student.id),
        student,
      ])
    );

    const grouped = new Map();

    competencies
      .filter(
        (item) =>
          item.mastery_level === "BE" ||
          item.mastery_level === "AE"
      )
      .forEach((item) => {
        const student = studentMap.get(
          String(item.student)
        );

        if (!student) return;

        const key = String(student.id);

        if (!grouped.has(key)) {
          grouped.set(key, {
            student,
            count: 0,
            latest: item,
          });
        }

        const current = grouped.get(key);

        current.count += 1;

        if (
          item.assessed_on &&
          (!current.latest.assessed_on ||
            item.assessed_on >
              current.latest.assessed_on)
        ) {
          current.latest = item;
        }
      });

    return Array.from(grouped.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [students, competencies]);

  const recentAssessments = useMemo(() => {
    const studentMap = new Map(
      students.map((student) => [
        String(student.id),
        student,
      ])
    );

    return [...competencies]
      .sort((a, b) => {
        const first = a.assessed_on || "";
        const second = b.assessed_on || "";

        return second.localeCompare(first);
      })
      .slice(0, 8)
      .map((item) => ({
        ...item,
        studentObject: studentMap.get(
          String(item.student)
        ),
      }));
  }, [students, competencies]);

  const classroomCount = classrooms.length;

  if (loading) {
    return (
      <section className="min-h-full bg-[#F7F8F4] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex items-center gap-3 text-sm font-semibold text-[#52635D]">
            <Loader2
              size={20}
              className="animate-spin text-[#0B5D43]"
            />
            Loading teacher workspace...
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-full bg-[#F7F8F4] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-[#F0D0D0] bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FDECEC] text-[#A63D3D]">
                <AlertTriangle size={19} />
              </div>

              <div>
                <h2 className="font-bold text-[#17382E]">
                  Teacher workspace unavailable
                </h2>

                <p className="mt-1 text-sm text-[#68756F]">
                  {error}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-full bg-[#F7F8F4] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#EAF3EE] px-3 py-1.5 text-xs font-bold text-[#0B5D43]">
              <GraduationCap size={15} />
              TEACHER WORKSPACE
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#17382E] sm:text-3xl">
              Teaching & Learning
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#68756F]">
              A focused view of your learners, CBC assessments,
              competency mastery, and learners who may need
              additional support.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[#E4E5DE] bg-white px-4 py-3 shadow-sm">
            <BookOpen
              size={18}
              className="text-[#0B5D43]"
            />

            <span className="text-sm font-semibold text-[#405650]">
              CBC Learning Environment
            </span>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#E4E5DE] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3EE] text-[#0B5D43]">
                <Users size={21} />
              </div>

              <span className="text-2xl font-bold text-[#17382E]">
                {students.length}
              </span>
            </div>

            <p className="mt-5 text-sm font-semibold text-[#405650]">
              Learners
            </p>

            <p className="mt-1 text-xs text-[#8A9691]">
              Learners available in your school
            </p>
          </div>

          <div className="rounded-2xl border border-[#E4E5DE] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF7DF] text-[#8B6B14]">
                <BookOpen size={21} />
              </div>

              <span className="text-2xl font-bold text-[#17382E]">
                {classroomCount}
              </span>
            </div>

            <p className="mt-5 text-sm font-semibold text-[#405650]">
              Classrooms
            </p>

            <p className="mt-1 text-xs text-[#8A9691]">
              Active classroom groups
            </p>
          </div>

          <div className="rounded-2xl border border-[#E4E5DE] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3EE] text-[#0B5D43]">
                <CheckCircle2 size={21} />
              </div>

              <span className="text-2xl font-bold text-[#17382E]">
                {competencies.length}
              </span>
            </div>

            <p className="mt-5 text-sm font-semibold text-[#405650]">
              Assessments
            </p>

            <p className="mt-1 text-xs text-[#8A9691]">
              CBC competency records
            </p>
          </div>

          <div className="rounded-2xl border border-[#E4E5DE] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FDECEC] text-[#A63D3D]">
                <AlertTriangle size={21} />
              </div>

              <span className="text-2xl font-bold text-[#17382E]">
                {learnersNeedingSupport.length}
              </span>
            </div>

            <p className="mt-5 text-sm font-semibold text-[#405650]">
              Learners Needing Support
            </p>

            <p className="mt-1 text-xs text-[#8A9691]">
              Based on AE and BE assessments
            </p>
          </div>
        </div>

        {/* Mastery overview */}
        <div className="rounded-2xl border border-[#E4E5DE] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-[#17382E]">
                Competency Mastery Overview
              </h2>

              <p className="mt-1 text-xs text-[#8A9691]">
                Current distribution of recorded CBC mastery levels.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#68756F]">
              <TrendingUp size={15} />
              Live assessment data
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(masterySummary).map(
              ([level, count]) => (
                <div
                  key={level}
                  className="rounded-xl border border-[#ECEDE8] bg-[#FBFCF9] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={[
                        "rounded-lg px-2.5 py-1 text-[11px] font-bold",
                        getMasteryClass(level),
                      ].join(" ")}
                    >
                      {level}
                    </span>

                    <span className="text-xl font-bold text-[#17382E]">
                      {count}
                    </span>
                  </div>

                  <p className="mt-3 text-xs font-medium leading-5 text-[#68756F]">
                    {getMasteryLabel(level)}
                  </p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Main workspace */}
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          {/* Recent assessments */}
          <div className="rounded-2xl border border-[#E4E5DE] bg-white shadow-sm">
            <div className="border-b border-[#ECEDE8] p-5">
              <h2 className="text-base font-bold text-[#17382E]">
                Recent Assessments
              </h2>

              <p className="mt-1 text-xs text-[#8A9691]">
                Latest competency activity across your learning environment.
              </p>
            </div>

            {recentAssessments.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#8A9691]">
                No competency assessments have been recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-[#ECEDE8]">
                {recentAssessments.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#17382E]">
                        {getStudentName(item.studentObject)}
                      </p>

                      <p className="mt-1 text-xs text-[#8A9691]">
                        {item.learning_area ||
                          "Learning area"}{" "}
                        •{" "}
                        {item.assessed_on ||
                          "Date not recorded"}
                      </p>
                    </div>

                    <span
                      className={[
                        "w-fit rounded-lg px-2.5 py-1.5 text-[11px] font-bold",
                        getMasteryClass(
                          item.mastery_level
                        ),
                      ].join(" ")}
                    >
                      {item.mastery_level || "N/A"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Learners needing support */}
          <div className="rounded-2xl border border-[#E4E5DE] bg-white shadow-sm">
            <div className="border-b border-[#ECEDE8] p-5">
              <h2 className="text-base font-bold text-[#17382E]">
                Learners Needing Support
              </h2>

              <p className="mt-1 text-xs text-[#8A9691]">
                Learners with approaching or below-expectation assessments.
              </p>
            </div>

            {learnersNeedingSupport.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2
                  size={28}
                  className="mx-auto text-[#2F8F61]"
                />

                <p className="mt-3 text-sm font-semibold text-[#405650]">
                  No immediate support flags
                </p>

                <p className="mt-1 text-xs text-[#8A9691]">
                  Continue monitoring learner progress.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#ECEDE8]">
                {learnersNeedingSupport.map(
                  ({ student, count, latest }) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between gap-4 p-5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FDECEC] text-xs font-bold text-[#A63D3D]">
                          {getStudentName(student)
                            .split(" ")
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#17382E]">
                            {getStudentName(student)}
                          </p>

                          <p className="mt-1 text-xs text-[#8A9691]">
                            {count} support flag
                            {count === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={[
                          "shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-bold",
                          getMasteryClass(
                            latest.mastery_level
                          ),
                        ].join(" ")}
                      >
                        {latest.mastery_level}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Classroom strip */}
        <div className="rounded-2xl border border-[#E4E5DE] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#17382E]">
                Classroom Environment
              </h2>

              <p className="mt-1 text-xs text-[#8A9691]">
                Your school's active learning groups.
              </p>
            </div>

            <span className="rounded-lg bg-[#EAF3EE] px-2.5 py-1.5 text-xs font-bold text-[#0B5D43]">
              {classrooms.length} active
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classrooms.slice(0, 6).map((classroom) => (
              <div
                key={classroom.id}
                className="rounded-xl border border-[#ECEDE8] bg-[#FBFCF9] p-4"
              >
                <p className="text-sm font-bold text-[#17382E]">
                  {getClassroomName(classroom)}
                </p>

                <p className="mt-1 text-xs text-[#8A9691]">
                  {classroom.grade || "Grade not specified"}
                </p>
              </div>
            ))}

            {classrooms.length === 0 && (
              <p className="text-sm text-[#8A9691]">
                No classrooms available.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}