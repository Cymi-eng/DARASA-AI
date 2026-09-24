import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Plus,
  Search,
  School,
  Users,
  X,
} from "lucide-react";

import api from "../api";

const GRADES = [
  { value: "PP1", label: "PP1" },
  { value: "PP2", label: "PP2" },
  { value: "G1", label: "Grade 1" },
  { value: "G2", label: "Grade 2" },
  { value: "G3", label: "Grade 3" },
  { value: "G4", label: "Grade 4" },
  { value: "G5", label: "Grade 5" },
  { value: "G6", label: "Grade 6" },
];

function getGradeLabel(value) {
  return (
    GRADES.find((grade) => grade.value === value)?.label ||
    value ||
    "—"
  );
}

function extractErrorMessage(error, fallback) {
  const data = error?.response?.data;

  if (!data) {
    return fallback;
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

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

function Classrooms() {
  const [classrooms, setClassrooms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    grade: "",
  });

  async function loadClassrooms() {
    setLoading(true);
    setError("");

    try {
      const params = {};

      if (gradeFilter) {
        params.grade = gradeFilter;
      }

      const response = await api.get("/classrooms/", {
        params,
      });

      const data = response.data;

      setClassrooms(
        Array.isArray(data)
          ? data
          : data.results || []
      );
    } catch (requestError) {
      setError(
        extractErrorMessage(
          requestError,
          "Unable to load classrooms."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClassrooms();
  }, [gradeFilter]);

  const filteredClassrooms = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return classrooms;
    }

    return classrooms.filter((classroom) => {
      return [
        classroom.name,
        getGradeLabel(classroom.grade),
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query)
        );
    });
  }, [classrooms, search]);

  const gradeCounts = useMemo(() => {
    return GRADES.reduce((counts, grade) => {
      counts[grade.value] = classrooms.filter(
        (classroom) =>
          classroom.grade === grade.value
      ).length;

      return counts;
    }, {});
  }, [classrooms]);

  function openForm() {
    setFormError("");
    setSuccessMessage("");

    setForm({
      name: "",
      grade: "",
    });

    setShowForm(true);
  }

  function closeForm() {
    if (submitting) {
      return;
    }

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

    const classroomName = form.name.trim();

    if (!classroomName || !form.grade) {
      setFormError(
        "Please provide both the classroom name and grade."
      );
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/classrooms/", {
        name: classroomName,
        grade: form.grade,
      });

      setShowForm(false);

      setSuccessMessage(
        `${classroomName} was created successfully.`
      );

      await loadClassrooms();
    } catch (requestError) {
      setFormError(
        extractErrorMessage(
          requestError,
          "Unable to create classroom."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-7">
      {/* HEADER */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B5D43]">
            Academic Structure
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#12382D] sm:text-4xl">
            Classrooms
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71807A] sm:text-base">
            Organize learners into classrooms and maintain
            your school's CBC grade structure.
          </p>
        </div>

        <button
          type="button"
          onClick={openForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B5D43] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#084936] focus:outline-none focus:ring-4 focus:ring-[#0B5D43]/15"
        >
          <Plus size={19} />
          Add Classroom
        </button>
      </div>

      {/* SUCCESS */}
      {successMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-[#BBDCCB] bg-[#EDF8F1] px-4 py-3 text-sm text-[#17633F]">
          <CheckCircle2
            size={19}
            className="mt-0.5 shrink-0"
          />

          <span>{successMessage}</span>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-[#F3C5C1] bg-[#FFF3F1] px-4 py-3 text-sm text-[#B42318]">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-semibold">
              Classrooms could not be loaded
            </p>

            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* STATS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#E4E5DE] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3EE] text-[#0B5D43]">
              <School size={21} />
            </div>

            <span className="text-2xl font-bold text-[#12382D]">
              {classrooms.length}
            </span>
          </div>

          <p className="mt-5 text-sm font-semibold text-[#17382E]">
            Total Classrooms
          </p>

          <p className="mt-1 text-xs text-[#8A9691]">
            Active classroom records
          </p>
        </div>

        <div className="rounded-2xl border border-[#E4E5DE] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF7E4] text-[#B58A00]">
              <GraduationCap size={21} />
            </div>

            <span className="text-2xl font-bold text-[#12382D]">
              {classrooms.filter((classroom) =>
                ["PP1", "PP2"].includes(
                  classroom.grade
                )
              ).length}
            </span>
          </div>

          <p className="mt-5 text-sm font-semibold text-[#17382E]">
            Pre-Primary
          </p>

          <p className="mt-1 text-xs text-[#8A9691]">
            PP1 and PP2 classrooms
          </p>
        </div>

        <div className="rounded-2xl border border-[#E4E5DE] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF5E8] text-[#668B2E]">
              <GraduationCap size={21} />
            </div>

            <span className="text-2xl font-bold text-[#12382D]">
              {classrooms.filter((classroom) =>
                ["G1", "G2", "G3"].includes(
                  classroom.grade
                )
              ).length}
            </span>
          </div>

          <p className="mt-5 text-sm font-semibold text-[#17382E]">
            Lower Primary
          </p>

          <p className="mt-1 text-xs text-[#8A9691]">
            Grades 1–3 classrooms
          </p>
        </div>

        <div className="rounded-2xl border border-[#E4E5DE] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EEF8] text-[#69549A]">
              <GraduationCap size={21} />
            </div>

            <span className="text-2xl font-bold text-[#12382D]">
              {classrooms.filter((classroom) =>
                ["G4", "G5", "G6"].includes(
                  classroom.grade
                )
              ).length}
            </span>
          </div>

          <p className="mt-5 text-sm font-semibold text-[#17382E]">
            Upper Primary
          </p>

          <p className="mt-1 text-xs text-[#8A9691]">
            Grades 4–6 classrooms
          </p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="rounded-2xl border border-[#E4E5DE] bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
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
              placeholder="Search classrooms..."
              className="h-12 w-full rounded-xl border border-[#DDE1DB] bg-[#FAFAF7] pl-11 pr-4 text-sm text-[#17382E] outline-none transition placeholder:text-[#9AA49F] focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10"
            />
          </div>

          <select
            value={gradeFilter}
            onChange={(event) =>
              setGradeFilter(event.target.value)
            }
            className="h-12 rounded-xl border border-[#DDE1DB] bg-[#FAFAF7] px-4 text-sm text-[#405650] outline-none transition focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10"
          >
            <option value="">All grades</option>

            {GRADES.map((grade) => (
              <option
                key={grade.value}
                value={grade.value}
              >
                {grade.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CLASSROOM DIRECTORY */}
      <div className="overflow-hidden rounded-2xl border border-[#E4E5DE] bg-white shadow-sm">
        <div className="border-b border-[#E9E8E1] px-6 py-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-[#17382E]">
                Classroom Directory
              </h2>

              <p className="mt-1 text-sm text-[#8A9691]">
                {filteredClassrooms.length} classroom
                {filteredClassrooms.length === 1
                  ? ""
                  : "s"} displayed
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-[#6D7B75]">
              <School size={18} />
              {classrooms.length} total
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
              Loading classrooms...
            </div>
          </div>
        ) : filteredClassrooms.length === 0 ? (
          <div className="flex min-h-[330px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0F4EF] text-[#81918A]">
              <School size={30} />
            </div>

            <h3 className="mt-5 text-base font-bold text-[#17382E]">
              No classrooms found
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-[#7C8984]">
              {classrooms.length === 0
                ? "Create your first classroom to start organizing learners."
                : "No classrooms match your current search or grade filter."}
            </p>

            {classrooms.length === 0 && (
              <button
                type="button"
                onClick={openForm}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0B5D43] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#084936]"
              >
                <Plus size={17} />
                Add First Classroom
              </button>
            )}
          </div>
        ) : (
          <>
            {/* DESKTOP */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#E9E8E1] bg-[#FAFAF7] text-left">
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#87948E]">
                      Classroom
                    </th>

                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#87948E]">
                      Grade
                    </th>

                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#87948E]">
                      Students
                    </th>

                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#87948E]">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredClassrooms.map(
                    (classroom) => (
                      <tr
                        key={classroom.id}
                        className="border-b border-[#EEF0EB] last:border-0 hover:bg-[#FCFCF9]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3EE] text-[#0B5D43]">
                              <School size={19} />
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-[#17382E]">
                                {classroom.name}
                              </p>

                              <p className="mt-0.5 text-xs text-[#9AA49F]">
                                Classroom #{classroom.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-full bg-[#EAF3EE] px-3 py-1.5 text-xs font-semibold text-[#0B5D43]">
                            {getGradeLabel(
                              classroom.grade
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-[#52645D]">
                            <Users size={17} />
                            {classroom.student_count ??
                              classroom.students_count ??
                              0}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDF8F1] px-3 py-1.5 text-xs font-semibold text-[#17633F]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#2E8B57]" />
                            Active
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE */}
            <div className="divide-y divide-[#EEF0EB] lg:hidden">
              {filteredClassrooms.map(
                (classroom) => (
                  <div
                    key={classroom.id}
                    className="space-y-4 p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF3EE] text-[#0B5D43]">
                        <School size={20} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#17382E]">
                          {classroom.name}
                        </p>

                        <p className="mt-1 text-xs text-[#8A9691]">
                          Classroom #{classroom.id}
                        </p>
                      </div>

                      <span className="ml-auto shrink-0 rounded-full bg-[#EAF3EE] px-3 py-1.5 text-xs font-semibold text-[#0B5D43]">
                        {getGradeLabel(
                          classroom.grade
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[#FAFAF7] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8A9691]">
                          Students
                        </p>

                        <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[#405650]">
                          <Users size={15} />
                          {classroom.student_count ??
                            classroom.students_count ??
                            0}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#EDF8F1] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8A9691]">
                          Status
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#17633F]">
                          Active
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>

      {/* ADD CLASSROOM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#03251B]/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between border-b border-[#E9E8E1] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3EE] text-[#0B5D43]">
                  <School size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#17382E]">
                    Add Classroom
                  </h2>

                  <p className="mt-0.5 text-xs text-[#8A9691]">
                    Create a new classroom for your school.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-[#7C8984] transition hover:bg-[#F1F3EE] hover:text-[#0B5D43]"
                aria-label="Close classroom form"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}
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
                  htmlFor="classroom-name"
                  className="mb-2 block text-sm font-semibold text-[#405650]"
                >
                  Classroom Name{" "}
                  <span className="text-[#B33A31]">*</span>
                </label>

                <input
                  id="classroom-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="e.g. Sunrise"
                  autoFocus
                  className="h-12 w-full rounded-xl border border-[#DDE1DB] bg-white px-4 text-sm text-[#405650] outline-none transition placeholder:text-[#A0AAA5] focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10"
                />

                <p className="mt-2 text-xs text-[#8A9691]">
                  Use a clear classroom name such as
                  Sunrise, Green or Grade 3 East.
                </p>
              </div>

              <div>
                <label
                  htmlFor="classroom-grade"
                  className="mb-2 block text-sm font-semibold text-[#405650]"
                >
                  Grade{" "}
                  <span className="text-[#B33A31]">*</span>
                </label>

                <select
                  id="classroom-grade"
                  name="grade"
                  value={form.grade}
                  onChange={handleFormChange}
                  className="h-12 w-full rounded-xl border border-[#DDE1DB] bg-white px-4 text-sm text-[#405650] outline-none transition focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10"
                >
                  <option value="">
                    Select grade
                  </option>

                  {GRADES.map((grade) => (
                    <option
                      key={grade.value}
                      value={grade.value}
                    >
                      {grade.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ACTIONS */}
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
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B5D43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#084936] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Create Classroom
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

export default Classrooms;