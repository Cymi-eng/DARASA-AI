import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardPlus,
  GraduationCap,
  Loader2,
  Search,
  X,
} from "lucide-react";

import api from "../api";

const LEARNING_AREAS = [
  { value: "MATH", label: "Mathematics" },
  { value: "ENG", label: "English" },
  { value: "KIS", label: "Kiswahili" },
  { value: "SCI", label: "Science & Technology" },
  { value: "SST", label: "Social Studies" },
  { value: "CRE", label: "Christian Religious Education" },
  { value: "CA", label: "Creative Arts" },
  { value: "AGR", label: "Agriculture" },
];

const MASTERY_LEVELS = [
  {
    value: "EE",
    label: "Exceeds Expectation",
    shortLabel: "Exceeds",
    description: "Strong mastery",
  },
  {
    value: "ME",
    label: "Meets Expectation",
    shortLabel: "Meets",
    description: "Expected mastery",
  },
  {
    value: "AE",
    label: "Approaches Expectation",
    shortLabel: "Approaches",
    description: "Needs reinforcement",
  },
  {
    value: "BE",
    label: "Below Expectation",
    shortLabel: "Below",
    description: "Needs targeted support",
  },
];

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getStudentName(student) {
  if (!student) {
    return "Unknown student";
  }

  if (typeof student === "string") {
    return student;
  }

  const fullName = [
    student.first_name,
    student.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    fullName ||
    student.name ||
    student.full_name ||
    student.admission_number ||
    `Student #${student.id}`
  );
}

function getLearningAreaLabel(value) {
  return (
    LEARNING_AREAS.find(
      (item) => item.value === value
    )?.label ||
    value ||
    "Unknown"
  );
}

function getMasteryDetails(value) {
  return (
    MASTERY_LEVELS.find(
      (item) => item.value === value
    ) || {
      value,
      label: value,
      shortLabel: value,
      description: "",
    }
  );
}

function extractErrorMessage(error, fallback) {
  const data = error?.response?.data;

  if (!data) return fallback;

  if (typeof data === "string") return data;

  if (data.detail) return data.detail;

  const messages = Object.entries(data).flatMap(
    ([field, value]) => {
      if (Array.isArray(value)) {
        return value.map(
          (message) => `${field}: ${message}`
        );
      }

      if (typeof value === "string") {
        return [`${field}: ${value}`];
      }

      return [];
    }
  );

  return messages.length > 0
    ? messages.join(" ")
    : fallback;
}

