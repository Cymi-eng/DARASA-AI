
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Bot,
  CreditCard,
  GraduationCap,
  Loader2,
  School,
  Send,
  Sparkles,
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

function generateAdminAIResponse({ message, dashboard }) {
  const question = message.toLowerCase();

  const students = Number(dashboard?.students ?? 0);
  const teachers = Number(dashboard?.teachers ?? 0);
  const classrooms = Number(dashboard?.classrooms ?? 0);
  const assessments = Number(dashboard?.assessments ?? 0);
  const payments = Number(dashboard?.payments ?? 0);

  if (
    question.includes("student") ||
    question.includes("learner") ||
    question.includes("enrollment")
  ) {
    return {
      title: "Learner overview",
      body:
        `The school currently has ${students.toLocaleString()} recorded learners. ` +
        `Use the Students area to review learner records, admissions, and school enrolment information.`,
    };
  }

  if (
    question.includes("teacher") ||
    question.includes("staff")
  ) {
    return {
      title: "Teaching staff overview",
      body:
        `There are ${teachers.toLocaleString()} teaching staff records currently available. ` +
        `You can review teacher assignments and classroom coverage from the relevant administration areas.`,
    };
  }

  if (
    question.includes("class") ||
    question.includes("classroom")
  ) {
    return {
      title: "Classroom overview",
      body:
        `The dashboard currently records ${classrooms.toLocaleString()} active classroom groups. ` +
        `Review the Classrooms section when you need to inspect grades, groups, or classroom organisation.`,
    };
  }

  if (
    question.includes("assessment") ||
    question.includes("cbc") ||
    question.includes("competenc")
  ) {
    return {
      title: "CBC assessment overview",
      body:
        `There are ${assessments.toLocaleString()} competency assessment records currently available. ` +
        `These records provide the foundation for monitoring continuous learner progress and identifying areas that may require instructional attention.`,
    };
  }

  if (
    question.includes("finance") ||
    question.includes("payment") ||
    question.includes("fee")
  ) {
    return {
      title: "Finance overview",
      body:
        `The dashboard currently contains ${payments.toLocaleString()} recorded fee payment transactions. ` +
        `Use the Finance area to review payment records and the school's fee ledger.`,
    };
  }

  if (
    question.includes("overview") ||
    question.includes("summary") ||
    question.includes("status")
  ) {
    return {
      title: "School operations summary",
      body:
        `Darasa-AI currently records ${students.toLocaleString()} learners, ` +
        `${teachers.toLocaleString()} teachers, ${classrooms.toLocaleString()} classrooms, ` +
        `${assessments.toLocaleString()} CBC assessments, and ` +
        `${payments.toLocaleString()} fee payment transactions.`,
    };
  }

  if (
    question.includes("priority") ||
    question.includes("focus") ||
    question.includes("attention") ||
    question.includes("next")
  ) {
    const priorities = [
      {
        value: assessments,
        text:
          "review CBC assessment activity and learner competency progress",
      },
      {
        value: students,
        text: "review learner records and enrolment information",
      },
      {
        value: teachers,
        text: "review teaching staff and classroom coverage",
      },
      {
        value: payments,
        text: "review school fee payment records",
      },
    ].sort((a, b) => b.value - a.value);

    return {
      title: "Suggested administrative review",
      body:
        `Based on the data currently available, you may want to review ${priorities[0].text}. ` +
        `The dashboard shows ${priorities[0].value.toLocaleString()} records in that area.`,
    };
  }

  return {
    title: "Admin AI insight",
    body:
      `I can help you interpret the current school dashboard. ` +
      `The system currently records ${students.toLocaleString()} learners, ` +
      `${teachers.toLocaleString()} teachers, ${classrooms.toLocaleString()} classrooms, ` +
      `${assessments.toLocaleString()} CBC assessments, and ` +
      `${payments.toLocaleString()} fee payments. ` +
      `Try asking about learners, teachers, classrooms, CBC assessments, finance, or the school's overall status.`,
  };
}

function AdminAIAssistant({ dashboard }) {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState(null);

  const suggestedQuestions = useMemo(
    () => [
      "Give me a school overview",
      "How many learners are recorded?",
      "How is our CBC assessment activity?",
      "What should I focus on next?",
    ],
    []
  );

  function askAI(question) {
    const cleanQuestion = question.trim();

    if (!cleanQuestion) return;

    const result = generateAdminAIResponse({
      message: cleanQuestion,
      dashboard,
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
    <section className="overflow-hidden rounded-2xl border border-[#DCE8E1] bg-white shadow-sm">
      <div className="border-b border-[#E6ECE8] bg-gradient-to-r from-[#F0F8F4] to-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B5D43] text-white shadow-sm">
              <Bot size={21} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#17382E]">
                  Admin AI Assistant
                </h2>

                <span className="rounded-full bg-[#E7F5EC] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#176B43]">
                  Live Insights
                </span>
              </div>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#68756F]">
                Ask questions about your school's learners, teachers,
                classrooms, CBC activity, and financial records.
              </p>
            </div>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#52635D] shadow-sm ring-1 ring-[#E6ECE8]">
            <Sparkles size={14} className="text-[#0B5D43]" />
            School intelligence
          </div>
        </div>
      </div>

      <div className="p-6">
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
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ask about your school data..."
            className="w-full flex-1 rounded-xl border border-[#DDE4DF] bg-[#FBFCF9] px-4 py-3 text-sm text-[#17382E] outline-none transition placeholder:text-[#9AA59F] focus:border-[#0B5D43] focus:ring-2 focus:ring-[#0B5D43]/10"
          />

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

        <p className="mt-4 text-[11px] text-[#8A9691]">
          <span className="font-semibold text-[#52635D]">
            Data source:
          </span>{" "}
          Current dashboard records returned by Darasa-AI.
        </p>
      </div>
    </section>
  );
}

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

          {/* Admin AI Assistant */}
          <AdminAIAssistant dashboard={dashboard} />

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

