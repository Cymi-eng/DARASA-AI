import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Bot,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Send,
  Sparkles,
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

function getInitials(student) {
  const name = getStudentName(student);

  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function generateTeacherAIResponse({
  message,
  students,
  classrooms,
  competencies,
  learnersNeedingSupport,
  masterySummary,
}) {
  const question = message.toLowerCase();

  if (!competencies.length) {
    return {
      title: "Not enough assessment data yet",
      body:
        "I do not have enough competency assessment records to identify learner trends yet. Once assessments are recorded, I can help you identify learners needing support, mastery patterns, and intervention priorities.",
    };
  }

  const totalAssessments = competencies.length;

  const supportAssessments =
    (masterySummary.AE || 0) + (masterySummary.BE || 0);

  const supportPercentage = Math.round(
    (supportAssessments / totalAssessments) * 100
  );

  const learningAreas = {};

  competencies.forEach((item) => {
    const area =
      item.learning_area ||
      item.strand ||
      item.sub_strand ||
      "Unspecified learning area";

    if (!learningAreas[area]) {
      learningAreas[area] = {
        total: 0,
        support: 0,
      };
    }

    learningAreas[area].total += 1;

    if (
      item.mastery_level === "AE" ||
      item.mastery_level === "BE"
    ) {
      learningAreas[area].support += 1;
    }
  });

  const weakestAreas = Object.entries(learningAreas)
    .map(([name, data]) => ({
      name,
      ...data,
      percentage:
        data.total > 0
          ? Math.round((data.support / data.total) * 100)
          : 0,
    }))
    .sort((a, b) => {
      if (b.percentage !== a.percentage) {
        return b.percentage - a.percentage;
      }

      return b.support - a.support;
    })
    .slice(0, 3);

  if (
    question.includes("support") ||
    question.includes("struggling") ||
    question.includes("weak") ||
    question.includes("intervention") ||
    question.includes("help")
  ) {
    if (!learnersNeedingSupport.length) {
      return {
        title: "No immediate support flags",
        body:
          "The current competency records do not show learners with AE or BE assessments. Continue monitoring new assessments and look for changes in mastery over time.",
      };
    }

    const names = learnersNeedingSupport
      .slice(0, 4)
      .map(({ student }) => getStudentName(student))
      .join(", ");

    return {
      title: "Learners requiring attention",
      body:
        `${names} currently have the highest number of AE/BE assessment flags. ` +
        `There are ${learnersNeedingSupport.length} learners appearing in the current support list. ` +
        `Review their recent assessments and provide targeted practice or additional guided activities.`,
    };
  }

  if (
    question.includes("mastery") ||
    question.includes("performance") ||
    question.includes("perform") ||
    question.includes("progress")
  ) {
    const strongestLevel =
      Object.entries(masterySummary)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    return {
      title: "Current competency picture",
      body:
        `There are ${students.length} learners, ${classrooms.length} classrooms, and ` +
        `${totalAssessments} recorded competency assessments. ` +
        `${supportAssessments} assessments (${supportPercentage}%) are currently at AE or BE. ` +
        `The most frequently recorded mastery level is ${strongestLevel} — ${getMasteryLabel(
          strongestLevel
        )}.`,
    };
  }

  if (
    question.includes("learning area") ||
    question.includes("subject") ||
    question.includes("area")
  ) {
    if (!weakestAreas.length) {
      return {
        title: "Learning area analysis",
        body:
          "There is not enough learning-area information in the current competency records to produce a useful comparison.",
      };
    }

    const areas = weakestAreas
      .map(
        (area) =>
          `${area.name} (${area.percentage}% AE/BE)`
      )
      .join(", ");

    return {
      title: "Learning areas to monitor",
      body:
        `Based on the available competency records, the learning areas with the highest proportion of AE/BE assessments are: ${areas}. ` +
        `These areas may benefit from targeted revision, guided practice, or differentiated activities.`,
    };
  }

  if (
    question.includes("activity") ||
    question.includes("lesson") ||
    question.includes("teach") ||
    question.includes("today")
  ) {
    const focusArea =
      weakestAreas[0]?.name || "the weakest recorded competency areas";

    return {
      title: "Suggested teaching focus",
      body:
        `Consider using the next learning session to focus on ${focusArea}. ` +
        `Start with a short diagnostic activity, group learners according to their current mastery, ` +
        `provide guided practice for AE/BE learners, and finish with a short formative assessment.`,
    };
  }

  return {
    title: "Teacher AI insight",
    body:
      `I can help you interpret the current classroom data. You have ${students.length} learners, ` +
      `${classrooms.length} classrooms and ${totalAssessments} competency records. ` +
      `${supportAssessments} assessment records are currently AE or BE. ` +
      `Try asking me which learners need support, which learning areas need attention, or what teaching activity you could use next.`,
  };
}

function TeacherAIAssistant({
  students,
  classrooms,
  competencies,
  learnersNeedingSupport,
  masterySummary,
}) {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState(null);

  const suggestedQuestions = [
    "Which learners need support?",
    "Which learning areas need attention?",
    "What should I focus on in my next lesson?",
  ];

  function askAI(question) {
    const cleanQuestion = question.trim();

    if (!cleanQuestion) return;

    const result = generateTeacherAIResponse({
      message: cleanQuestion,
      students,
      classrooms,
      competencies,
      learnersNeedingSupport,
      masterySummary,
    });

    setResponse({
      question: cleanQuestion,
      ...result,
    });

    setMessage("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    askAI(message);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#DCE8E1] bg-white shadow-sm">
      <div className="border-b border-[#E6ECE8] bg-gradient-to-r from-[#F0F8F4] to-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B5D43] text-white shadow-sm">
              <Bot size={21} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#17382E]">
                  Teacher AI Assistant
                </h2>

                <span className="rounded-full bg-[#E7F5EC] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#176B43]">
                  Live Insights
                </span>
              </div>

              <p className="mt-1 max-w-2xl text-xs leading-5 text-[#68756F]">
                Use your current learner and competency data to identify
                support needs, learning-area priorities, and teaching
                opportunities.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#52635D] shadow-sm ring-1 ring-[#E6ECE8]">
            <Sparkles size={14} className="text-[#0B5D43]" />
            Data-informed teaching
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => askAI(question)}
              className="rounded-full border border-[#DCE8E1] bg-[#FBFCF9] px-3 py-2 text-xs font-semibold text-[#405650] transition hover:border-[#0B5D43] hover:bg-[#EAF3EE] hover:text-[#0B5D43]"
            >
              {question}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-4 flex flex-col gap-2 sm:flex-row"
        >
          <div className="relative flex-1">
            <input
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              placeholder="Ask about your learners, mastery, or teaching focus..."
              className="w-full rounded-xl border border-[#DDE4DF] bg-[#FBFCF9] px-4 py-3 pr-4 text-sm text-[#17382E] outline-none transition placeholder:text-[#9AA59F] focus:border-[#0B5D43] focus:ring-2 focus:ring-[#0B5D43]/10"
            />
          </div>

          <button
            type="submit"
            disabled={!message.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B5D43] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#084B36] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={16} />
            Ask AI
          </button>
        </form>

        {response && (
          <div className="mt-5 rounded-2xl border border-[#DCE8E1] bg-[#F8FBF9] p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF3EE] text-[#0B5D43]">
                <Bot size={17} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#8A9691]">
                  Your question
                </p>

                <p className="mt-1 text-sm font-semibold text-[#405650]">
                  {response.question}
                </p>

                <div className="mt-4">
                  <p className="text-sm font-bold text-[#17382E]">
                    {response.title}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#68756F]">
                    {response.body}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 text-[11px] text-[#8A9691]">
          <CheckCircle2 size={13} className="text-[#2F8F61]" />
          Insights are based on the competency and learner data currently
          available in this teacher workspace.
        </div>
      </div>
    </div>
  );
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

        {/* Teacher AI Assistant */}
        <TeacherAIAssistant
          students={students}
          classrooms={classrooms}
          competencies={competencies}
          learnersNeedingSupport={learnersNeedingSupport}
          masterySummary={masterySummary}
        />

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
                          {getInitials(student)}
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