function Competencies() {
  const [competencies, setCompetencies] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] =
    useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const [search, setSearch] = useState("");
  const [learningAreaFilter, setLearningAreaFilter] =
    useState("");
  const [masteryFilter, setMasteryFilter] =
    useState("");

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    student: "",
    learning_area: "",
    strand: "",
    sub_strand: "",
    mastery_level: "",
    assessed_on: getToday(),
    teacher_notes: "",
  });

  async function loadCompetencies() {
    setLoading(true);
    setError("");

    try {
      const params = {};

      if (learningAreaFilter) {
        params.learning_area = learningAreaFilter;
      }

      if (masteryFilter) {
        params.mastery_level = masteryFilter;
      }

      const response = await api.get("/competencies/", {
        params,
      });

      const data = response.data;

      setCompetencies(
        Array.isArray(data)
          ? data
          : data.results || []
      );
    } catch (requestError) {
      setError(
        extractErrorMessage(
          requestError,
          "Unable to load CBC assessment records."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadStudents() {
    setStudentsLoading(true);

    try {
      const response = await api.get("/students/", {
        params: {
          page_size: 1000,
        },
      });

      const data = response.data;

      setStudents(
        Array.isArray(data)
          ? data
          : data.results || []
      );
    } catch (requestError) {
      setFormError(
        extractErrorMessage(
          requestError,
          "Unable to load students."
        )
      );
    } finally {
      setStudentsLoading(false);
    }
  }

  useEffect(() => {
    loadCompetencies();
  }, [learningAreaFilter, masteryFilter]);

  useEffect(() => {
    loadStudents();
  }, []);

  /*
   * The competency API returns:
   *
   *     student: 61
   *
   * rather than:
   *
   *     student: {
   *       id: 61,
   *       first_name: "...",
   *       last_name: "..."
   *     }
   *
   * Build a lookup map from the students we already loaded.
   */
  const studentsById = useMemo(() => {
    return students.reduce((map, student) => {
      map[String(student.id)] = student;
      return map;
    }, {});
  }, [students]);

  function getAssessmentStudent(item) {
    if (!item?.student) {
      return null;
    }

    if (typeof item.student === "object") {
      return item.student;
    }

    return studentsById[String(item.student)] || null;
  }

  function getAssessmentStudentName(item) {
    const student = getAssessmentStudent(item);

    if (student) {
      return getStudentName(student);
    }

    if (item?.student) {
      return `Student #${item.student}`;
    }

    return "Unknown student";
  }

  function getAssessmentAdmissionNumber(item) {
    const student = getAssessmentStudent(item);

    return student?.admission_number || "";
  }

  const filteredCompetencies = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return competencies;
    }

    return competencies.filter((item) => {
      const studentName =
        getAssessmentStudentName(item);

      const learningArea = getLearningAreaLabel(
        item.learning_area
      );

      return [
        studentName,
        item.strand,
        item.sub_strand,
        learningArea,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query)
        );
    });
  }, [competencies, search, studentsById]);

  const masteryCounts = useMemo(
    () => ({
      EE: competencies.filter(
        (item) => item.mastery_level === "EE"
      ).length,
      ME: competencies.filter(
        (item) => item.mastery_level === "ME"
      ).length,
      AE: competencies.filter(
        (item) => item.mastery_level === "AE"
      ).length,
      BE: competencies.filter(
        (item) => item.mastery_level === "BE"
      ).length,
    }),
    [competencies]
  );

  function openForm() {
    setFormError("");
    setSuccessMessage("");

    setForm({
      student: "",
      learning_area: "",
      strand: "",
      sub_strand: "",
      mastery_level: "",
      assessed_on: getToday(),
      teacher_notes: "",
    });

    setShowForm(true);
  }

  function closeForm() {
    if (submitting) return;

    setShowForm(false);
    setFormError("");
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    if (
      !form.student ||
      !form.learning_area ||
      !form.strand.trim() ||
      !form.sub_strand.trim() ||
      !form.mastery_level ||
      !form.assessed_on
    ) {
      setFormError(
        "Please complete all required assessment fields."
      );
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/competencies/", {
        student: Number(form.student),
        learning_area: form.learning_area,
        strand: form.strand.trim(),
        sub_strand: form.sub_strand.trim(),
        mastery_level: form.mastery_level,
        assessed_on: form.assessed_on,
        teacher_notes: form.teacher_notes.trim(),
      });

      setShowForm(false);

      setSuccessMessage(
        "CBC assessment recorded successfully."
      );

      await loadCompetencies();
    } catch (requestError) {
      setFormError(
        extractErrorMessage(
          requestError,
          "Unable to save the CBC assessment."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-7">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B5D43]">
            Competency Based Curriculum
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#12382D] sm:text-4xl">
            CBC Assessment
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71807A] sm:text-base">
            Track learner competency development, mastery
            levels and assessment evidence across learning
            areas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-xl border border-[#DCE8E1] bg-[#F4F9F6] px-5 py-3 sm:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7B8B84]">
              Assessment Records
            </p>

            <div className="mt-1 flex items-center gap-2">
              <BookOpenCheck
                size={18}
                className="text-[#0B5D43]"
              />

              <span className="text-lg font-bold text-[#0B5D43]">
                {competencies.length}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={openForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B5D43] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#084936] focus:outline-none focus:ring-4 focus:ring-[#0B5D43]/15"
          >
            <ClipboardPlus size={19} />
            Add Assessment
          </button>
        </div>
      </div>

      {/* SUCCESS MESSAGE */}
      {successMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-[#BBDCCB] bg-[#EDF8F1] px-4 py-3 text-sm text-[#17633F]">
          <CheckCircle2
            size={19}
            className="mt-0.5 shrink-0"
          />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-[#F3C5C1] bg-[#FFF3F1] px-4 py-3 text-sm text-[#B42318]">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-semibold">
              CBC assessment records could not be loaded
            </p>

            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* MASTERY CARDS */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {MASTERY_LEVELS.map((level, index) => {
          const icons = [
            BarChart3,
            BookOpenCheck,
            BarChart3,
            GraduationCap,
          ];

          const Icon = icons[index];

          const backgrounds = [
            "bg-[#EAF3EE]",
            "bg-[#EEF5E8]",
            "bg-[#FFF7E4]",
            "bg-[#FFF0EE]",
          ];

          const iconColors = [
            "text-[#0B5D43]",
            "text-[#668B2E]",
            "text-[#B58A00]",
            "text-[#B33A31]",
          ];

          return (
            <div
              key={level.value}
              className="rounded-2xl border border-[#E4E5DE] bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${backgrounds[index]}`}
                >
                  <Icon
                    size={22}
                    className={iconColors[index]}
                  />
                </div>

                <span className="text-2xl font-bold text-[#12382D]">
                  {masteryCounts[level.value]}
                </span>
              </div>

              <p className="mt-5 text-sm font-semibold text-[#17382E]">
                {level.shortLabel}
              </p>

              <p className="mt-1 text-xs text-[#8A9691]">
                {level.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* FILTERS */}
      <div className="rounded-2xl border border-[#E4E5DE] bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_250px_250px]">
          <div className="relative">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9691]"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by student, strand or learning area..."
              className="h-12 w-full rounded-xl border border-[#DDE1DB] bg-[#FAFAF7] pl-11 pr-4 text-sm text-[#17382E] outline-none transition placeholder:text-[#9AA49F] focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10"
            />
          </div>

          <select
            value={learningAreaFilter}
            onChange={(event) =>
              setLearningAreaFilter(event.target.value)
            }
            className="h-12 rounded-xl border border-[#DDE1DB] bg-[#FAFAF7] px-4 text-sm text-[#405650] outline-none transition focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10"
          >
            <option value="">
              All learning areas
            </option>

            {LEARNING_AREAS.map((area) => (
              <option
                key={area.value}
                value={area.value}
              >
                {area.label}
              </option>
            ))}
          </select>

          <select
            value={masteryFilter}
            onChange={(event) =>
              setMasteryFilter(event.target.value)
            }
            className="h-12 rounded-xl border border-[#DDE1DB] bg-[#FAFAF7] px-4 text-sm text-[#405650] outline-none transition focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10"
          >
            <option value="">
              All mastery levels
            </option>

            {MASTERY_LEVELS.map((level) => (
              <option
                key={level.value}
                value={level.value}
              >
                {level.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* RECORDS */}
      <div className="overflow-hidden rounded-2xl border border-[#E4E5DE] bg-white shadow-sm">
        <div className="border-b border-[#E9E8E1] px-6 py-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-[#17382E]">
                Assessment Records
              </h2>

              <p className="mt-1 text-sm text-[#8A9691]">
                {filteredCompetencies.length} record
                {filteredCompetencies.length === 1
                  ? ""
                  : "s"} currently displayed
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-[#6D7B75]">
              <BookOpenCheck size={18} />
              {competencies.length} total
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-[#71807A]">
              <Loader2
                size={20}
                className="animate-spin text-[#0B5D43]"
              />
              Loading assessment records...
            </div>
          </div>
        ) : filteredCompetencies.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0F4EF] text-[#81918A]">
              <BookOpenCheck size={30} />
            </div>

            <h3 className="mt-5 text-base font-bold text-[#17382E]">
              No assessments found
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-[#7C8984]">
              {competencies.length === 0
                ? "Start recording learner competency evidence by adding the first CBC assessment."
                : "There are no competency assessment records matching your current filters."}
            </p>

            {competencies.length === 0 && (
              <button
                type="button"
                onClick={openForm}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0B5D43] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#084936]"
              >
                <ClipboardPlus size={17} />
                Record First Assessment
              </button>
            )}
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-[#E9E8E1] bg-[#FAFAF7] text-left">
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#87948E]">
                      Student
                    </th>

                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#87948E]">
                      Learning Area
                    </th>

                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#87948E]">
                      Strand
                    </th>

                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#87948E]">
                      Mastery
                    </th>

                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#87948E]">
                      Assessment Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCompetencies.map((item) => {
                    const mastery =
                      getMasteryDetails(
                        item.mastery_level
                      );

                    const masteryStyles = {
                      EE: "bg-[#EAF3EE] text-[#0B5D43]",
                      ME: "bg-[#EEF5E8] text-[#668B2E]",
                      AE: "bg-[#FFF7E4] text-[#9A7600]",
                      BE: "bg-[#FFF0EE] text-[#B33A31]",
                    };

                    const studentName =
                      getAssessmentStudentName(item);

                    const admissionNumber =
                      getAssessmentAdmissionNumber(item);

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-[#EEF0EB] last:border-0 hover:bg-[#FCFCF9]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF3EE] text-[#0B5D43]">
                              <GraduationCap size={17} />
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-[#17382E]">
                                {studentName}
                              </p>

                              {admissionNumber && (
                                <p className="mt-0.5 text-xs text-[#9AA49F]">
                                  {admissionNumber}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-[#52645D]">
                          {getLearningAreaLabel(
                            item.learning_area
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-[#405650]">
                            {item.strand}
                          </p>

                          <p className="mt-1 text-xs text-[#9AA49F]">
                            {item.sub_strand}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={[
                              "inline-flex rounded-full px-3 py-1.5 text-xs font-semibold",
                              masteryStyles[
                                item.mastery_level
                              ] ||
                                "bg-[#F1F3EE] text-[#52645D]",
                            ].join(" ")}
                          >
                            {mastery.label}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-[#52645D]">
                            <CalendarDays
                              size={16}
                              className="text-[#8A9691]"
                            />

                            {item.assessed_on}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE RECORDS */}
            <div className="divide-y divide-[#EEF0EB] lg:hidden">
              {filteredCompetencies.map((item) => {
                const mastery =
                  getMasteryDetails(
                    item.mastery_level
                  );

                const masteryStyles = {
                  EE: "bg-[#EAF3EE] text-[#0B5D43]",
                  ME: "bg-[#EEF5E8] text-[#668B2E]",
                  AE: "bg-[#FFF7E4] text-[#9A7600]",
                  BE: "bg-[#FFF0EE] text-[#B33A31]",
                };

                return (
                  <div
                    key={item.id}
                    className="space-y-4 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF3EE] text-[#0B5D43]">
                          <GraduationCap size={18} />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-[#17382E]">
                            {getAssessmentStudentName(
                              item
                            )}
                          </p>

                          <p className="mt-1 text-xs text-[#8A9691]">
                            {getLearningAreaLabel(
                              item.learning_area
                            )}
                          </p>
                        </div>
                      </div>

                      <span
                        className={[
                          "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
                          masteryStyles[
                            item.mastery_level
                          ] ||
                            "bg-[#F1F3EE] text-[#52645D]",
                        ].join(" ")}
                      >
                        {mastery.shortLabel}
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#FAFAF7] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#8A9691]">
                        Strand
                      </p>

                      <p className="mt-1 text-sm font-medium text-[#405650]">
                        {item.strand}
                      </p>

                      <p className="mt-2 text-xs text-[#7C8984]">
                        {item.sub_strand}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#7C8984]">
                      <CalendarDays size={15} />
                      Assessed on {item.assessed_on}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ADD ASSESSMENT MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#03251B]/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#E9E8E1] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3EE] text-[#0B5D43]">
                  <ClipboardPlus size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#17382E]">
                    Add CBC Assessment
                  </h2>

                  <p className="mt-0.5 text-xs text-[#8A9691]">
                    Record competency evidence for a learner.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-[#7C8984] transition hover:bg-[#F1F3EE] hover:text-[#0B5D43]"
                aria-label="Close assessment form"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {formError && (
                <div className="flex items-start gap-3 rounded-xl border border-[#F3C5C1] bg-[#FFF3F1] px-4 py-3 text-sm text-[#B42318]">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="student"
                  className="mb-2 block text-sm font-semibold text-[#405650]"
                >
                  Student{" "}
                  <span className="text-[#B33A31]">*</span>
                </label>

                <select
                  id="student"
                  name="student"
                  value={form.student}
                  onChange={handleFormChange}
                  disabled={studentsLoading}
                  className="h-12 w-full rounded-xl border border-[#DDE1DB] bg-white px-4 text-sm text-[#405650] outline-none transition focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10 disabled:bg-[#F4F5F1]"
                >
                  <option value="">
                    {studentsLoading
                      ? "Loading students..."
                      : students.length === 0
                        ? "No students available"
                        : "Select a student"}
                  </option>

                  {students.map((student) => (
                    <option
                      key={student.id}
                      value={student.id}
                    >
                      {getStudentName(student)}
                      {student.admission_number
                        ? ` — ${student.admission_number}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="learning_area"
                    className="mb-2 block text-sm font-semibold text-[#405650]"
                  >
                    Learning Area{" "}
                    <span className="text-[#B33A31]">*</span>
                  </label>

                  <select
                    id="learning_area"
                    name="learning_area"
                    value={form.learning_area}
                    onChange={handleFormChange}
                    className="h-12 w-full rounded-xl border border-[#DDE1DB] bg-white px-4 text-sm text-[#405650] outline-none transition focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10"
                  >
                    <option value="">
                      Select learning area
                    </option>

                    {LEARNING_AREAS.map((area) => (
                      <option
                        key={area.value}
                        value={area.value}
                      >
                        {area.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="mastery_level"
                    className="mb-2 block text-sm font-semibold text-[#405650]"
                  >
                    Mastery Level{" "}
                    <span className="text-[#B33A31]">*</span>
                  </label>

                  <select
                    id="mastery_level"
                    name="mastery_level"
                    value={form.mastery_level}
                    onChange={handleFormChange}
                    className="h-12 w-full rounded-xl border border-[#DDE1DB] bg-white px-4 text-sm text-[#405650] outline-none transition focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10"
                  >
                    <option value="">
                      Select mastery level
                    </option>

                    {MASTERY_LEVELS.map((level) => (
                      <option
                        key={level.value}
                        value={level.value}
                      >
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="strand"
                    className="mb-2 block text-sm font-semibold text-[#405650]"
                  >
                    Strand{" "}
                    <span className="text-[#B33A31]">*</span>
                  </label>

                  <input
                    id="strand"
                    name="strand"
                    type="text"
                    value={form.strand}
                    onChange={handleFormChange}
                    placeholder="e.g. Numbers"
                    className="h-12 w-full rounded-xl border border-[#DDE1DB] bg-white px-4 text-sm text-[#405650] outline-none transition placeholder:text-[#A0AAA5] focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sub_strand"
                    className="mb-2 block text-sm font-semibold text-[#405650]"
                  >
                    Sub-strand{" "}
                    <span className="text-[#B33A31]">*</span>
                  </label>

                  <input
                    id="sub_strand"
                    name="sub_strand"
                    type="text"
                    value={form.sub_strand}
                    onChange={handleFormChange}
                    placeholder="e.g. Whole numbers"
                    className="h-12 w-full rounded-xl border border-[#DDE1DB] bg-white px-4 py-3 text-sm text-[#405650] outline-none transition placeholder:text-[#A0AAA5] focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="assessed_on"
                  className="mb-2 block text-sm font-semibold text-[#405650]"
                >
                  Assessment Date{" "}
                  <span className="text-[#B33A31]">*</span>
                </label>

                <div className="relative">
                  <CalendarDays
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9691]"
                  />

                  <input
                    id="assessed_on"
                    name="assessed_on"
                    type="date"
                    max={getToday()}
                    value={form.assessed_on}
                    onChange={handleFormChange}
                    className="h-12 w-full rounded-xl border border-[#DDE1DB] bg-white pl-11 pr-4 text-sm text-[#405650] outline-none transition focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="teacher_notes"
                  className="mb-2 block text-sm font-semibold text-[#405650]"
                >
                  Teacher Notes
                </label>

                <textarea
                  id="teacher_notes"
                  name="teacher_notes"
                  value={form.teacher_notes}
                  onChange={handleFormChange}
                  rows={4}
                  placeholder="Add observations, evidence or intervention notes..."
                  className="w-full resize-none rounded-xl border border-[#DDE1DB] bg-white px-4 py-3 text-sm text-[#405650] outline-none transition placeholder:text-[#A0AAA5] focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[#E9E8E1] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={submitting}
                  className="rounded-xl border border-[#DDE1DB] px-5 py-3 text-sm font-semibold text-[#52645D] transition hover:bg-[#F5F6F2] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting || studentsLoading
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B5D43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#084936] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Save Assessment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Competencies;